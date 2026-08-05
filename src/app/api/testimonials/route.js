import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getTrustStats } from '@/lib/trustStats'

// Public, read-only: surfaces real customer feedback (written reviews on
// completed orders) plus site-wide trust stats, without exposing anything
// beyond username/service/game — no price, email, or other order details.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit')) || 8, 20)

    const [testimonials, stats] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: 'completed',
          rating: { gte: 4 },
          review: { not: null },
        },
        orderBy: { ratedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          rating: true,
          review: true,
          ratedAt: true,
          user: { select: { username: true, displayName: true } },
          service: { select: { name: true, game: { select: { name: true } } } },
        },
      }),
      getTrustStats(),
    ])

    const data = testimonials
      .filter(o => o.review && o.review.trim().length > 0)
      .map(o => ({
        id: o.id,
        rating: o.rating,
        review: o.review,
        date: o.ratedAt,
        author: o.user.displayName || o.user.username,
        gameName: o.service.game.name,
        serviceName: o.service.name,
      }))

    return NextResponse.json({ success: true, data, stats })
  } catch (error) {
    console.error('Testimonials GET error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
