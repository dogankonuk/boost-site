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
        link: status === 'completed' ? '/dashboard?tab=account' : '/dashboard',
      },
    })
  } catch (err) {
    console.error('notifyOrderStatus error:', err)
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
