import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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

    await prisma.blogPost.updateMany({
      where: { slug },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
