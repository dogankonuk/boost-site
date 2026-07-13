export const ORDER_STATUS_NOTIF_TITLES = {
  assigned: 'Siparişin bir boostera atandı',
  in_progress: 'Siparişin işleme alındı',
  completed: 'Siparişin tamamlandı! 🎉',
  cancelled: 'Siparişin iptal edildi',
}

// Notifies the customer (order.userId) when their order's status changes.
// Safe to call even if it fails — errors are swallowed so a notification hiccup
// never blocks the actual status update from succeeding.
export async function notifyOrderStatus(prisma, order, status) {
  const title = ORDER_STATUS_NOTIF_TITLES[status]
  if (!title) return
  try {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'order_status',
        title,
        body: `${order.service?.game?.name || ''} — ${order.service?.name || ''}`.trim(),
        link: '/dashboard',
      },
    })
  } catch (err) {
    console.error('notifyOrderStatus error:', err)
  }
}
