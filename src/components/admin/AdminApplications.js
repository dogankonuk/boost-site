'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import AdminSkeleton from './AdminSkeleton'

const STATUS_LABELS = { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' }
const STATUS_COLORS = {
  pending: { bg: '#2a2a1a', border: '#3a3a1a', color: '#ffcc44' },
  approved: { bg: '#1a2a1a', border: '#2a4a2a', color: '#4caf50' },
  rejected: { bg: '#2a1a1a', border: '#4a2a2a', color: '#ff6666' },
}
const TYPE_LABELS = { booster: '🛠 Booster', content_creator: '✍️ İçerik Üretici' }

export default function AdminApplications({ secret }) {
  const [applications, setApplications] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [expandedId, setExpandedId] = useState(null)
  const [reviewNotes, setReviewNotes] = useState({})
  const [msg, setMsg] = useState('')

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }), [secret])

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=applications', { headers })
      const d = await res.json()
      if (d.success) setApplications(d.data)
    } catch {}
    setLoading(false)
  }, [headers])

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games')
      const data = await res.json()
      if (data.success) setGames(data.data)
    } catch {}
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadApplications() {
      await Promise.resolve()
      if (cancelled) return
      await Promise.all([fetchApplications(), fetchGames()])
    }

    loadApplications()
    return () => { cancelled = true }
  }, [fetchApplications, fetchGames])

  async function decide(app, status) {
    await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'application', id: app.id, data: { status, reviewNote: reviewNotes[app.id] || '' } }),
    })
    setMsg(status === 'approved' ? `${app.user?.username} onaylandı` : `${app.user?.username} reddedildi`)
    fetchApplications()
    setExpandedId(null)
    setTimeout(() => setMsg(''), 3000)
  }

  function gameNames(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return '—'
    return ids.map(id => games.find(g => g.id === id)?.name).filter(Boolean).join(', ') || '—'
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return applications
    return applications.filter(a => a.status === filter)
  }, [applications, filter])

  if (loading) return <AdminSkeleton rows={4} />

  return (
    <div>
      {msg && (
        <div onClick={() => setMsg('')} style={{
          background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: '8px',
          padding: '10px 16px', color: '#4caf50', fontSize: '13px', marginBottom: '16px', cursor: 'pointer',
        }}>{msg} ✕</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Başvurular ({filtered.length})</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'pending', label: 'Bekleyen' },
            { key: 'approved', label: 'Onaylanan' },
            { key: 'rejected', label: 'Reddedilen' },
            { key: 'all', label: 'Tümü' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
              fontFamily: 'var(--font-montserrat)', fontWeight: '600',
              cursor: 'pointer', border: '1px solid',
              background: filter === f.key ? 'var(--gold)' : 'transparent',
              color: filter === f.key ? '#0a0a0a' : 'var(--text-muted)',
              borderColor: filter === f.key ? 'var(--gold)' : 'var(--border)',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <p className="body-large">Başvuru bulunamadı.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(app => {
            const sc = STATUS_COLORS[app.status]
            const expanded = expandedId === app.id
            return (
              <div key={app.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', cursor: 'pointer' }}
                  onClick={() => setExpandedId(expanded ? null : app.id)}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#fff', fontWeight: '600', fontFamily: 'var(--font-montserrat)' }}>{app.user?.username}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {TYPE_LABELS[app.type]} · {app.user?.email} · {new Date(app.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '16px' }}>{expanded ? '▴' : '▾'}</div>
                </div>

                {expanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <DetailRow label="Discord" value={app.discord} />
                    <DetailRow label="Telegram" value={app.telegram} />
                    <DetailRow label="Oyunlar" value={gameNames(app.games)} />
                    {app.extra && Object.entries(app.extra).map(([key, value]) => (
                      value ? <DetailRow key={key} label={key} value={value} /> : null
                    ))}
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Deneyim</div>
                      <div style={{ fontSize: '13px', color: '#fff', whiteSpace: 'pre-wrap' }}>{app.experience}</div>
                    </div>

                    {Array.isArray(app.screenshots) && app.screenshots.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px' }}>Ekran Görüntüleri</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {app.screenshots.map(url => (
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                              <Image src={url} alt="Başvuru ekran görüntüsü" width={80} height={80} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {app.reviewNote && (
                      <DetailRow label="Not" value={app.reviewNote} />
                    )}

                    {app.status === 'pending' && (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          value={reviewNotes[app.id] || ''}
                          onChange={e => setReviewNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                          placeholder="Not (opsiyonel, reddederken kullanıcıya gösterilir)"
                          style={{
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px',
                            padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-primary" style={{ fontSize: '12px', padding: '7px 16px' }} onClick={() => decide(app, 'approved')}>
                            Onayla
                          </button>
                          <button onClick={() => decide(app, 'rejected')} style={{
                            background: 'transparent', border: '1px solid #4a2a2a', borderRadius: '8px',
                            padding: '7px 16px', fontSize: '12px', color: '#ff6666', cursor: 'pointer',
                          }}>
                            Reddet
                          </button>
                        </div>
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

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-dim)', minWidth: '110px', textTransform: 'capitalize' }}>{label}</span>
      <span style={{ color: '#fff' }}>{String(value)}</span>
    </div>
  )
}
