import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar'
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

function createToken() {
  const raw = crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, email, username, password, agreedToTerms } = body
    const ip = getClientIp(request)

    if (action === 'login') {
      const ipCheck = rateLimit(`login:ip:${ip}`, { maxAttempts: 10, windowMs: 5 * 60 * 1000 })
      const emailCheck = email
        ? rateLimit(`login:email:${email.toLowerCase()}`, { maxAttempts: 6, windowMs: 15 * 60 * 1000 })
        : { allowed: true }
      if (!ipCheck.allowed || !emailCheck.allowed) {
        return NextResponse.json(
          { success: false, error: 'Too many login attempts. Please try again in a few minutes.' },
          { status: 429 }
        )
      }
    }

    if (action === 'register') {
      const ipCheck = rateLimit(`register:ip:${ip}`, { maxAttempts: 5, windowMs: 60 * 60 * 1000 })
      if (!ipCheck.allowed) {
        return NextResponse.json(
          { success: false, error: 'Too many accounts created from this location. Please try again later.' },
          { status: 429 }
        )
      }
    }

    if (action === 'forgotPassword') {
      const ipCheck = rateLimit(`forgot:ip:${ip}`, { maxAttempts: 8, windowMs: 60 * 60 * 1000 })
      const emailCheck = email
        ? rateLimit(`forgot:email:${email.toLowerCase()}`, { maxAttempts: 3, windowMs: 60 * 60 * 1000 })
        : { allowed: true }
      if (!ipCheck.allowed || !emailCheck.allowed) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      }
    }

    if (action === 'register') {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters long' },
          { status: 400 }
        )
      }

      if (!agreedToTerms) {
        return NextResponse.json(
          { success: false, error: 'You must agree to the Terms of Service and Privacy Policy' },
          { status: 400 }
        )
      }

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'This email or username is already in use' },
          { status: 400 }
        )
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const { raw: verificationToken, hash: verificationTokenHash } = createToken()
      const user = await prisma.user.create({
        data: {
          email, username, passwordHash,
          verificationTokenHash,
          verificationTokenExpiry: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
          termsAcceptedAt: new Date(),
        }
      })

      const origin = new URL(request.url).origin
      await sendVerificationEmail({
        to: user.email,
        username: user.username,
        link: `${origin}/verify-email?token=${verificationToken}`,
      })

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return NextResponse.json({
        success: true,
        data: { token, username: user.username, email: user.email }
      }, { status: 201 })
    }

    if (action === 'login') {
      const user = await prisma.user.findFirst({
        where: { OR: [{ email }, { username: email }] }
      })

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      if (!user.isActive) {
        return NextResponse.json(
          { success: false, error: 'This account has been deactivated. Please contact support.' },
          { status: 403 }
        )
      }

      if (!user.passwordHash) {
        return NextResponse.json(
          { success: false, error: `This account signs in with ${user.oauthProvider || 'a social account'}. Please use that option instead.` },
          { status: 400 }
        )
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password' },
          { status: 401 }
        )
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return NextResponse.json({
        success: true,
        data: { token, username: user.username, email: user.email }
      })
    }

    if (action === 'forgotPassword') {
      const user = await prisma.user.findUnique({ where: { email } })

      if (user) {
        const { raw: resetToken, hash: resetTokenHash } = createToken()
        await prisma.user.update({
          where: { id: user.id },
          data: { resetTokenHash, resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
        })

        const origin = new URL(request.url).origin
        await sendPasswordResetEmail({
          to: user.email,
          username: user.username,
          link: `${origin}/reset-password?token=${resetToken}`,
        })
      }

      // Always return the same response so we don't leak whether the email exists
      return NextResponse.json({ success: true })
    }

    if (action === 'resetPassword') {
      const { token: resetToken, newPassword } = body
      if (!resetToken || !newPassword) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
      }

      const resetTokenHash = hashToken(resetToken)
      const user = await prisma.user.findFirst({ where: { resetTokenHash } })

      if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        return NextResponse.json({ success: false, error: 'This link has expired or is invalid' }, { status: 400 })
      }

      const passwordHash = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, resetTokenHash: null, resetTokenExpiry: null },
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'verifyEmail') {
      const { token: verificationToken } = body
      if (!verificationToken) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
      }

      const verificationTokenHash = hashToken(verificationToken)
      const user = await prisma.user.findFirst({ where: { verificationTokenHash } })

      if (!user || !user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
        return NextResponse.json({ success: false, error: 'This link has expired or is invalid' }, { status: 400 })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verificationTokenHash: null, verificationTokenExpiry: null },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
export async function PUT(request) {
  try {
      const auth = request.headers.get('authorization')

      if (!auth || !auth.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      const token = auth.split(' ')[1]

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (e) {
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
      }

    const body = await request.json()
    const { action } = body

    if (action === 'updateProfile') {
      const { displayName, discordId, billingName, billingAddress, billingCity, billingCountry, billingPhone, billingPostalCode } = body

      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          displayName: displayName || null,
          discordId: discordId || null,
          billingName: billingName || null,
          billingAddress: billingAddress || null,
          billingCity: billingCity || null,
          billingCountry: billingCountry || null,
          billingPhone: billingPhone || null,
          billingPostalCode: billingPostalCode || null,
        }
      })
      return NextResponse.json({ success: true, data: { displayName: user.displayName, discordId: user.discordId } })
    }

    if (action === 'getProfile') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          username: true, email: true, displayName: true, discordId: true,
          billingName: true, billingAddress: true, billingCity: true,
          billingCountry: true, billingPhone: true, billingPostalCode: true,
          createdAt: true, emailVerified: true, isContentCreator: true,
        }
      })
      return NextResponse.json({ success: true, data: user })
    }

    if (action === 'resendVerification') {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      }
      if (user.emailVerified) {
        return NextResponse.json({ success: false, error: 'Email is already verified' }, { status: 400 })
      }

      const { raw: verificationToken, hash: verificationTokenHash } = createToken()
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationTokenHash,
          verificationTokenExpiry: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        }
      })

      const origin = new URL(request.url).origin
      await sendVerificationEmail({
        to: user.email,
        username: user.username,
        link: `${origin}/verify-email?token=${verificationToken}`,
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'changePassword') {
      const { currentPassword, newPassword } = body
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
      if (user.passwordHash) {
        const valid = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!valid) {
          return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 })
        }
      }
      const passwordHash = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({ where: { id: decoded.userId }, data: { passwordHash } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
