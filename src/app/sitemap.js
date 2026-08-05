import { prisma } from '@/lib/prisma'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

const STATIC_ROUTES = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/games', changeFrequency: 'daily', priority: 0.9 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/apply', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/help', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/refund', changeFrequency: 'yearly', priority: 0.3 },
]

export default async function sitemap() {
  const games = await prisma.game.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      createdAt: true,
      services: { where: { isActive: true }, select: { id: true, createdAt: true } },
    },
  })

  const blogPosts = await prisma.blogPost.findMany({
    where: { isPublished: true, publishedAt: { lte: new Date() } },
    select: { slug: true, updatedAt: true },
  })

  const staticEntries = STATIC_ROUTES.map(r => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  const blogEntries = blogPosts.map(p => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const gameEntries = games.map(g => ({
    url: `${SITE_URL}/games/${g.slug}`,
    lastModified: g.createdAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const serviceEntries = games.flatMap(g =>
    g.services.map(s => ({
      url: `${SITE_URL}/order/${s.id}`,
      lastModified: s.createdAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  )

  return [...staticEntries, ...gameEntries, ...serviceEntries, ...blogEntries]
}
