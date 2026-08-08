'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import AdminSkeleton from './AdminSkeleton'

const STATUS_LABELS = { active: 'Aktif', inactive: 'Pasif' }
const STATUS_COLORS = {
  active: { bg: '#1a2a1a', border: '#2a4a2a', color: '#4caf50' },
  inactive: { bg: '#2a1a1a', border: '#4a2a2a', color: '#ff6666' },
}

function money(n) {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AdminBoosters({ secret }) {
  const [boosters, setBoosters] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [msg, setMsg] = useState('')
  const [editGamesFor, setEditGamesFor] = useState(null)
  const [editGamesSelection, setEditGamesSelection] = useState([])
  const [expandedId, setExpandedId] = useState(null)

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }), [secret])

  const fetchBoosters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=boosters', { headers })
      const d = await res.json()
      if (d.success) setBoosters(d.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [headers])

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/admin?type=games', { headers })
      const d = await res.json()
      if (d.success) setGames(d.data)
    } catch {}
  }, [headers])

  useEffect(() => {
    let cancelled = false

    async function loadBoosters() {
      await Promise.resolve()
      if (cancelled) return
      await Promise.all([fetchBoosters(), fetchGames()])
    }

    loadBoosters()
    return () => { cancelled = true }
  }, [fetchBoosters, fetchGames])

  async function toggleStatus(booster) {
    await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'booster', id: booster.id, data: { status: booster.status === 'active' ? 'inactive' : 'active' } }),
    })
    fetchBoosters()
  }

  function startEditGames(booster) {
    setEditGamesFor(booster.id)
    setEditGamesSelection(Array.isArray(booster.games) ? booster.games : [])
  }

  async function saveGames(boosterId) {
    await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'booster', id: boosterId, data: { games: editGamesSelection.length > 0 ? editGamesSelection : null } }),
    })
    setEditGamesFor(null)
    fetchBoosters()
  }

  function gameNames(ids) {
    if (!ids || ids.length === 0) return 'Tüm oyunlar'
    return ids.map(id => games.find(g => g.id === id)?.name).filter(Boolean).join(', ') || 'Tüm oyunlar'
  }

  if (loading) return <AdminSkeleton rows={5} />

  return (
    <div>
      {msg && (
        <div onClick={() => setMsg('')} style={{
          background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: '8px',
          padding: '10px 16px', color: '#4caf50', fontSize: '13px', marginBottom: '16px', cursor: 'pointer',
        }}>{msg} ✕</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Boosterlar ({boosters.length})</h2>
        <button className="btn-primary" onClick={() => setShowAdd(v => !v)}>+ Booster Ekle</button>
      </div>

      {showAdd && (
        <AddBoosterForm headers={headers} games={games} onDone={() => { setShowAdd(false); fetchBoosters(); setMsg('Booster eklendi') }} />
      )}

      {boosters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <p className="body-large">Henüz booster eklenmemiş.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {boosters.map(b => {
            const sc = STATUS_COLORS[b.status] || STATUS_COLORS.inactive
            const orders = b.orders || []
            const activeOrders = orders.filter(o => ['assigned', 'in_progress'].includes(o.status))
            const completedOrders = orders.filter(o => o.status === 'completed')
            const issueOrders = orders.filter(o => o.issueReport && !o.issueResolved)
            const expanded = expandedId === b.id
            return (
              <div key={b.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '700', color: 'var(--gold)',
                    fontFamily: 'var(--font-montserrat)', flexShrink: 0,
                  }}>{b.user?.username?.[0]?.toUpperCase()}</div>

                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>{b.user?.username}</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>{STATUS_LABELS[b.status]}</span>
                      {issueOrders.length > 0 && (
                        <span style={{
                          fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                          background: '#2a1a1a', border: '1px solid #4a2a2a', color: '#ff6666', fontWeight: '700',
                        }}>⚠️ {issueOrders.length} Sorun</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{b.user?.email}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '18px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Stat label="Aktif" value={activeOrders.length} />
                    <Stat label="Tamamlanan" value={completedOrders.length} />
                    <Stat label="Puan" value={b.rating > 0 ? b.rating.toFixed(1) : '—'} />
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => setExpandedId(expanded ? null : b.id)}>
                      {expanded ? 'Detayları Gizle' : 'Detaylar'}
                    </button>
                    <button className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => editGamesFor === b.id ? setEditGamesFor(null) : startEditGames(b)}>
                      Oyunlar
                    </button>
                    <button className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => toggleStatus(b)}>
                      {b.status === 'active' ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
                  Yetkili olduğu oyunlar: {gameNames(b.games)}
                </div>

                {expanded && (
                  <BoosterDetail activeOrders={activeOrders} completedOrders={completedOrders} issueOrders={issueOrders} />
                )}

                {editGamesFor === b.id && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                      Boş bırakılırsa booster tüm oyunlardan sipariş görebilir.
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {games.map(g => {
                        const selected = editGamesSelection.includes(g.id)
                        return (
                          <button key={g.id} type="button"
                            onClick={() => setEditGamesSelection(sel => selected ? sel.filter(id => id !== g.id) : [...sel, g.id])}
                            style={{
                              padding: '5px 12px', borderRadius: '20px', fontSize: '12px',
                              fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer',
                              border: '1px solid', background: selected ? 'var(--gold)' : 'transparent',
                              color: selected ? '#0a0a0a' : 'var(--text-muted)',
                              borderColor: selected ? 'var(--gold)' : 'var(--border)',
                            }}>{g.name}</button>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => saveGames(b.id)}>Kaydet</button>
                      <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => setEditGamesFor(null)}>İptal</button>
                    </div>
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

function BoosterDetail({ activeOrders, completedOrders, issueOrders }) {
  return (
    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {issueOrders.length > 0 && (
        <div>
          <h4 style={{ fontSize: '11px', color: '#ff6666', fontFamily: 'var(--font-montserrat)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            ⚠️ Sorun Bildirilen Siparişler
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {issueOrders.map(o => (
              <div key={o.id} style={{ background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '12px', color: '#fff', fontWeight: '600' }}>
                  {o.service?.game?.name} — {o.service?.name} <span style={{ color: 'var(--text-dim)', fontWeight: '400' }}>· 👤 {o.user?.username} · {o.orderNumber}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#ff9999', marginTop: '4px' }}>{o.issueReport}</div>
                {o.issueReportedAt && (
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {new Date(o.issueReportedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Üzerinde Çalıştığı İşler ({activeOrders.length})
        </h4>
        {activeOrders.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Şu anda üzerinde çalıştığı bir iş yok.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeOrders.map(o => (
              <OrderRow key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Tamamladığı İşler ({completedOrders.length})
        </h4>
        {completedOrders.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Henüz tamamlanmış bir işi yok.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
            {completedOrders.map(o => (
              <OrderRow key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderRow({ order }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
      background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px',
      fontSize: '12px', flexWrap: 'wrap',
    }}>
      <span style={{ color: '#fff' }}>
        {order.service?.game?.name} — {order.service?.name}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>👤 {order.user?.username}</span>
      <span style={{ color: 'var(--gold)', fontWeight: '600' }}>{money(order.price)}</span>
      <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
        {new Date(order.createdAt).toLocaleDateString('tr-TR')}
      </span>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: 'var(--gold)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{label}</div>
    </div>
  )
}

function AddBoosterForm({ headers, games, onDone }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedGames, setSelectedGames] = useState([])
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  function handleQueryChange(v) {
    setQuery(v)
    setSelectedUser(null)
    clearTimeout(timerRef.current)
    if (v.trim().length < 2) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/admin?type=userSearch&q=${encodeURIComponent(v.trim())}`, { headers })
        const d = await res.json()
        if (d.success) setResults(d.data)
      } catch {}
      setSearching(false)
    }, 300)
  }

  async function submit() {
    if (!selectedUser) { setError('Bir kullanıcı seç'); return }
    setError('')
    const res = await fetch('/api/admin', {
      method: 'POST', headers,
      body: JSON.stringify({ type: 'booster', data: { userId: selectedUser.id, games: selectedGames } }),
    })
    const d = await res.json()
    if (d.success) onDone()
    else setError(d.error || 'Hata')
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
      <h3 className="h4" style={{ color: '#fff', marginBottom: '14px' }}>Yeni Booster</h3>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kullanıcı adı veya email ara</label>
        <input value={query} onChange={e => handleQueryChange(e.target.value)} placeholder="kullanici_adi"
          style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', outline: 'none' }} />

        {selectedUser ? (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245,197,24,0.1)', border: '1px solid var(--gold)', borderRadius: '6px', padding: '6px 10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '600' }}>{selectedUser.username}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({selectedUser.email})</span>
            <button onClick={() => setSelectedUser(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
          </div>
        ) : results.length > 0 && (
          <div style={{ marginTop: '6px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            {results.map(u => (
              <div key={u.id} onClick={() => { setSelectedUser(u); setResults([]) }} style={{
                padding: '8px 10px', fontSize: '13px', cursor: 'pointer', color: '#fff',
                borderBottom: '1px solid var(--border)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {u.username} <span style={{ color: 'var(--text-dim)' }}>({u.email})</span>
              </div>
            ))}
          </div>
        )}
        {searching && <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>Aranıyor...</div>}
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Yetkili olduğu oyunlar (boş = tüm oyunlar)
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {games.map(g => {
            const selected = selectedGames.includes(g.id)
            return (
              <button key={g.id} type="button"
                onClick={() => setSelectedGames(sel => selected ? sel.filter(id => id !== g.id) : [...sel, g.id])}
                style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '12px',
                  fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer',
                  border: '1px solid', background: selected ? 'var(--gold)' : 'transparent',
                  color: selected ? '#0a0a0a' : 'var(--text-muted)',
                  borderColor: selected ? 'var(--gold)' : 'var(--border)',
                }}>{g.name}</button>
            )
          })}
        </div>
      </div>

      {error && <p style={{ color: '#ff6666', fontSize: '12px', marginBottom: '10px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-primary" onClick={submit}>Kaydet</button>
        <button className="btn-secondary" onClick={onDone}>İptal</button>
      </div>
    </div>
  )
}
