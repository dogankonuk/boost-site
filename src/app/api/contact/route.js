import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendContactFormAdminEmail } from '@/lib/email'
import { notifyAdminsContactMessage } from '@/lib/notify'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request) {
  try {
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

    try {
      await sendContactFormAdminEmail({ name, email, orderNumber, message })
    } catch (err) {
      console.error('contact form admin email error:', err)
    }
    await notifyAdminsContactMessage(prisma, { name, orderNumber })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
