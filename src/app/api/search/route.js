import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, data: [] })
    }

    const games = await prisma.game.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: 'insensitive' }
      },
      take: 4,
    })

    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: 'insensitive' }
      },
      include: { game: true },
      take: 5,
    })

    const results = [
      ...games.map(g => ({
        type: 'game',
        name: g.name,
        category: g.category,
        image: g.coverImage,
        url: `/games/${g.slug}`,
      })),
      ...services.map(s => ({
        type: 'service',
        name: s.name,
        gameName: s.game?.name,
        price: `${s.basePrice.toLocaleString('tr-TR')} ₺`,
        image: s.imageUrl || s.game?.coverImage,
        url: `/order/${s.id}`,
      })),
    ]

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}