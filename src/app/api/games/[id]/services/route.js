import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, slug, basePrice, priceType, options, description, features, imageUrl, isHot, serviceCategory } = body

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
        description: description || null,
        features: features || null,
        imageUrl: imageUrl || null,
        isHot: isHot || false,
        serviceCategory: serviceCategory || 'Genel',
      }
    })

    return NextResponse.json({ success: true, data: service }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}