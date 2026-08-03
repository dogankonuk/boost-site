import { prisma } from '@/lib/prisma'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true, publishedAt: { lte: new Date() } },
    include: { author: { select: { username: true, displayName: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 30,
  })

  const items = posts.map(p => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid>
      <description>${escapeXml(p.excerpt || '')}</description>
      <category>${escapeXml(p.category)}</category>
      <author>${escapeXml(p.author?.displayName || p.author?.username)}</author>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ShadowBoosting Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Guides, updates, and playthroughs from the ShadowBoosting team and content creators.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
