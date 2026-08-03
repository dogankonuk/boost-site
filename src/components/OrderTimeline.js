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

const STATUS_ORDER = ['pending', 'assigned', 'in_progress', 'completed']
const CURRENT_COLORS = {
  pending: 'var(--text-muted)',
  assigned: 'var(--gold)',
  in_progress: '#44aaff',
  completed: '#4caf50',
  cancelled: '#ff6666',
}

export default function OrderTimeline({ order }) {
  const isCancelled = order.status === 'cancelled'
  const statusIndex = STATUS_ORDER.indexOf(order.status)

  const steps = isCancelled
    ? [
        { key: 'placed', label: 'Placed', at: order.createdAt, icon: '📦', reached: true, current: false },
        { key: 'cancelled', label: 'Cancelled', at: order.cancelledAt, icon: '✕', reached: true, current: true },
      ]
    : [
        { key: 'placed', label: 'Placed', at: order.createdAt, icon: '📦', reached: true, current: statusIndex === 0 },
        { key: 'assigned', label: 'Assigned', at: order.assignedAt, icon: '🛠', reached: statusIndex >= 1, current: statusIndex === 1 },
        { key: 'started', label: 'Started', at: order.startedAt, icon: '▶', reached: statusIndex >= 2, current: statusIndex === 2 },
        { key: 'completed', label: 'Completed', at: order.completedAt, icon: '✅', reached: statusIndex >= 3, current: statusIndex === 3 },
      ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
      {steps.map((step, i) => (
        <span key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ color: 'var(--border)' }}>→</span>}
          <span style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            color: step.current ? CURRENT_COLORS[order.status] : step.reached ? 'var(--text-muted)' : 'var(--text-dim)',
            fontWeight: step.current ? '700' : '400',
            opacity: step.reached ? 1 : 0.5,
          }}>
            <span>{step.icon}</span>
            <span>{step.label}</span>
            {step.reached && step.at && <span style={{ color: 'var(--text-dim)', fontWeight: '400' }}>· {timeAgo(step.at)}</span>}
          </span>
        </span>
      ))}
    </div>
  )
}
