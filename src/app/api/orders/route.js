import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sendOrderConfirmation } from '@/lib/email'
import { calculatePrice, calculateAddonsCost, resolveAddonsSnapshot, resolveBestDiscount, isCampaignEligible, isCouponEligible, round2 } from '@/lib/pricing'
import { getLoyaltyTier, pointsFromSpend } from '@/lib/loyalty'

const CANCELLABLE_STATUSES = ['pending', 'assigned']

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar'

function getUserFromToken(request) {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  try {
    return jwt.verify(auth.split(' ')[1], JWT_SECRET)
  } catch {
    return null
  }
}

function generateOrderNumber() {
  return 'BST-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

async function sendDiscordNotification(order) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return

  const details = order.details || {}
  const selection = details.selection || {}
  const options = order.service?.options

  let detailText = ''
  if (options?.type === 'range') {
    detailText = `${selection.from} → ${selection.to} ${options.unitName}`
  } else if (options?.type === 'quantity') {
    detailText = `${selection.quantity} × ${options.unitName}`
  } else if (options?.type === 'options') {
    detailText = `Option: ${selection.choice}`
  }

  const addonsText = details.selectedAddons
    ? Object.values(details.selectedAddons).map(g => `${g.label}: ${g.values.map(v => v.label).join(', ')}`).join('\n')
    : ''

  const embed = {
    title: '🎮 New Order!',
    color: 0xF5C518,
    fields: [
      { name: '📋 Order #', value: order.orderNumber, inline: true },
      { name: '👤 User', value: order.user?.username || 'Unknown', inline: true },
      { name: '🎯 Game', value: order.service?.game?.name || '-', inline: true },
      { name: '⚡ Service', value: order.service?.name || '-', inline: true },
      { name: '💰 Price', value: `$${order.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, inline: true },
      { name: '📊 Details', value: detailText || 'Fixed service', inline: true },
      ...(addonsText ? [{ name: '➕ Add-ons', value: addonsText, inline: false }] : []),
      ...(details.note ? [{ name: '📝 Note', value: details.note, inline: false }] : []),
    ],
    footer: { text: 'ShadowBoosting.co' },
    timestamp: new Date().toISOString(),
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch (err) {
    console.error('Discord webhook error:', err)
  }
}

export async function GET(request) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      include: {
        service: {
          include: { game: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceId, details, couponCode } = body

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId is required' },
        { status: 400 }
      )
    }

    const now = new Date()
    const [service, dbUser, activeCampaigns] = await Promise.all([
      prisma.service.findUnique({
        where: { id: serviceId },
        include: { game: true }
      }),
      prisma.user.findUnique({
        where: { id: user.userId },
        select: { bonusPoints: true, orders: { where: { status: { not: 'cancelled' } }, select: { price: true } } },
      }),
      prisma.campaign.findMany({
        where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      }),
    ])

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    // Price is always recomputed here from the service's own pricing rules —
    // details.calculatedPrice (client-sent) is never trusted for the charge.
    // Addon choices (delivery method, priority speed, extra items, etc.) are
    // the same: only the raw selected values are trusted, cost and labels
    // are always resolved server-side from the service's own addon defs.
    const selection = details?.selection || {}
    const selectedAddons = details?.selectedAddons || {}
    const servicePrice = calculatePrice(service.options, service.basePrice, selection)
    const addonsCost = calculateAddonsCost(service.addons, selectedAddons, servicePrice)
    const addonsSnapshot = resolveAddonsSnapshot(service.addons, selectedAddons, servicePrice)
    const basePrice = round2(servicePrice + addonsCost)

    const totalSpent = dbUser.orders.reduce((sum, o) => sum + o.price, 0)
    const points = pointsFromSpend(totalSpent) + (dbUser.bonusPoints || 0)
    const loyaltyPct = getLoyaltyTier(points).discount

    const campaign = activeCampaigns.find(c => isCampaignEligible(c, service.gameId))
    const campaignPct = campaign?.discountPct || 0

    let coupon = null
    if (couponCode) {
      const found = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } })
      const userRedemptionCount = found
        ? await prisma.order.count({ where: { userId: user.userId, couponId: found.id } })
        : 0
      const check = isCouponEligible(found, { gameId: service.gameId, subtotal: basePrice, userRedemptionCount })
      if (!check.ok) {
        return NextResponse.json({ success: false, error: check.error }, { status: 400 })
      }
      coupon = found
    }

    const { finalPrice, discountAmount, source } = resolveBestDiscount({ basePrice, loyaltyPct, campaignPct, coupon })

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: user.userId,
          serviceId,
          price: finalPrice,
          originalPrice: basePrice,
          discountAmount,
          discountSource: source,
          couponId: source === 'coupon' ? coupon.id : null,
          couponCode: source === 'coupon' ? coupon.code : null,
          currency: 'USD',
          details: {
            ...(details || {}),
            selectedAddons: addonsSnapshot,
            addonsCost,
          },
        },
        include: {
          service: {
            include: { game: true }
          },
          user: {
            select: { username: true, email: true }
          }
        }
      })
      if (source === 'coupon') {
        await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
      }
      return created
    })

    await sendDiscordNotification(order)

    await sendOrderConfirmation({
      to: order.user?.email,
      username: order.user?.username,
      orderNumber: order.orderNumber,
      gameName: order.service?.game?.name,
      serviceName: order.service?.name,
      price: order.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      details: (() => {
        const sel = details?.selection
        const opts = order.service?.options
        if (!sel || !opts) return null
        if (opts.type === 'range') return `${sel.from} → ${sel.to} ${opts.unitName}`
        if (opts.type === 'quantity') return `${sel.quantity} × ${opts.unitName}`
        if (opts.type === 'options') return sel.choice
        return null
      })(),
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

// Customer rates a completed order, or cancels a pending/assigned one, of theirs
export async function PATCH(request) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (body.action === 'cancel') {
      const orderId = parseInt(body.orderId)
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { service: { include: { game: true } }, booster: { include: { user: true } } },
      })
      if (!order || order.userId !== user.userId) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }
      if (!CANCELLABLE_STATUSES.includes(order.status)) {
        return NextResponse.json({ success: false, error: 'This order can no longer be cancelled' }, { status: 400 })
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled', cancelledAt: new Date() },
      })

      if (order.booster?.user) {
        try {
          await prisma.notification.create({
            data: {
              userId: order.booster.user.id,
              type: 'order_status',
              title: 'An order was cancelled by the customer',
              body: `${order.service?.game?.name || ''} — ${order.service?.name || ''}`.trim(),
              link: '/booster',
            },
          })
        } catch (err) {
          console.error('cancel notification error:', err)
        }
      }

      return NextResponse.json({ success: true, data: updated })
    }

    if (body.action === 'reportIssue') {
      const orderId = parseInt(body.orderId)
      const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : ''

      if (!message) {
        return NextResponse.json({ success: false, error: 'Please describe the issue' }, { status: 400 })
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { service: { include: { game: true } }, booster: { include: { user: true } } },
      })
      if (!order || order.userId !== user.userId) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { issueReport: message, issueReportedAt: new Date(), issueResolved: false },
      })

      if (order.booster?.user) {
        try {
          await prisma.notification.create({
            data: {
              userId: order.booster.user.id,
              type: 'order_status',
              title: 'Customer reported an issue with this order',
              body: `${order.service?.game?.name || ''} — ${order.service?.name || ''}`.trim(),
              link: '/booster',
            },
          })
        } catch (err) {
          console.error('issue report notification error:', err)
        }
      }

      return NextResponse.json({ success: true, data: updated })
    }

    const orderId = parseInt(body.orderId)
    const rating = parseInt(body.rating)
    const review = typeof body.review === 'string' ? body.review.slice(0, 1000) : null

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order || order.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }
    if (order.status !== 'completed') {
      return NextResponse.json({ success: false, error: 'Only completed orders can be rated' }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { rating, review, ratedAt: new Date() },
    })

    if (order.boosterId) {
      const agg = await prisma.order.aggregate({
        where: { boosterId: order.boosterId, rating: { not: null } },
        _avg: { rating: true },
      })
      await prisma.booster.update({
        where: { id: order.boosterId },
        data: { rating: agg._avg.rating || 0 },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}