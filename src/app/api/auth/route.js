import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar'

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, email, username, password } = body

    if (action === 'register') {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Bu email veya kullanıcı adı zaten kullanılıyor' },
          { status: 400 }
        )
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: { email, username, passwordHash }
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
          { success: false, error: 'Kullanıcı bulunamadı' },
          { status: 404 }
        )
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'Şifre hatalı' },
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

    return NextResponse.json(
      { success: false, error: 'Geçersiz action' },
      { status: 400 }
    )

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}