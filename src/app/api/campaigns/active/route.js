import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Public, unauthenticated — a promotion is meant to be visible to shoppers,
// unlike the admin campaigns list which also exposes inactive/past ones.
export async function GET() {
  try {
    const now = new Date()
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      select: { id: true, name: true, discountPct: true, gameId: true, isActive: true, startsAt: true, endsAt: true },
    })
    return NextResponse.json({ success: true, data: campaigns })
  } catch (error) {
    console.error('Active campaigns GET error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
