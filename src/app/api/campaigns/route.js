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

async function requireAdmin(request) {
  const user = getUserFromToken(request)
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } })
  if (!(dbUser && dbUser.isAdmin && dbUser.isActive)) return null
  return dbUser
}

export async function GET(request) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const campaigns = await prisma.campaign.findMany({
    include: { game: { select: { name: true } } },
    orderBy: { startsAt: 'desc' },
  })
  return NextResponse.json({ success: true, data: campaigns })
}

export async function POST(request) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      const { name, discountPct, gameId, startsAt, endsAt } = body
      if (!name || discountPct === undefined || discountPct === '' || !startsAt || !endsAt) {
        return NextResponse.json({ success: false, error: 'Name, discount, start and end dates are required' }, { status: 400 })
      }
      const campaign = await prisma.campaign.create({
        data: {
          name,
          discountPct: parseFloat(discountPct),
          gameId: gameId ? parseInt(gameId) : null,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
        },
      })
      return NextResponse.json({ success: true, data: campaign }, { status: 201 })
    }

    if (action === 'update') {
      const { id } = body
      const data = {}
      if (body.isActive !== undefined) data.isActive = body.isActive
      if (body.discountPct !== undefined && body.discountPct !== '') data.discountPct = parseFloat(body.discountPct)
      if (body.startsAt !== undefined) data.startsAt = new Date(body.startsAt)
      if (body.endsAt !== undefined) data.endsAt = new Date(body.endsAt)

      const campaign = await prisma.campaign.update({ where: { id: parseInt(id) }, data })
      return NextResponse.json({ success: true, data: campaign })
    }

    if (action === 'delete') {
      await prisma.campaign.delete({ where: { id: parseInt(body.id) } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
