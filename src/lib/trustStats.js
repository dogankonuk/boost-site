import { cache } from 'react'
import { prisma } from '@/lib/prisma'

// Real, site-wide trust numbers derived from completed orders — replaces
// what used to be a hardcoded 4.9/5 · 12,000+ on the homepage and order page.
export const getTrustStats = cache(async () => {
  const [ratingAgg, completedCount] = await Promise.all([
    prisma.order.aggregate({
      where: { status: 'completed', rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.order.count({ where: { status: 'completed' } }),
  ])

  return {
    avgRating: ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : null,
    ratedCount: ratingAgg._count.rating,
    completedCount,
  }
})
