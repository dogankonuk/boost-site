import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          include: { _count: { select: { orders: true } } },
        }
      }
    })
    return NextResponse.json({ success: true, data: games })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { slug, name, category, coverImage, sortOrder } = body

    if (!slug || !name || !category) {
      return NextResponse.json(
        { success: false, error: 'slug, name ve category zorunlu' },
        { status: 400 }
      )
    }

    const game = await prisma.game.create({
      data: { slug, name, category, coverImage, sortOrder: sortOrder ?? 0 }
    })

    return NextResponse.json({ success: true, data: game }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
