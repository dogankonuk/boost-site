import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { notifyBlogMilestone } from '@/lib/notify'
import { createHash } from 'crypto'
import { getClientIp, rateLimit } from '@/lib/rateLimit'

const VIEW_MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000]

// Fired client-side on real page mounts only — kept separate from the
// server-rendered page itself, because Next.js prefetches <Link> targets
// in the background (Link cards on /blog, sidebars, homepage), and those
// prefetch requests would otherwise inflate the counter with non-visits.
export async function POST(request) {
  try {
    const { slug } = await request.json()
    if (typeof slug !== 'string' || !slug.trim() || slug.length > 100) {
      return NextResponse.json({ success: false, error: 'slug is required' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const visitorKey = createHash('sha256').update(`${ip}:${userAgent}`).digest('hex').slice(0, 24)
    const viewCheck = rateLimit(`blog-view:${slug}:${visitorKey}`, { maxAttempts: 1, windowMs: 30 * 60 * 1000 })
    if (!viewCheck.allowed) {
      return NextResponse.json({ success: true, counted: false })
    }

    const existing = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true, publishedAt: { lte: new Date() } },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    const post = await prisma.blogPost.update({
      where: { id: existing.id },
      data: { views: { increment: 1 } },
      select: { id: true, views: true, authorId: true, title: true },
    })

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    await prisma.blogPostDailyView.upsert({
      where: { blogPostId_date: { blogPostId: post.id, date: today } },
      create: { blogPostId: post.id, date: today, views: 1 },
      update: { views: { increment: 1 } },
    })

    if (VIEW_MILESTONES.includes(post.views)) {
      await notifyBlogMilestone(prisma, { userId: post.authorId, title: post.title, views: post.views })
    }

    return NextResponse.json({ success: true, counted: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
