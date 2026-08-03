import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sendOrderStatusUpdate } from '@/lib/email'
import { notifyOrderStatus, notifyOrderReleased } from '@/lib/notify'

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

async function getBoosterForUser(userId) {
  return prisma.booster.findUnique({ where: { userId } })
}

export async function GET(request) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const booster = await getBoosterForUser(user.userId)

    // "me" is always allowed to check, even if inactive/nonexistent —
    // the client needs this to decide what to show.
    if (type === 'me') {
      if (!booster) return NextResponse.json({ success: true, data: null })
      const completedCount = await prisma.order.count({
        where: { boosterId: booster.id, status: 'completed' },
      })
      return NextResponse.json({ success: true, data: { ...booster, completedCount } })
    }

    if (!booster || booster.status !== 'active') {
      return NextResponse.json({ success: false, error: 'You do not have booster access' }, { status: 403 })
    }

    if (type === 'pool') {
      const games = Array.isArray(booster.games) ? booster.games : null
      const orders = await prisma.order.findMany({
        where: {
          boosterId: null,
          status: 'pending',
          ...(games && games.length > 0 ? { service: { gameId: { in: games } } } : {}),
        },
        include: {
          user: { select: { username: true } },
          service: { include: { game: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json({ success: true, data: orders })
    }

    if (type === 'mine') {
      const orders = await prisma.order.findMany({
        where: { boosterId: booster.id },
        include: {
          user: { select: { username: true } },
          service: { include: { game: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ success: true, data: orders })
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Booster GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Claim an unassigned order from the pool
export async function POST(request) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const booster = await getBoosterForUser(user.userId)
    if (!booster || booster.status !== 'active') {
      return NextResponse.json({ success: false, error: 'You do not have booster access' }, { status: 403 })
    }

    const body = await request.json()
    const orderId = parseInt(body.orderId)

    // Atomic-ish claim: the update only matches (and succeeds) if the order
    // is still unassigned, so two boosters can't both claim the same order.
    const result = await prisma.order.updateMany({
      where: { id: orderId, boosterId: null },
      data: { boosterId: booster.id, status: 'assigned', assignedAt: new Date() },
    })

    if (result.count === 0) {
      return NextResponse.json({ success: false, error: 'This order is no longer available' }, { status: 409 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { username: true, email: true } },
        service: { include: { game: true } },
      },
    })

    try {
      await sendOrderStatusUpdate({
        to: order.user?.email,
        username: order.user?.username,
        orderNumber: order.orderNumber,
        gameName: order.service?.game?.name,
        serviceName: order.service?.name,
        status: 'assigned',
      })
    } catch {}
    await notifyOrderStatus(prisma, order, 'assigned')

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Booster claim error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Update the status of an order this booster owns
export async function PATCH(request) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const booster = await getBoosterForUser(user.userId)
    if (!booster || booster.status !== 'active') {
      return NextResponse.json({ success: false, error: 'You do not have booster access' }, { status: 403 })
    }

    const body = await request.json()

    // Profile update: booster setting their own Discord ID
    if (body.discordId !== undefined && !body.orderId) {
      const updated = await prisma.booster.update({
        where: { id: booster.id },
        data: { discordId: body.discordId || null },
      })
      return NextResponse.json({ success: true, data: updated })
    }

    if (body.action === 'release') {
      const releaseOrderId = parseInt(body.orderId)
      const existingRelease = await prisma.order.findUnique({ where: { id: releaseOrderId } })
      if (!existingRelease || existingRelease.boosterId !== booster.id) {
        return NextResponse.json({ success: false, error: 'This order is not assigned to you' }, { status: 403 })
      }
      if (!['assigned', 'in_progress'].includes(existingRelease.status)) {
        return NextResponse.json({ success: false, error: 'This order can no longer be released' }, { status: 400 })
      }

      const releasedOrder = await prisma.order.update({
        where: { id: releaseOrderId },
        data: { status: 'pending', boosterId: null, assignedAt: null, startedAt: null },
        include: {
          user: { select: { username: true, email: true } },
          service: { include: { game: true } },
        },
      })

      try {
        await sendOrderStatusUpdate({
          to: releasedOrder.user?.email,
          username: releasedOrder.user?.username,
          orderNumber: releasedOrder.orderNumber,
          gameName: releasedOrder.service?.game?.name,
          serviceName: releasedOrder.service?.name,
          status: 'pending',
        })
      } catch {}
      await notifyOrderReleased(prisma, releasedOrder)

      return NextResponse.json({ success: true, data: releasedOrder })
    }

    const orderId = parseInt(body.orderId)
    const status = body.status

    const allowedStatuses = ['in_progress', 'completed']
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } })
    if (!existing || existing.boosterId !== booster.id) {
      return NextResponse.json({ success: false, error: 'This order is not assigned to you' }, { status: 403 })
    }

    const timelineData = {}
    if (status === 'in_progress' && !existing.startedAt) timelineData.startedAt = new Date()
    if (status === 'completed') timelineData.completedAt = new Date()

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status, ...timelineData },
      include: {
        user: { select: { username: true, email: true } },
        service: { include: { game: true } },
      },
    })

    if (status === 'completed') {
      await prisma.booster.update({
        where: { id: booster.id },
        data: { completedCount: { increment: 1 } },
      })
    }

    try {
      await sendOrderStatusUpdate({
        to: order.user?.email,
        username: order.user?.username,
        orderNumber: order.orderNumber,
        gameName: order.service?.game?.name,
        serviceName: order.service?.name,
        status,
      })
    } catch {}
    await notifyOrderStatus(prisma, order, status)

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Booster PATCH error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
