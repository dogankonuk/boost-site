import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { calculatePrice, isCouponEligible, round2 } from '@/lib/pricing'

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

async function requireAdmin(request) {
  const user = getUserFromToken(request)
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } })
  if (!(dbUser && dbUser.isAdmin && dbUser.isActive)) return null
  return dbUser
}

// Admin coupon list
export async function GET(request) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const coupons = await prisma.coupon.findMany({
    include: { game: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ success: true, data: coupons })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    // Customer-facing: preview a code's discount before placing the order.
    // The authoritative check happens again in /api/orders — this is a preview only.
    if (action === 'validate') {
      const user = getUserFromToken(request)
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
      const { code, serviceId, selection } = body
      if (!code || !serviceId) {
        return NextResponse.json({ success: false, error: 'Missing code or service' }, { status: 400 })
      }

      const service = await prisma.service.findUnique({ where: { id: parseInt(serviceId) } })
      if (!service) {
        return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
      }

      const basePrice = calculatePrice(service.options, service.basePrice, selection || {})
      const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } })
      const userRedemptionCount = coupon
        ? await prisma.order.count({ where: { userId: user.userId, couponId: coupon.id } })
        : 0
      const check = isCouponEligible(coupon, { gameId: service.gameId, subtotal: basePrice, userRedemptionCount })
      if (!check.ok) {
        return NextResponse.json({ success: false, error: check.error }, { status: 400 })
      }

      const discountAmount = coupon.type === 'percent'
        ? round2(basePrice * (coupon.value / 100))
        : Math.min(coupon.value, basePrice)

      return NextResponse.json({
        success: true,
        data: {
          code: coupon.code, type: coupon.type, value: coupon.value,
          discountAmount: round2(discountAmount),
          finalPrice: round2(Math.max(0, basePrice - discountAmount)),
        },
      })
    }

    // Everything else is admin coupon management.
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'create') {
      const { code, type, value, minSpend, maxUses, perUserLimit, gameId, startsAt, expiresAt } = body
      if (!code || !type || value === undefined || value === '') {
        return NextResponse.json({ success: false, error: 'Code, type and value are required' }, { status: 400 })
      }
      try {
        const coupon = await prisma.coupon.create({
          data: {
            code: code.trim().toUpperCase(),
            type,
            value: parseFloat(value),
            minSpend: minSpend ? parseFloat(minSpend) : null,
            maxUses: maxUses ? parseInt(maxUses) : null,
            perUserLimit: perUserLimit !== '' && perUserLimit != null ? parseInt(perUserLimit) : null,
            gameId: gameId ? parseInt(gameId) : null,
            startsAt: startsAt ? new Date(startsAt) : null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        })
        return NextResponse.json({ success: true, data: coupon }, { status: 201 })
      } catch (err) {
        if (err.code === 'P2002') {
          return NextResponse.json({ success: false, error: 'This code is already in use' }, { status: 400 })
        }
        throw err
      }
    }

    if (action === 'update') {
      const { id } = body
      const data = {}
      if (body.isActive !== undefined) data.isActive = body.isActive
      if (body.value !== undefined && body.value !== '') data.value = parseFloat(body.value)
      if (body.minSpend !== undefined) data.minSpend = body.minSpend === '' ? null : parseFloat(body.minSpend)
      if (body.maxUses !== undefined) data.maxUses = body.maxUses === '' ? null : parseInt(body.maxUses)
      if (body.perUserLimit !== undefined) data.perUserLimit = body.perUserLimit === '' ? null : parseInt(body.perUserLimit)
      if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

      const coupon = await prisma.coupon.update({ where: { id: parseInt(id) }, data })
      return NextResponse.json({ success: true, data: coupon })
    }

    if (action === 'delete') {
      await prisma.coupon.delete({ where: { id: parseInt(body.id) } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
