function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function OrderTimeline({ order }) {
  const isCancelled = order.status === 'cancelled'

  const steps = [
    { label: 'Placed', at: order.createdAt, icon: '📦' },
    { label: 'Assigned', at: order.assignedAt, icon: '🛠' },
    ...(isCancelled ? [] : [{ label: 'Started', at: order.startedAt, icon: '▶' }]),
    isCancelled
      ? { label: 'Cancelled', at: order.cancelledAt, icon: '✕' }
      : { label: 'Completed', at: order.completedAt, icon: '✅' },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
      {steps.map((step, i) => {
        const reached = !!step.at
        return (
          <span key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {i > 0 && <span style={{ color: 'var(--border)' }}>→</span>}
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              color: reached ? (step.label === 'Cancelled' ? '#ff6666' : 'var(--text-muted)') : 'var(--text-dim)',
              opacity: reached ? 1 : 0.5,
            }}>
              <span>{step.icon}</span>
              <span>{step.label}</span>
              {reached && <span style={{ color: 'var(--text-dim)' }}>· {timeAgo(step.at)}</span>}
            </span>
          </span>
        )
      })}
    </div>
  )
}
