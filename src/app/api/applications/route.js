import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar'
const VALID_TYPES = ['booster', 'content_creator']

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
  const tokenUser = getUserFromToken(request)
  if (!tokenUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const applications = await prisma.application.findMany({
      where: { userId: tokenUser.userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: applications })
  } catch (err) {
    console.error('Applications GET error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  const tokenUser = getUserFromToken(request)
  if (!tokenUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const type = body.type

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid application type' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      include: { booster: true },
    })

    if (type === 'booster' && user.booster?.status === 'active') {
      return NextResponse.json({ success: false, error: 'You are already a booster' }, { status: 400 })
    }
    if (type === 'content_creator' && user.isContentCreator) {
      return NextResponse.json({ success: false, error: 'You are already a content creator' }, { status: 400 })
    }

    const existingPending = await prisma.application.findFirst({
      where: { userId: user.id, type, status: 'pending' },
    })
    if (existingPending) {
      return NextResponse.json({ success: false, error: 'You already have a pending application for this role' }, { status: 400 })
    }

    if (!body.experience?.trim()) {
      return NextResponse.json({ success: false, error: 'Please describe your experience' }, { status: 400 })
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        type,
        discord: body.discord?.trim() || null,
        telegram: body.telegram?.trim() || null,
        games: Array.isArray(body.games) && body.games.length > 0 ? body.games : null,
        experience: body.experience.trim(),
        screenshots: Array.isArray(body.screenshots) && body.screenshots.length > 0 ? body.screenshots : null,
        extra: body.extra || null,
      },
    })

    return NextResponse.json({ success: true, data: application }, { status: 201 })
  } catch (err) {
    console.error('Applications POST error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
