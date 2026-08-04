import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sendOrderStatusUpdate, sendBlogUnpublishedEmail } from '@/lib/email'
import { notifyOrderStatus } from '@/lib/notify'
import { maybeAwardReferralBonus } from '@/lib/referral'

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar'

// Only these accounts may grant or revoke admin access from others. A regular
// admin promoted later (even via this same panel) cannot mint new admins —
// this caps the blast radius if a non-founder admin account is ever compromised.
const FOUNDER_EMAILS = ['dogankonuk@gmail.com', 'mrtatessacan@gmail.com']

// Re-checks isAdmin from the DB on every request (rather than trusting a JWT
// claim) so revoking admin access takes effect immediately, not just after
// the token expires. Returns the user record (so callers can check founder
// status) or null if unauthorized.
async function requireAdmin(request) {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!(user && user.isAdmin && user.isActive)) return null
    return user
  } catch {
    return null
  }
}

async function pingBoosterOnDiscord(order, booster) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl || !booster?.discordId) return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `<@${booster.discordId}> yeni bir sipariş sana atandı!`,
        embeds: [{
          title: '🛠️ Sipariş Atandı',
          color: 0xF5C518,
          fields: [
            { name: '📋 Sipariş No', value: order.orderNumber, inline: true },
            { name: '🎯 Oyun', value: order.service?.game?.name || '-', inline: true },
            { name: '⚡ Hizmet', value: order.service?.name || '-', inline: true },
          ],
          footer: { text: 'ShadowBoosting.co' },
          timestamp: new Date().toISOString(),
        }],
      }),
    })
  } catch (err) {
    console.error('Discord booster ping error:', err)
  }
}

export async function GET(request) {
  const adminUser = await requireAdmin(request)
  if (!adminUser) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { username: true, email: true } },
          service: { include: { game: true } },
          booster: { include: { user: { select: { username: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ success: true, data: orders })
    }

    if (type === 'games') {
      const games = await prisma.game.findMany({
        include: { services: true },
        orderBy: { sortOrder: 'asc' }
      })
      return NextResponse.json({ success: true, data: games })
    }

    if (type === 'gameCategories') {
      const games = await prisma.game.findMany({
        select: { category: true },
        where: { isActive: true }
      })
      const autoCategories = [...new Set(
        games.flatMap(g => g.category ? g.category.split(', ') : [])
      )]
      
      const setting = await prisma.setting.findUnique({ where: { key: 'gameCategories' } })
      const manualCategories = (setting?.value || [])
      
      const all = [...new Set([...autoCategories, ...manualCategories])].sort()
      return NextResponse.json({ success: true, data: all, manual: manualCategories })
    }

    if (type === 'boosters') {
      const boosters = await prisma.booster.findMany({
        include: {
          user: { select: { username: true, email: true, isActive: true } },
          orders: {
            select: {
              id: true, orderNumber: true, status: true, price: true, createdAt: true,
              issueReport: true, issueReportedAt: true, issueResolved: true,
              user: { select: { username: true } },
              service: { select: { name: true, game: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ success: true, data: boosters })
    }

    if (type === 'stats') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

      const [totalUsers, totalBoosters, activeBoosters, orders, games, pendingApplications, usersLast30, usersPrev30] = await Promise.all([
        prisma.user.count(),
        prisma.booster.count(),
        prisma.booster.count({ where: { status: 'active' } }),
        prisma.order.findMany({
          select: {
            status: true, price: true, createdAt: true, rating: true,
            issueReport: true, issueResolved: true,
            service: { select: { game: { select: { id: true, name: true } } } },
          },
        }),
        prisma.game.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.application.count({ where: { status: 'pending' } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      ])

      const statusCounts = { pending: 0, assigned: 0, in_progress: 0, completed: 0, cancelled: 0 }
      let totalRevenue = 0, last30Revenue = 0, prev30Revenue = 0
      let openIssues = 0, unratedCompleted = 0
      const gameStats = {}

      const now = new Date()
      const dailyRevenue = []
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        dailyRevenue.push({ date: d.toISOString().slice(0, 10), revenue: 0 })
      }
      const dailyIndex = Object.fromEntries(dailyRevenue.map((d, idx) => [d.date, idx]))

      for (const o of orders) {
        if (statusCounts[o.status] !== undefined) statusCounts[o.status]++
        if (o.issueReport && !o.issueResolved) openIssues++
        if (o.status === 'completed' && !o.rating) unratedCompleted++

        const gameId = o.service?.game?.id
        const gameName = o.service?.game?.name || 'Unknown'
        if (gameId) {
          if (!gameStats[gameId]) gameStats[gameId] = { name: gameName, orders: 0, activeOrders: 0, revenue: 0 }
          gameStats[gameId].orders++
          if (['pending', 'assigned', 'in_progress'].includes(o.status)) gameStats[gameId].activeOrders++
        }

        if (o.status === 'completed') {
          totalRevenue += o.price
          if (o.createdAt >= thirtyDaysAgo) last30Revenue += o.price
          else if (o.createdAt >= sixtyDaysAgo) prev30Revenue += o.price
          if (gameId) gameStats[gameId].revenue += o.price
          const key = o.createdAt.toISOString().slice(0, 10)
          if (dailyIndex[key] !== undefined) dailyRevenue[dailyIndex[key]].revenue += o.price
        }
      }

      for (const g of games) {
        if (!gameStats[g.id]) gameStats[g.id] = { name: g.name, orders: 0, activeOrders: 0, revenue: 0 }
      }
      const gameBreakdown = Object.values(gameStats).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)

      const revenueGrowthPct = prev30Revenue > 0
        ? Math.round(((last30Revenue - prev30Revenue) / prev30Revenue) * 100)
        : (last30Revenue > 0 ? 100 : 0)
      const userGrowthPct = usersPrev30 > 0
        ? Math.round(((usersLast30 - usersPrev30) / usersPrev30) * 100)
        : (usersLast30 > 0 ? 100 : 0)

      return NextResponse.json({
        success: true,
        data: {
          totalUsers, totalBoosters, activeBoosters,
          totalOrders: orders.length,
          totalRevenue, last30Revenue, revenueGrowthPct,
          usersLast30, userGrowthPct,
          statusCounts, gameBreakdown, revenueTrend: dailyRevenue,
          pendingApplications, openIssues, unratedCompleted,
        },
      })
    }

    if (type === 'users') {
      const users = await prisma.user.findMany({
        include: {
          orders: { select: { status: true, price: true } },
          booster: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      const data = users.map(u => ({
        id: u.id, username: u.username, email: u.email, isActive: u.isActive,
        emailVerified: u.emailVerified, createdAt: u.createdAt,
        oauthProvider: u.oauthProvider,
        isBooster: !!(u.booster && u.booster.status === 'active'),
        isContentCreator: u.isContentCreator,
        isAdmin: u.isAdmin,
        orderCount: u.orders.length,
        totalSpent: u.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.price, 0),
      }))
      return NextResponse.json({ success: true, data, viewerIsFounder: FOUNDER_EMAILS.includes(adminUser.email) })
    }

    if (type === 'blogPosts') {
      const posts = await prisma.blogPost.findMany({
        include: {
          author: { select: { username: true } },
          game: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ success: true, data: posts })
    }

    if (type === 'contentCreators') {
      const creators = await prisma.user.findMany({
        where: { isContentCreator: true },
        include: {
          blogPosts: {
            select: { isPublished: true, views: true, createdAt: true, game: { select: { name: true } } },
          },
        },
        orderBy: { username: 'asc' },
      })
      const data = creators.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        isActive: u.isActive,
        totalPosts: u.blogPosts.length,
        publishedCount: u.blogPosts.filter(p => p.isPublished).length,
        draftCount: u.blogPosts.filter(p => !p.isPublished).length,
        totalViews: u.blogPosts.reduce((s, p) => s + p.views, 0),
        games: [...new Set(u.blogPosts.map(p => p.game?.name).filter(Boolean))],
        lastPostAt: u.blogPosts.reduce((latest, p) => (!latest || p.createdAt > latest) ? p.createdAt : latest, null),
      }))
      return NextResponse.json({ success: true, data })
    }

    if (type === 'applications') {
      const applications = await prisma.application.findMany({
        include: { user: { select: { username: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ success: true, data: applications })
    }

    if (type === 'userSearch') {
      const q = searchParams.get('q')?.trim()
      if (!q || q.length < 2) return NextResponse.json({ success: true, data: [] })
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
          booster: null,
        },
        select: { id: true, username: true, email: true },
        take: 6,
      })
      return NextResponse.json({ success: true, data: users })
    }

    return NextResponse.json({ success: false, error: 'type parametresi gerekli' }, { status: 400 })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, data } = body

    if (type === 'booster') {
      const targetUser = await prisma.user.findUnique({ where: { id: parseInt(data.userId) } })
      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 })
      }
      const booster = await prisma.booster.create({
        data: {
          userId: targetUser.id,
          discordId: data.discordId || null,
          games: data.games && data.games.length > 0 ? data.games : null,
        },
        include: { user: { select: { username: true, email: true } } },
      })
      return NextResponse.json({ success: true, data: booster }, { status: 201 })
    }

    return NextResponse.json({ success: false, error: 'Geçersiz type' }, { status: 400 })
  } catch (error) {
    console.error('Admin POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, id, data } = body

    if (type === 'order') {
      const existingOrder = await prisma.order.findUnique({ where: { id: parseInt(id) } })
      const timelineData = {}
      if ('boosterId' in data && data.boosterId) timelineData.assignedAt = new Date()
      if (data.status === 'in_progress' && !existingOrder?.startedAt) timelineData.startedAt = new Date()
      if (data.status === 'completed') timelineData.completedAt = new Date()
      if (data.status === 'cancelled') timelineData.cancelledAt = new Date()

      const order = await prisma.order.update({
        where: { id: parseInt(id) },
        data: { ...data, ...timelineData },
        include: {
          user: { select: { email: true, username: true } },
          service: { include: { game: true } },
          booster: { include: { user: true } },
        }
      })

      if (data.status && ['assigned', 'in_progress', 'completed', 'cancelled'].includes(data.status)) {
        await sendOrderStatusUpdate({
          to: order.user?.email,
          username: order.user?.username,
          orderNumber: order.orderNumber,
          gameName: order.service?.game?.name,
          serviceName: order.service?.name,
          status: data.status,
        })
        await notifyOrderStatus(prisma, order, data.status)
      }

      if (data.status === 'completed') {
        await maybeAwardReferralBonus(order.userId)
      }

      // 'boosterId' being present in the payload means this PATCH is (also) an assignment action
      if ('boosterId' in data && data.boosterId && order.booster) {
        await prisma.notification.create({
          data: {
            userId: order.booster.user.id,
            type: 'order_assigned',
            title: 'Yeni sipariş atandı',
            body: `${order.service?.game?.name} — ${order.service?.name}`,
            link: '/booster',
          },
        })
        await pingBoosterOnDiscord(order, order.booster)
      }

      return NextResponse.json({ success: true, data: order })
    }
    if (type === 'gameCategories') {
      const { action, value } = body
      let setting = null
      try {
        setting = await prisma.setting.findUnique({ where: { key: 'gameCategories' } })
      } catch {}

      let current = (setting?.value || [])
      if (action === 'add' && !current.includes(value)) {
        current = [...current, value]
      } else if (action === 'remove') {
        current = current.filter(c => c !== value)
      }

      await prisma.setting.upsert({
        where: { key: 'gameCategories' },
        update: { value: current },
        create: { key: 'gameCategories', value: current },
      })
      return NextResponse.json({ success: true, data: current })
    }

    if (type === 'game') {
      const game = await prisma.game.update({
        where: { id: parseInt(id) },
        data
      })
      return NextResponse.json({ success: true, data: game })
    }

    if (type === 'service') {
  const service = await prisma.service.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        basePrice: parseFloat(data.basePrice),
        description: data.description ?? null,
        features: data.features ?? null,
        imageUrl: data.imageUrl ?? null,
        isHot: data.isHot ?? false,
        serviceCategory: data.serviceCategory ?? 'Genel',
        priceType: data.priceType ?? 'fixed',
        options: data.options ?? null,
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    })
    return NextResponse.json({ success: true, data: service })
  }

    if (type === 'booster') {
      const booster = await prisma.booster.update({
        where: { id: parseInt(id) },
        data,
        include: { user: { select: { username: true, email: true } } },
      })
      return NextResponse.json({ success: true, data: booster })
    }

    if (type === 'user') {
      const updateData = {}
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.isContentCreator !== undefined) updateData.isContentCreator = data.isContentCreator
      if (data.isAdmin !== undefined) {
        if (!FOUNDER_EMAILS.includes(admin.email)) {
          return NextResponse.json({ success: false, error: 'Only founder accounts can grant or revoke admin access' }, { status: 403 })
        }
        updateData.isAdmin = data.isAdmin
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({ where: { id: parseInt(id) }, data: updateData })
      }

      if (data.isBooster !== undefined) {
        if (data.isBooster) {
          await prisma.booster.upsert({
            where: { userId: parseInt(id) },
            create: { userId: parseInt(id), status: 'active' },
            update: { status: 'active' },
          })
        } else {
          await prisma.booster.updateMany({ where: { userId: parseInt(id) }, data: { status: 'inactive' } })
        }
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true, username: true, isActive: true, isContentCreator: true, isAdmin: true,
          booster: { select: { status: true } },
        },
      })
      return NextResponse.json({
        success: true,
        data: { ...user, isBooster: !!(user.booster && user.booster.status === 'active') },
      })
    }

    if (type === 'blogPost') {
      const existing = await prisma.blogPost.findUnique({
        where: { id: parseInt(id) },
        include: { author: { select: { email: true, username: true } } },
      })
      const post = await prisma.blogPost.update({
        where: { id: parseInt(id) },
        data,
      })

      if (existing?.isPublished && data.isPublished === false) {
        try {
          await prisma.notification.create({
            data: {
              userId: existing.authorId,
              type: 'blog_unpublished',
              title: 'Your post was unpublished',
              body: post.title,
              link: '/creator',
            },
          })
          if (existing.author?.email) {
            await sendBlogUnpublishedEmail({
              to: existing.author.email,
              username: existing.author.username,
              postTitle: post.title,
            })
          }
        } catch (err) {
          console.error('blog unpublish notification error:', err)
        }
      }

      return NextResponse.json({ success: true, data: post })
    }

    if (type === 'application') {
      const application = await prisma.application.findUnique({ where: { id: parseInt(id) } })
      if (!application) {
        return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
      }

      const decision = data.status
      const updated = await prisma.application.update({
        where: { id: parseInt(id) },
        data: { status: decision, reviewNote: data.reviewNote?.trim() || null },
      })

      if (decision === 'approved') {
        if (application.type === 'booster') {
          const existingBooster = await prisma.booster.findUnique({ where: { userId: application.userId } })
          if (!existingBooster) {
            await prisma.booster.create({
              data: {
                userId: application.userId,
                discordId: application.discord || null,
                games: Array.isArray(application.games) && application.games.length > 0 ? application.games : null,
              },
            })
          }
        } else if (application.type === 'content_creator') {
          await prisma.user.update({ where: { id: application.userId }, data: { isContentCreator: true } })
        }
      }

      try {
        await prisma.notification.create({
          data: {
            userId: application.userId,
            type: 'application_status',
            title: decision === 'approved' ? 'Your application was approved! 🎉' : 'Your application was not approved',
            body: application.type === 'booster' ? 'Booster application' : 'Content creator application',
            link: decision === 'approved' ? (application.type === 'booster' ? '/booster' : '/creator') : '/apply',
          },
        })
      } catch (err) {
        console.error('application notification error:', err)
      }

      return NextResponse.json({ success: true, data: updated })
    }

    return NextResponse.json({ success: false, error: 'Geçersiz type' }, { status: 400 })
  } catch (error) {
    console.error('Admin PATCH error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = parseInt(searchParams.get('id'))

    if (type === 'game') {
      const game = await prisma.game.findUnique({ where: { id }, include: { services: { select: { id: true } } } })
      if (!game) {
        return NextResponse.json({ success: false, error: 'Oyun bulunamadı' }, { status: 404 })
      }
      if (game.services.length > 0) {
        return NextResponse.json({ success: false, error: 'Bu oyunun hizmetleri var, önce onları silin veya oyunu pasife alın' }, { status: 400 })
      }
      await prisma.game.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (type === 'service') {
      const service = await prisma.service.findUnique({ where: { id } })
      if (!service) {
        return NextResponse.json({ success: false, error: 'Hizmet bulunamadı' }, { status: 404 })
      }
      const orderCount = await prisma.order.count({ where: { serviceId: id } })
      if (orderCount > 0) {
        return NextResponse.json({ success: false, error: 'Bu hizmete ait siparişler var, silmek yerine pasife alabilirsiniz' }, { status: 400 })
      }
      await prisma.service.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (type === 'blogPost') {
      await prisma.blogPost.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Geçersiz type' }, { status: 400 })
  } catch (error) {
    console.error('Admin DELETE error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}