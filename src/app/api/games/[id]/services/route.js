import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, slug, basePrice, priceType, options } = body

    if (!name || !slug || !basePrice) {
      return NextResponse.json(
        { success: false, error: 'name, slug ve basePrice zorunlu' },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        gameId: parseInt(id),
        name,
        slug,
        basePrice: parseFloat(basePrice),
        priceType: priceType || 'fixed',
        options: options || null,
      }
    })

    return NextResponse.json({ success: true, data: service }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}