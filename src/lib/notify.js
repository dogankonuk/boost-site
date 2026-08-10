export const ORDER_STATUS_NOTIF_TITLES = {
  assigned: 'Your order was assigned to a booster',
  in_progress: 'Your order is now in progress',
  completed: 'Your order is complete! Please rate your experience ⭐',
  cancelled: 'Your order was cancelled',
}

// Notifies the customer (order.userId) when their order's status changes.
// Safe to call even if it fails — errors are swallowed so a notification hiccup
// never blocks the actual status update from succeeding.
export async function notifyOrderStatus(prisma, order, status) {
  const title = ORDER_STATUS_NOTIF_TITLES[status]
  if (!title) return
  const body = status === 'completed'
    ? `${order.service?.game?.name || ''} — ${order.service?.name || ''}. Your feedback helps us raise our service standards!`.trim()
    : `${order.service?.game?.name || ''} — ${order.service?.name || ''}`.trim()
  try {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'order_status',
        title,
        body,
        link: status === 'completed'
          ? `/dashboard?tab=orders&orderId=${order.id}`
          : '/dashboard',
      },
    })
  } catch (err) {
    console.error('notifyOrderStatus error:', err)
  }
}

// Notifies the customer when their booster releases the order back to the pool.
export async function notifyOrderReleased(prisma, order) {
  try {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'order_status',
        title: 'Your order is back in the queue',
        body: `${order.service?.game?.name || ''} — ${order.service?.name || ''}. Another booster will pick it up soon.`.trim(),
        link: '/dashboard',
      },
    })
  } catch (err) {
    console.error('notifyOrderReleased error:', err)
  }
}

// Notifies a user (referrer or referred) that a referral bonus was credited to
// their account — without this, the only way to notice is stumbling onto the
// updated points balance, which breaks the reward-delivery half of the loop.
export async function notifyReferralBonus(prisma, { userId, points, role }) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'referral_bonus',
        title: `You earned +${points} loyalty points!`,
        body: role === 'referrer'
          ? 'A friend you invited just completed their first order.'
          : "Welcome bonus for joining via a friend's referral link.",
        link: '/dashboard?tab=account',
      },
    })
  } catch (err) {
    console.error('notifyReferralBonus error:', err)
  }
}

// Notifies every admin when a creator submits a post for review — there's no
// other signal that tells them a queue item exists otherwise.
export async function notifyBlogPendingReview(prisma, { post, authorUsername }) {
  try {
    const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } })
    if (admins.length === 0) return
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'blog_pending_review',
        title: 'New post awaiting review',
        body: `"${post.title}" by ${authorUsername}`,
        link: '/admin',
      })),
    })
  } catch (err) {
    console.error('notifyBlogPendingReview error:', err)
  }
}

// Notifies a content creator that their submitted post was approved and is live.
export async function notifyBlogApproved(prisma, { userId, title, slug }) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'blog_approved',
        title: 'Your post was approved and is now live! 🎉',
        body: title,
        link: `/blog/${slug}`,
      },
    })
  } catch (err) {
    console.error('notifyBlogApproved error:', err)
  }
}

// Notifies a content creator that their submitted post needs changes.
export async function notifyBlogRejected(prisma, { userId, title, reviewNote }) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'blog_rejected',
        title: 'Your post needs changes before it can go live',
        body: reviewNote || title,
        link: '/creator',
      },
    })
  } catch (err) {
    console.error('notifyBlogRejected error:', err)
  }
}

// Notifies a content creator when one of their posts crosses a view milestone.
export async function notifyBlogMilestone(prisma, { userId, title, views }) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'blog_milestone',
        title: `Your post passed ${views.toLocaleString('en-US')} views! 🎉`,
        body: title,
        link: '/creator',
      },
    })
  } catch (err) {
    console.error('notifyBlogMilestone error:', err)
  }
}

// Notifies every admin when a customer reports a problem with an order — the
// booster-only notification this used to be paired with isn't enough when an
// order has no booster assigned yet, or the booster is the source of the issue.
export async function notifyAdminsOrderIssue(prisma, { order, message }) {
  try {
    const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } })
    if (admins.length === 0) return
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'order_issue',
        title: `Issue reported — order ${order.orderNumber}`,
        body: message.slice(0, 200),
        link: '/admin',
      })),
    })
  } catch (err) {
    console.error('notifyAdminsOrderIssue error:', err)
  }
}

// Notifies every admin when someone submits the public contact form.
export async function notifyAdminsContactMessage(prisma, { id, name, orderNumber }) {
  try {
    const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } })
    if (admins.length === 0) return
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'contact_message',
        title: 'New contact form message',
        body: orderNumber ? `${name} — order ${orderNumber}` : name,
        link: `/admin?tab=contact&contactId=${id}`,
      })),
    })
  } catch (err) {
    console.error('notifyAdminsContactMessage error:', err)
  }
}

// Notifies a user that they've received a new message on an order's chat thread.
export async function notifyNewMessage(prisma, { recipientUserId, senderUsername, orderNumber, link }) {
  try {
    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        type: 'message',
        title: `New message from ${senderUsername}`,
        body: `Order ${orderNumber}`,
        link,
      },
    })
  } catch (err) {
    console.error('notifyNewMessage error:', err)
  }
}
