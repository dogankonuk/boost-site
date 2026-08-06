import { prisma } from './prisma'

// Real customer feedback (written reviews on completed orders), trimmed to
// username/service/game only — no price, email, or other order details.
export async function getTestimonials(limit = 8) {
  const testimonials = await prisma.order.findMany({
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
  })

  return testimonials
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
}
