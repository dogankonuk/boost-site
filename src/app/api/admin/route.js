import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sendOrderStatusUpdate, sendBlogUnpublishedEmail, sendApplicationDecisionEmail } from '@/lib/email'
import { notifyOrderStatus, notifyBlogApproved, notifyBlogRejected } from '@/lib/notify'
import { maybeAwardReferralBonus } from '@/lib/referral'
import { buildPeriodBuckets } from '@/lib/adminAnalyticsPeriods'

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar'

// Only these accounts may grant or revoke admin access from others. A regular
// admin promoted later (even via this same panel) cannot mint new admins —
// this caps the blast radius if a non-founder admin account is ever compromised.
const FOUNDER_EMAILS = ['dogankonuk@gmail.com', 'mrtatessacan@gmail.com', 'dogankonuk2@gmail.com']

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
        content: `<@${booster.discordId}> a new order was assigned to you!`,
        embeds: [{
          title: '🛠️ Order Assigned',
          color: 0xF5C518,
          fields: [
            { name: '📋 Order #', value: order.orderNumber, inline: true },
            { name: '🎯 Game', value: order.service?.game?.name || '-', inline: true },
            { name: '⚡ Service', value: order.service?.name || '-', inline: true },
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
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

    if (type === 'contactMessages') {
      const status = searchParams.get('status')
      const messages = await prisma.contactMessage.findMany({
        where: status && status !== 'all' ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
      const unreadCount = await prisma.contactMessage.count({ where: { status: 'new' } })
      return NextResponse.json({ success: true, data: messages, unreadCount })
    }

    if (type === 'games') {
      const games = await prisma.game.findMany({
        include: { services: true },
        orderBy: { sortOrder: 'asc' }
      })
      return NextResponse.json({ success: true, data: games })
    }

    if (type === 'gameCategories') {
      const [games, setting] = await Promise.all([
        prisma.game.findMany({
          select: { category: true },
          where: { isActive: true }
        }),
        prisma.setting.findUnique({ where: { key: 'gameCategories' } }),
      ])
      const autoCategories = [...new Set(
        games.flatMap(g => g.category ? g.category.split(', ') : [])
      )]

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
      const period = searchParams.get('period') || '14d'
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

      const [totalUsers, totalBoosters, activeBoosters, orders, games, boosters, pendingApplications, usersLast30, usersPrev30] = await Promise.all([
        prisma.user.count(),
        prisma.booster.count(),
        prisma.booster.count({ where: { status: 'active' } }),
        prisma.order.findMany({
          select: {
            userId: true, status: true, price: true, createdAt: true, rating: true,
            issueReport: true, issueResolved: true, discountAmount: true,
            serviceId: true, boosterId: true,
            service: { select: { name: true, serviceCategory: true, game: { select: { id: true, name: true } } } },
          },
        }),
        prisma.game.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.booster.findMany({ include: { user: { select: { username: true } } } }),
        prisma.application.count({ where: { status: 'pending' } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      ])

      const statusCounts = { pending: 0, assigned: 0, in_progress: 0, completed: 0, cancelled: 0 }
      let totalRevenue = 0, last30Revenue = 0, prev30Revenue = 0, totalDiscountGiven = 0
      let openIssues = 0, unratedCompleted = 0
      const gameStats = {}
      const serviceStats = {}
      const categoryStats = {}
      const boosterStats = {}
      const usersWithAnyOrder = new Set()
      const completedCountByUser = {}

      const { buckets, bucketIndex, bucketKeyFor, rangeStart } = buildPeriodBuckets(
        period, searchParams.get('startDate'), searchParams.get('endDate')
      )

      for (const o of orders) {
        if (statusCounts[o.status] !== undefined) statusCounts[o.status]++
        if (o.issueReport && !o.issueResolved) openIssues++
        if (o.status === 'completed' && !o.rating) unratedCompleted++
        usersWithAnyOrder.add(o.userId)
        if (o.status === 'completed') completedCountByUser[o.userId] = (completedCountByUser[o.userId] || 0) + 1

        const gameId = o.service?.game?.id
        const gameName = o.service?.game?.name || 'Unknown'
        const serviceId = o.serviceId
        const serviceName = o.service?.name || 'Unknown'
        const categoryName = o.service?.serviceCategory || 'Genel'
        const isActiveStatus = ['pending', 'assigned', 'in_progress'].includes(o.status)

        if (gameId) {
          if (!gameStats[gameId]) gameStats[gameId] = { name: gameName, orders: 0, activeOrders: 0, revenue: 0 }
          gameStats[gameId].orders++
          if (isActiveStatus) gameStats[gameId].activeOrders++
        }
        if (serviceId) {
          if (!serviceStats[serviceId]) serviceStats[serviceId] = { id: serviceId, name: serviceName, gameName, orders: 0, activeOrders: 0, completedOrders: 0, revenue: 0 }
          serviceStats[serviceId].orders++
          if (isActiveStatus) serviceStats[serviceId].activeOrders++
          if (o.status === 'completed') serviceStats[serviceId].completedOrders++
        }
        if (!categoryStats[categoryName]) categoryStats[categoryName] = { name: categoryName, orders: 0, revenue: 0 }
        categoryStats[categoryName].orders++
        if (o.boosterId) {
          if (!boosterStats[o.boosterId]) boosterStats[o.boosterId] = { ordersHandled: 0, completedOrders: 0, activeOrders: 0, revenue: 0 }
          boosterStats[o.boosterId].ordersHandled++
          if (isActiveStatus) boosterStats[o.boosterId].activeOrders++
          if (o.status === 'completed') boosterStats[o.boosterId].completedOrders++
        }

        if (o.status === 'completed') {
          totalRevenue += o.price
          totalDiscountGiven += (o.discountAmount || 0)
          if (o.createdAt >= thirtyDaysAgo) last30Revenue += o.price
          else if (o.createdAt >= sixtyDaysAgo) prev30Revenue += o.price
          if (gameId) gameStats[gameId].revenue += o.price
          if (serviceId) serviceStats[serviceId].revenue += o.price
          categoryStats[categoryName].revenue += o.price
          if (o.boosterId) boosterStats[o.boosterId].revenue += o.price
          const bk = bucketKeyFor(o.createdAt)
          if (bucketIndex[bk] !== undefined) {
            const bucket = buckets[bucketIndex[bk]]
            bucket.revenue += o.price
            bucket.orders += 1
            bucket.byGame[gameName] = (bucket.byGame[gameName] || 0) + o.price
            // Service names aren't unique across games (many games reuse
            // generic names like "Battlepass Boost"), so the trend key must
            // include the game — otherwise two distinct services would
            // collide under one dataKey and the stacked chart would double
            // that segment's height.
            const serviceTrendKey = `${serviceName} · ${gameName}`
            bucket.byService[serviceTrendKey] = (bucket.byService[serviceTrendKey] || 0) + o.price
          }
        }
      }

      for (const g of games) {
        if (!gameStats[g.id]) gameStats[g.id] = { name: g.name, orders: 0, activeOrders: 0, revenue: 0 }
      }
      const gameBreakdown = Object.values(gameStats).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
      const serviceBreakdown = Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
      const categoryBreakdown = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
      const boosterBreakdown = boosters.map(b => ({
        id: b.id,
        username: b.user?.username || 'Unknown',
        status: b.status,
        rating: b.rating,
        completedCount: b.completedCount,
        ordersHandled: boosterStats[b.id]?.ordersHandled || 0,
        completedOrders: boosterStats[b.id]?.completedOrders || 0,
        activeOrders: boosterStats[b.id]?.activeOrders || 0,
        revenue: boosterStats[b.id]?.revenue || 0,
      })).sort((a, b) => b.revenue - a.revenue || b.completedOrders - a.completedOrders)

      // Collapse each bucket's per-key revenue down to the top-5 lifetime
      // earners (by gameBreakdown/serviceBreakdown, not per-bucket) plus a
      // "Diğer" catch-all, so the stacked chart has a stable, short legend
      // instead of one series per game/service that ever sold anything.
      function buildTrend(breakdown, bucketKey, keyFn = b => b.name) {
        const topKeys = breakdown.slice(0, 5).map(keyFn)
        const topSet = new Set(topKeys)
        const trendBuckets = buckets.map(bucket => {
          const row = { date: bucket.date }
          let otherTotal = 0
          for (const key of topKeys) row[key] = 0
          for (const [name, revenue] of Object.entries(bucket[bucketKey])) {
            if (topSet.has(name)) row[name] += revenue
            else otherTotal += revenue
          }
          row['Diğer'] = otherTotal
          return row
        })
        return { topKeys: [...topKeys, 'Diğer'], buckets: trendBuckets }
      }
      const trendByGame = buildTrend(gameBreakdown, 'byGame')
      const trendByService = buildTrend(serviceBreakdown, 'byService', s => `${s.name} · ${s.gameName}`)

      // byGame/byService were only scratch space for building trendByGame/
      // trendByService above — strip them so the plain revenueTrend payload
      // (still used by the existing Overview chart) doesn't balloon in size.
      for (const bucket of buckets) { delete bucket.byGame; delete bucket.byService }

      const revenueGrowthPct = prev30Revenue > 0
        ? Math.round(((last30Revenue - prev30Revenue) / prev30Revenue) * 100)
        : (last30Revenue > 0 ? 100 : 0)
      const userGrowthPct = usersPrev30 > 0
        ? Math.round(((usersLast30 - usersPrev30) / usersPrev30) * 100)
        : (usersLast30 > 0 ? 100 : 0)

      // Activation: % of all registered users who have ever placed an order (any status).
      // Repeat rate: among customers with a completed order, % who completed 2+.
      const activationRate = totalUsers > 0 ? Math.round((usersWithAnyOrder.size / totalUsers) * 100) : 0
      const completedCustomerCount = Object.keys(completedCountByUser).length
      const repeatCustomerCount = Object.values(completedCountByUser).filter(c => c >= 2).length
      const repeatCustomerRate = completedCustomerCount > 0
        ? Math.round((repeatCustomerCount / completedCustomerCount) * 100)
        : 0

      return NextResponse.json({
        success: true,
        data: {
          totalUsers, totalBoosters, activeBoosters,
          totalOrders: orders.length,
          totalRevenue, last30Revenue, revenueGrowthPct, totalDiscountGiven,
          usersLast30, userGrowthPct,
          activationRate, repeatCustomerRate,
          statusCounts, gameBreakdown, revenueTrend: buckets, period,
          rangeStart: rangeStart.toISOString().slice(0, 10),
          rangeEnd: buckets[buckets.length - 1]?.date,
          pendingApplications, openIssues, unratedCompleted,
          serviceBreakdown, categoryBreakdown, boosterBreakdown, trendByGame, trendByService,
        },
      })
    }

    if (type === 'serviceTrend') {
      const serviceId = parseInt(searchParams.get('serviceId'))
      if (!serviceId) return NextResponse.json({ success: false, error: 'serviceId is required' }, { status: 400 })

      const { buckets, bucketIndex, bucketKeyFor, rangeStart } = buildPeriodBuckets(
        searchParams.get('period') || '14d', searchParams.get('startDate'), searchParams.get('endDate')
      )
      const [service, orders] = await Promise.all([
        prisma.service.findUnique({ where: { id: serviceId }, select: { name: true, game: { select: { name: true } } } }),
        prisma.order.findMany({
          where: { serviceId, status: 'completed', createdAt: { gte: rangeStart } },
          select: { price: true, createdAt: true },
        }),
      ])
      if (!service) return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })

      for (const o of orders) {
        const bk = bucketKeyFor(o.createdAt)
        if (bucketIndex[bk] !== undefined) {
          buckets[bucketIndex[bk]].revenue += o.price
          buckets[bucketIndex[bk]].orders += 1
        }
      }
      for (const b of buckets) { delete b.byGame; delete b.byService }

      return NextResponse.json({
        success: true,
        data: { name: service.name, gameName: service.game?.name, buckets },
      })
    }

    if (type === 'boosterTrend') {
      const boosterId = parseInt(searchParams.get('boosterId'))
      if (!boosterId) return NextResponse.json({ success: false, error: 'boosterId is required' }, { status: 400 })

      const { buckets, bucketIndex, bucketKeyFor, rangeStart } = buildPeriodBuckets(
        searchParams.get('period') || '14d', searchParams.get('startDate'), searchParams.get('endDate')
      )
      const [booster, orders] = await Promise.all([
        prisma.booster.findUnique({ where: { id: boosterId }, select: { user: { select: { username: true } } } }),
        prisma.order.findMany({
          where: { boosterId, status: 'completed', createdAt: { gte: rangeStart } },
          select: { price: true, createdAt: true },
        }),
      ])
      if (!booster) return NextResponse.json({ success: false, error: 'Booster not found' }, { status: 404 })

      for (const o of orders) {
        const bk = bucketKeyFor(o.createdAt)
        if (bucketIndex[bk] !== undefined) {
          buckets[bucketIndex[bk]].revenue += o.price
          buckets[bucketIndex[bk]].orders += 1
        }
      }
      for (const b of buckets) { delete b.byGame; delete b.byService }

      return NextResponse.json({
        success: true,
        data: { username: booster.user?.username || 'Unknown', buckets },
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
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Admin POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, id, data } = body

    if (type === 'contactMessage') {
      const nextStatus = data?.status
      if (!['new', 'read', 'resolved'].includes(nextStatus)) {
        return NextResponse.json({ success: false, error: 'Invalid contact message status' }, { status: 400 })
      }
      const message = await prisma.contactMessage.update({
        where: { id: parseInt(id) },
        data: { status: nextStatus },
      })
      return NextResponse.json({ success: true, data: message })
    }

    if (type === 'order') {
      const existingOrder = await prisma.order.findUnique({ where: { id: parseInt(id) } })

      // Assigning a booster from the dropdown only sends { boosterId }, with no
      // explicit status — without this, the order stayed "pending" until the
      // admin also remembered to flip the status dropdown separately.
      if ('boosterId' in data && data.boosterId && !('status' in data) && existingOrder?.status === 'pending') {
        data.status = 'assigned'
      }

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
            title: 'New order assigned',
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
        addons: data.addons ?? null,
        discoveryGoals: Array.isArray(data.discoveryGoals) && data.discoveryGoals.length ? data.discoveryGoals : null,
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
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 })
      }

      // Any path to isPublished:true (the plain publish toggle, or a
      // dedicated approve action) counts as approving the post — keeps
      // reviewStatus honest regardless of which admin control was used —
      // and backfills publishedAt so it's actually visible to the public
      // queries that filter on it, the same auto-set the creator route does.
      if (data.isPublished === true) {
        if (!data.reviewStatus) data.reviewStatus = 'approved'
        if (data.reviewNote === undefined) data.reviewNote = null
        if (!existing.publishedAt && !data.publishedAt) data.publishedAt = new Date()
      }

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

      if (!existing?.isPublished && data.isPublished === true) {
        await notifyBlogApproved(prisma, { userId: existing.authorId, title: post.title, slug: post.slug })
      }

      if (data.reviewStatus === 'rejected' && existing?.reviewStatus !== 'rejected') {
        await notifyBlogRejected(prisma, { userId: existing.authorId, title: post.title, reviewNote: data.reviewNote })
      }

      return NextResponse.json({ success: true, data: post })
    }

    if (type === 'application') {
      const application = await prisma.application.findUnique({
        where: { id: parseInt(id) },
        include: { user: { select: { email: true, username: true } } },
      })
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
        const appLabel = application.type === 'booster' ? 'Booster application' : 'Content creator application'
        const reviewNote = data.reviewNote?.trim()
        await prisma.notification.create({
          data: {
            userId: application.userId,
            type: 'application_status',
            title: decision === 'approved' ? 'Your application was approved! 🎉' : 'Your application was not approved',
            body: decision === 'approved' || !reviewNote ? appLabel : `${appLabel}: ${reviewNote}`,
            link: decision === 'approved' ? (application.type === 'booster' ? '/booster' : '/creator') : `/apply/${application.type === 'booster' ? 'booster' : 'content-creator'}`,
          },
        })
      } catch (err) {
        console.error('application notification error:', err)
      }

      if (application.user?.email) {
        sendApplicationDecisionEmail({
          to: application.user.email,
          username: application.user.username,
          type: application.type,
          decision,
          reviewNote: data.reviewNote?.trim(),
        }).catch(err => console.error('application decision email error:', err))
      }

      return NextResponse.json({ success: true, data: updated })
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Admin PATCH error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Admin DELETE error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
