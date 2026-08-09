import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { notifyBlogPendingReview } from '@/lib/notify'

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar'

function getUserFromToken(request) {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  try {
    return jwt.verify(auth.split(' ')[1], JWT_SECRET)
  } catch {
    return null
  }
}

async function requireCreator(request) {
  const tokenUser = getUserFromToken(request)
  if (!tokenUser) return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }

  const user = await prisma.user.findUnique({ where: { id: tokenUser.userId } })
  if (!user || !user.isContentCreator) {
    return { error: NextResponse.json({ success: false, error: 'You do not have content creator access' }, { status: 403 }) }
  }
  return { user }
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'post'
}

async function uniqueSlug(base, excludeId) {
  let slug = base
  let suffix = 1
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) return slug
    suffix++
    slug = `${base}-${suffix}`
  }
}

export async function GET(request) {
  const { user, error } = await requireCreator(request)
  if (error) return error

  try {
    const posts = await prisma.blogPost.findMany({
      where: { authorId: user.id },
      include: { game: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: posts })
  } catch (err) {
    console.error('Blog GET error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  const { user, error } = await requireCreator(request)
  if (error) return error

  try {
    const body = await request.json()
    const title = (body.title || '').trim()
    const content = (body.content || '').trim()

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 })
    }

    const slug = await uniqueSlug(slugify(body.slug?.trim() || title))
    // Creators can never go live directly on creation — only a submission
    // that an admin approves can set isPublished. See PATCH for the same rule.
    const reviewStatus = body.reviewStatus === 'pending' ? 'pending' : 'draft'

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title,
        excerpt: body.excerpt?.trim() || null,
        content,
        coverImage: body.coverImage?.trim() || null,
        category: body.category || 'Guide',
        gameId: body.gameId ? parseInt(body.gameId) : null,
        authorId: user.id,
        isPublished: false,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        reviewStatus,
      },
    })

    if (reviewStatus === 'pending') {
      await notifyBlogPendingReview(prisma, { post, authorUsername: user.username })
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 })
  } catch (err) {
    console.error('Blog POST error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  const { user, error } = await requireCreator(request)
  if (error) return error

  try {
    const body = await request.json()
    const id = parseInt(body.id)
    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing || existing.authorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    const data = {}
    if (body.title !== undefined) data.title = body.title.trim()
    if (body.slug !== undefined && body.slug.trim()) data.slug = await uniqueSlug(slugify(body.slug.trim()), id)
    if (body.excerpt !== undefined) data.excerpt = body.excerpt?.trim() || null
    if (body.content !== undefined) data.content = body.content.trim()
    if (body.coverImage !== undefined) data.coverImage = body.coverImage?.trim() || null
    if (body.category !== undefined) data.category = body.category
    if (body.gameId !== undefined) data.gameId = body.gameId ? parseInt(body.gameId) : null

    // Creators can only take a post down themselves, or re-save one that's
    // already live. Newly going live requires admin approval (see reviewStatus
    // below) — a client sending isPublished:true for a not-yet-live post is
    // either a stale UI or a bypass attempt, so it's rejected outright.
    if (body.isPublished !== undefined) {
      if (body.isPublished && !existing.isPublished) {
        return NextResponse.json({ success: false, error: 'Submit this post for review instead of publishing it directly.' }, { status: 403 })
      }
      data.isPublished = !!body.isPublished
    }

    // Only draft/pending are creator-settable; approved/rejected are admin-only.
    if (body.reviewStatus === 'draft' || body.reviewStatus === 'pending') {
      data.reviewStatus = body.reviewStatus
    }

    if (body.publishedAt) {
      data.publishedAt = new Date(body.publishedAt)
    } else if (data.isPublished && !existing.publishedAt) {
      data.publishedAt = new Date()
    }

    const post = await prisma.blogPost.update({ where: { id }, data })

    if (data.reviewStatus === 'pending' && existing.reviewStatus !== 'pending') {
      await notifyBlogPendingReview(prisma, { post, authorUsername: user.username })
    }

    return NextResponse.json({ success: true, data: post })
  } catch (err) {
    console.error('Blog PATCH error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const { user, error } = await requireCreator(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id'))
    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing || existing.authorId !== user.id) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    await prisma.blogPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Blog DELETE error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
