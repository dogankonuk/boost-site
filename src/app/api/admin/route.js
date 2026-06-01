import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendOrderStatusUpdate } from '@/lib/email'

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

    if (type === 'gameCategories') {
      const games = await prisma.game.findMany({
        select: { category: true },
        where: { isActive: true }
      })
      const autoCategories = [...new Set(
        games.flatMap(g => g.category ? g.category.split(', ') : [])
      )]
      
      const setting = await prisma.setting.findUnique({ where: { key: 'gameCategories' } })
      const manualCategories = (setting?.value || [])
      
      const all = [...new Set([...autoCategories, ...manualCategories])].sort()
      return NextResponse.json({ success: true, data: all, manual: manualCategories })
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
        data,
        include: {
          user: { select: { email: true, username: true } },
          service: { include: { game: true } }
        }
      })

      if (data.status && ['assigned', 'in_progress', 'completed', 'cancelled'].includes(data.status)) {
        await sendOrderStatusUpdate({
          to: order.user?.email,
          username: order.user?.username,
          orderNumber: order.orderNumber,
          gameName: order.service?.game?.name,
          serviceName: order.service?.name,
          status: data.status,
        })
      }

      return NextResponse.json({ success: true, data: order })
    }
    if (type === 'gameCategories') {
      const { action, value } = body
      let setting = null
      try {
        setting = await prisma.setting.findUnique({ where: { key: 'gameCategories' } })
      } catch {}

      let current = (setting?.value || [])
      if (action === 'add' && !current.includes(value)) {
        current = [...current, value]
      } else if (action === 'remove') {
        current = current.filter(c => c !== value)
      }

      await prisma.setting.upsert({
        where: { key: 'gameCategories' },
        update: { value: current },
        create: { key: 'gameCategories', value: current },
      })
      return NextResponse.json({ success: true, data: current })
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