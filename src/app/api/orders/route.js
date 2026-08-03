import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sendOrderConfirmation } from '@/lib/email'

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
    detailText = `Seçenek: ${selection.choice}`
  }


  const embed = {
    title: '🎮 Yeni Sipariş!',
    color: 0xF5C518,
    fields: [
      { name: '📋 Sipariş No', value: order.orderNumber, inline: true },
      { name: '👤 Kullanıcı', value: order.user?.username || 'Bilinmiyor', inline: true },
      { name: '🎯 Oyun', value: order.service?.game?.name || '-', inline: true },
      { name: '⚡ Hizmet', value: order.service?.name || '-', inline: true },
      { name: '💰 Fiyat', value: `$${order.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, inline: true },
      { name: '📊 Detay', value: detailText || 'Sabit hizmet', inline: true },
      ...(details.note ? [{ name: '📝 Not', value: details.note, inline: false }] : []),
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
    console.error('Discord webhook hatası:', err)
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
    const { serviceId, details } = body

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId is required' },
        { status: 400 }
      )
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { game: true }
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    const finalPrice = details?.calculatedPrice || service.basePrice

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.userId,
        serviceId,
        price: finalPrice,
        currency: 'USD',
        details: details || {},
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
        data: { status: 'cancelled' },
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