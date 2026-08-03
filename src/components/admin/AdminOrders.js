'use client'
import { useState, useEffect } from 'react'
import OrderTimeline from '@/components/OrderTimeline'

const STATUS_COLORS = {
  pending:     { bg: '#1a1a2a', border: '#2a2a4a', color: '#8888ff' },
  assigned:    { bg: '#2a2a1a', border: '#3a3a1a', color: '#ffcc44' },
  in_progress: { bg: '#1a2a2a', border: '#2a4a4a', color: '#44aaff' },
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
  const [boosters, setBoosters] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }

  useEffect(() => { fetchOrders(); fetchBoosters() }, [])

  async function fetchBoosters() {
    try {
      const res = await fetch('/api/admin?type=boosters', { headers })
      const d = await res.json()
      if (d.success) setBoosters(d.data.filter(b => b.status === 'active'))
    } catch {}
  }

  async function assignBooster(orderId, boosterId) {
    await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'order', id: orderId, data: { boosterId: boosterId ? parseInt(boosterId) : null } }),
    })
    fetchOrders()
  }

  async function fetchOrders() {
    setLoading(true)
    const res = await fetch('/api/admin?type=orders', { headers })
    const d = await res.json()
    if (d.success) setOrders(d.data)
    setLoading(false)
  }

  async function resolveIssue(orderId) {
    await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'order', id: orderId, data: { issueResolved: true } }),
    })
    fetchOrders()
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'].map(s => (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
            const isExpanded = expanded === order.id
            const details = order.details || {}
            const selection = details.selection || {}
            const options = order.service?.options

            return (
              <div key={order.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px 20px', cursor: 'pointer',
                }} onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{
                        fontFamily: 'var(--font-montserrat)', fontWeight: '700',
                        fontSize: '13px', color: 'var(--gold)',
                      }}>{order.orderNumber}</span>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                        background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
                      }}>{STATUS_LABELS[order.status]}</span>
                      {order.issueReport && !order.issueResolved && (
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                          background: '#2a1a1a', border: '1px solid #4a2a2a', color: '#ff6666',
                          fontWeight: '700',
                        }}>⚠️ Sorun Bildirildi</span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', color: '#fff', marginBottom: '2px' }}>
                      {order.service?.game?.name} — {order.service?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      👤 {order.user?.username} · 💰 ${order.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · 🛠️ {order.booster?.user?.username || 'Atanmadı'} · 🕐 {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <select
                      value={order.status}
                      onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value) }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: '8px', padding: '7px 12px',
                        color: '#fff', fontSize: '13px',
                        fontFamily: 'var(--font-inter)', outline: 'none', cursor: 'pointer',
                      }}>
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <div style={{
                      color: 'var(--text-dim)', fontSize: '18px',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                    }}>▾</div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '20px',
                    background: 'var(--bg-elevated)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                  }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <OrderTimeline order={order} />
                    </div>

                    <div>
                      <h4 style={{ color: 'var(--gold)', fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Sipariş Detayı
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <DetailRow label="Oyun" value={order.service?.game?.name} />
                        <DetailRow label="Hizmet" value={order.service?.name} />
                        <DetailRow label="Kategori" value={order.service?.serviceCategory || 'Genel'} />
                        <DetailRow label="Fiyat" value={`$${order.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} highlight />

                        {options?.type === 'range' && (
                          <>
                            <DetailRow label="Başlangıç" value={`${selection.from} ${options.unitName}`} />
                            <DetailRow label="Hedef" value={`${selection.to} ${options.unitName}`} />
                            <DetailRow label="Toplam" value={`${Math.max(0, selection.to - selection.from)} ${options.unitName}`} />
                          </>
                        )}
                        {options?.type === 'quantity' && (
                          <DetailRow label="Miktar" value={`${selection.quantity} × ${options.unitName}`} />
                        )}
                        {options?.type === 'options' && (
                          <DetailRow label="Seçenek" value={selection.choice} />
                        )}
                        {details.note && (
                          <DetailRow label="Müşteri Notu" value={details.note} />
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: 'var(--gold)', fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Müşteri Bilgisi
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <DetailRow label="Kullanıcı Adı" value={order.user?.username} />
                        <DetailRow label="Email" value={order.user?.email} />
                        <DetailRow label="Sipariş Tarihi" value={new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                        <DetailRow label="Sipariş No" value={order.orderNumber} />
                      </div>

                      <h4 style={{ color: 'var(--gold)', fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', margin: '16px 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Booster Ata
                      </h4>
                      <select
                        value={order.boosterId || ''}
                        onChange={e => assignBooster(order.id, e.target.value)}
                        style={{
                          width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                          borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px',
                          fontFamily: 'var(--font-inter)', outline: 'none', cursor: 'pointer', marginBottom: '16px',
                        }}>
                        <option value="">Atanmadı</option>
                        {boosters.map(b => (
                          <option key={b.id} value={b.id}>{b.user?.username}</option>
                        ))}
                      </select>

                      <h4 style={{ color: 'var(--gold)', fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', margin: '16px 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Durum Güncelle
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {Object.entries(STATUS_LABELS).map(([val, label]) => {
                          const c = STATUS_COLORS[val]
                          return (
                            <button key={val} onClick={() => updateStatus(order.id, val)}
                              style={{
                                padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                                fontFamily: 'var(--font-montserrat)', fontWeight: '600',
                                cursor: 'pointer', border: `1px solid ${c.border}`,
                                background: order.status === val ? c.bg : 'transparent',
                                color: order.status === val ? c.color : 'var(--text-muted)',
                              }}>
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {order.issueReport && (
                      <div style={{ gridColumn: 'span 2', background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '10px', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h4 style={{ color: '#ff6666', fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ⚠️ Müşteri Sorun Bildirdi
                          </h4>
                          {order.issueResolved ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✓ Çözüldü</span>
                          ) : (
                            <button onClick={() => resolveIssue(order.id)} style={{
                              padding: '5px 12px', borderRadius: '8px', fontSize: '12px',
                              fontFamily: 'var(--font-montserrat)', fontWeight: '600',
                              cursor: 'pointer', border: '1px solid #4a2a2a',
                              background: 'transparent', color: '#ff6666',
                            }}>
                              Çözüldü Olarak İşaretle
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: '13px', color: '#fff', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {order.issueReport}
                        </p>
                        {order.issueReportedAt && (
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
                            {new Date(order.issueReportedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-dim)', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: '13px',
        color: highlight ? 'var(--gold)' : '#fff',
        fontWeight: highlight ? '700' : '400',
        fontFamily: highlight ? 'var(--font-montserrat)' : 'var(--font-inter)',
        textAlign: 'right',
      }}>{value || '—'}</span>
    </div>
  )
}