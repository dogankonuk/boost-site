import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendContactFormAdminEmail } from '@/lib/email'
import { notifyAdminsContactMessage } from '@/lib/notify'
import { getClientIp, rateLimit } from '@/lib/rateLimit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request) {
  try {
    const ip = getClientIp(request)
    const ipCheck = rateLimit(`contact:ip:${ip}`, { maxAttempts: 5, windowMs: 60 * 60 * 1000 })
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many messages. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : ''
    const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim().slice(0, 50) : ''
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : ''

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: 'Name, email, and message are required' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 })
    }

    // Persist first: email and notifications are delivery conveniences, not
    // the source of truth. A provider outage must never lose the message.
    const contactMessage = await prisma.contactMessage.create({
      data: { name, email, orderNumber: orderNumber || null, message },
    })

    await Promise.allSettled([
      sendContactFormAdminEmail({ name, email, orderNumber, message }),
      notifyAdminsContactMessage(prisma, { id: contactMessage.id, name, orderNumber }),
    ])

    return NextResponse.json({ success: true, data: { id: contactMessage.id } }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
