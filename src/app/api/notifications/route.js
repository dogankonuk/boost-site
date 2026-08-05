import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

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

export async function GET(request) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'list'

    if (type === 'unreadCount') {
      const count = await prisma.notification.count({
        where: { userId: user.userId, isRead: false },
      })
      return NextResponse.json({ success: true, data: { count } })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    return NextResponse.json({ success: true, data: notifications })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (body.action === 'markAllRead') {
      await prisma.notification.updateMany({
        where: { userId: user.userId, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (body.action === 'markRead' && body.id) {
      // Scope the update to this user so nobody can mark someone else's notification as read
      await prisma.notification.updateMany({
        where: { id: parseInt(body.id), userId: user.userId },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (body.action === 'markReadForOrder' && body.orderId) {
      // Message notification links always end with orderId=<id>, so endsWith
      // pins the match exactly (avoids e.g. orderId=6 matching orderId=60).
      await prisma.notification.updateMany({
        where: {
          userId: user.userId,
          type: 'message',
          isRead: false,
          link: { endsWith: `orderId=${parseInt(body.orderId)}` },
        },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Notifications PATCH error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
