import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

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

const DAYS = 30

// Returns the last 30 UTC days of view activity across all of this creator's
// posts, zero-filled so the chart reflects real gaps rather than skipping them.
export async function GET(request) {
  const { user, error } = await requireCreator(request)
  if (error) return error

  try {
    const since = new Date()
    since.setUTCHours(0, 0, 0, 0)
    since.setUTCDate(since.getUTCDate() - (DAYS - 1))

    const rows = await prisma.blogPostDailyView.findMany({
      where: { blogPost: { authorId: user.id }, date: { gte: since } },
      select: { date: true, views: true },
    })

    const byDate = new Map()
    for (const row of rows) {
      const key = row.date.toISOString().slice(0, 10)
      byDate.set(key, (byDate.get(key) || 0) + row.views)
    }

    const series = []
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(since)
      d.setUTCDate(since.getUTCDate() + i)
      const key = d.toISOString().slice(0, 10)
      series.push({ date: key, views: byDate.get(key) || 0 })
    }

    return NextResponse.json({ success: true, data: series })
  } catch (err) {
    console.error('Blog analytics GET error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
