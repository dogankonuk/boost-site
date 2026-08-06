import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { notifyNewMessage } from '@/lib/notify'
import { sendNewMessageEmail } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar'

// Orders in these statuses are done — no more back-and-forth, only rating/review applies.
const CLOSED_STATUSES = ['completed', 'cancelled']

function getUserFromToken(request) {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  try {
    return jwt.verify(auth.split(' ')[1], JWT_SECRET)
  } catch {
    return null
  }
}

// Returns the order (with booster->user) if the given user is allowed to
// message on it (they're the customer, or the assigned booster), else null.
async function getAuthorizedOrder(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      booster: { include: { user: true } },
      user: { select: { id: true, username: true, email: true } },
    },
  })
  if (!order) return null
  const isCustomer = order.userId === userId
  const isAssignedBooster = order.booster?.user?.id === userId
  if (!isCustomer && !isAssignedBooster) return null
  return order
}

export async function GET(request) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const orderId = parseInt(searchParams.get('orderId'))
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 })
    }

    const order = await getAuthorizedOrder(orderId, user.userId)
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { orderId },
      include: { sender: { select: { username: true } } },
      orderBy: { createdAt: 'asc' },
    })

    const data = messages.map(m => ({ ...m, isMine: m.senderId === user.userId }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const orderId = parseInt(body.orderId)
    const text = typeof body.body === 'string' ? body.body.trim().slice(0, 2000) : ''

    if (!orderId || !text) {
      return NextResponse.json({ success: false, error: 'orderId and body are required' }, { status: 400 })
    }

    const order = await getAuthorizedOrder(orderId, user.userId)
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }
    if (CLOSED_STATUSES.includes(order.status)) {
      return NextResponse.json({ success: false, error: 'This order is closed and can no longer be messaged' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: { orderId, senderId: user.userId, body: text },
      include: { sender: { select: { username: true } } },
    })

    const isCustomer = order.userId === user.userId
    const recipient = isCustomer ? order.booster?.user : order.user

    // No booster assigned yet means there's no one to notify — the message
    // is just recorded and will be visible once someone claims the order.
    if (recipient) {
      const link = isCustomer ? `/booster?orderId=${orderId}` : `/dashboard?tab=orders&orderId=${orderId}`
      await notifyNewMessage(prisma, {
        recipientUserId: recipient.id,
        senderUsername: message.sender.username,
        orderNumber: order.orderNumber,
        link,
      })
      if (recipient.email) {
        sendNewMessageEmail({
          to: recipient.email,
          username: recipient.username,
          senderUsername: message.sender.username,
          orderNumber: order.orderNumber,
          messagePreview: text,
          link,
        }).catch(err => console.error('new message email error:', err))
      }
    }

    return NextResponse.json({ success: true, data: { ...message, isMine: true } }, { status: 201 })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
