'use client'
import { useState, useEffect } from 'react'

const STATUS_COLORS = {
  pending:     { bg: '#1a1a2a', border: '#2a2a4a', color: '#8888ff' },
  assigned:    { bg: '#1a1a2a', border: '#3a3a1a', color: '#ffcc44' },
  in_progress: { bg: '#1a2a1a', border: '#2a4a2a', color: '#44aaff' },
  completed:   { bg: '#1a2a1a', border: '#2a4a2a', color: '#4caf50' },
  cancelled:   { bg: '#2a1a1a', border: '#4a2a2a', color: '#ff6666' },
}

const STATUS_LABELS = {
  pending: 'Bekliyor',
  assigned: 'Atandı',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

export default function AdminOrders({ secret }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    const res = await fetch('/api/admin?type=orders', { headers })
    const d = await res.json()
    if (d.success) setOrders(d.data)
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ type: 'order', id, data: { status } }),
    })
    fetchOrders()
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Siparişler ({filtered.length})</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
              fontFamily: 'var(--font-montserrat)', fontWeight: '600',
              cursor: 'pointer', border: '1px solid',
              background: filter === s ? 'var(--gold)' : 'transparent',
              color: filter === s ? '#0a0a0a' : 'var(--text-muted)',
              borderColor: filter === s ? 'var(--gold)' : 'var(--border)',
            }}>
              {s === 'all' ? 'Tümü' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <p className="body-large">Sipariş bulunamadı.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
            return (
              <div key={order.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '20px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      fontFamily: 'var(--font-montserrat)', fontWeight: '700',
                      fontSize: '13px', color: 'var(--gold)',
                    }}>{order.orderNumber}</span>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                      background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
                    }}>{STATUS_LABELS[order.status]}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#fff', marginBottom: '4px' }}>
                    {order.service?.game?.name} — {order.service?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {order.user?.username} · {order.price?.toLocaleString('tr-TR')} ₺ · {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <select
                  value={order.status}
                  onChange={e => updateStatus(order.id, e.target.value)}
                  style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '8px 12px',
                    color: '#fff', fontSize: '13px',
                    fontFamily: 'var(--font-inter)', outline: 'none', cursor: 'pointer',
                  }}>
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}