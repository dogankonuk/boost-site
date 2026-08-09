import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { notifyBlogMilestone } from '@/lib/notify'

const VIEW_MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000]

// Fired client-side on real page mounts only — kept separate from the
// server-rendered page itself, because Next.js prefetches <Link> targets
// in the background (Link cards on /blog, sidebars, homepage), and those
// prefetch requests would otherwise inflate the counter with non-visits.
export async function POST(request) {
  try {
    const { slug } = await request.json()
    if (!slug) {
      return NextResponse.json({ success: false, error: 'slug is required' }, { status: 400 })
    }

    const post = await prisma.blogPost.update({
      where: { slug },
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

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
