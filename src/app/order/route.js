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

function generateOrderNumber() {
  return 'BST-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

export async function GET(request) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      include: {
        service: {
          include: { game: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceId, details } = body

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId zorunlu' },
        { status: 400 }
      )
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Hizmet bulunamadı' },
        { status: 404 }
      )
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.userId,
        serviceId,
        price: service.basePrice,
        details: details || {}
      },
      include: {
        service: {
          include: { game: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}