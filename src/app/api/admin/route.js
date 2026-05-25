import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'boost-admin-2024'

function isAdmin(request) {
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${ADMIN_SECRET}`
}

export async function GET(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { username: true, email: true } },
          service: { include: { game: true } },
          booster: { include: { user: { select: { username: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ success: true, data: orders })
    }

    if (type === 'games') {
      const games = await prisma.game.findMany({
        include: { services: true },
        orderBy: { sortOrder: 'asc' }
      })
      return NextResponse.json({ success: true, data: games })
    }

    return NextResponse.json({ success: false, error: 'type parametresi gerekli' }, { status: 400 })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, id, data } = body

    if (type === 'order') {
      const order = await prisma.order.update({
        where: { id: parseInt(id) },
        data
      })
      return NextResponse.json({ success: true, data: order })
    }

    if (type === 'game') {
      const game = await prisma.game.update({
        where: { id: parseInt(id) },
        data
      })
      return NextResponse.json({ success: true, data: game })
    }

    if (type === 'service') {
  const service = await prisma.service.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        basePrice: parseFloat(data.basePrice),
        description: data.description ?? null,
        features: data.features ?? null,
        imageUrl: data.imageUrl ?? null,
        isHot: data.isHot ?? false,
        serviceCategory: data.serviceCategory ?? 'Genel',
        priceType: data.priceType ?? 'fixed',
        options: data.options ?? null,
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    })
    return NextResponse.json({ success: true, data: service })
  }

    return NextResponse.json({ success: false, error: 'Geçersiz type' }, { status: 400 })
  } catch (error) {
    console.error('Admin PATCH error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}