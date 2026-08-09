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
