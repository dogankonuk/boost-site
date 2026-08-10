'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import AdminSkeleton from './AdminSkeleton'

function money(n) {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AdminUsers({ secret }) {
  const [users, setUsers] = useState([])
  const [viewerIsFounder, setViewerIsFounder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState(null)
  const [fetchError, setFetchError] = useState('')
  const [confirmAdminId, setConfirmAdminId] = useState(null)

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }), [secret])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch('/api/admin?type=users', { headers })
      const d = await res.json()
      if (d.success) { setUsers(d.data); setViewerIsFounder(!!d.viewerIsFounder) }
      else setFetchError(d.error || 'Kullanıcılar yüklenemedi')
    } catch (e) {
      console.error(e)
      setFetchError('Kullanıcılar yüklenemedi')
    }
    setLoading(false)
  }, [headers])

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      await Promise.resolve()
      if (!cancelled) await fetchUsers()
    }

    loadUsers()
    return () => { cancelled = true }
  }, [fetchUsers])

  function flash(text, type = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), type === 'error' ? 4000 : 3000)
  }

  async function toggleActive(user) {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH', headers,
        body: JSON.stringify({ type: 'user', id: user.id, data: { isActive: !user.isActive } }),
      })
      const d = await res.json()
      if (!d.success) { flash(d.error || 'Hata oluştu', 'error'); return }
      flash(user.isActive ? `${user.username} pasifleştirildi` : `${user.username} aktifleştirildi`)
      fetchUsers()
    } catch (e) {
      console.error(e)
      flash('Durum güncellenemedi', 'error')
    }
  }

  async function toggleContentCreator(user) {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH', headers,
        body: JSON.stringify({ type: 'user', id: user.id, data: { isContentCreator: !user.isContentCreator } }),
      })
      const d = await res.json()
      if (!d.success) { flash(d.error || 'Hata oluştu', 'error'); return }
      flash(user.isContentCreator ? `${user.username} icerik ureticiligi kaldirildi` : `${user.username} icerik ureticisi yapildi`)
      fetchUsers()
    } catch (e) {
      console.error(e)
      flash('Durum güncellenemedi', 'error')
    }
  }

  async function toggleBooster(user) {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH', headers,
        body: JSON.stringify({ type: 'user', id: user.id, data: { isBooster: !user.isBooster } }),
      })
      const d = await res.json()
      if (!d.success) { flash(d.error || 'Hata oluştu', 'error'); return }
      flash(user.isBooster ? `${user.username} booster'likten cikarildi` : `${user.username} booster yapildi`)
      fetchUsers()
    } catch (e) {
      console.error(e)
      flash('Durum güncellenemedi', 'error')
    }
  }

  async function toggleAdmin(user) {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH', headers,
        body: JSON.stringify({ type: 'user', id: user.id, data: { isAdmin: !user.isAdmin } }),
      })
      const d = await res.json()
      if (!d.success) { flash(d.error || 'Hata oluştu', 'error'); setConfirmAdminId(null); return }
      flash(user.isAdmin ? `${user.username} admin yetkisi kaldirildi` : `${user.username} admin yapildi`)
      fetchUsers()
    } catch (e) {
      console.error(e)
      flash('İşlem başarısız', 'error')
    }
    setConfirmAdminId(null)
  }

  const filtered = useMemo(() => {
    let list = users
    if (filter === 'active') list = list.filter(u => u.isActive)
    else if (filter === 'inactive') list = list.filter(u => !u.isActive)
    else if (filter === 'boosters') list = list.filter(u => u.isBooster)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    return list
  }, [users, query, filter])

  if (loading) return <AdminSkeleton rows={8} />

  return (
    <div>
      {msg && (
        <div onClick={() => setMsg(null)} role={msg.type === 'error' ? 'alert' : 'status'} style={{
          background: msg.type === 'error' ? '#2a1a1a' : '#1a2a1a',
          border: `1px solid ${msg.type === 'error' ? '#4a2a2a' : '#2a4a2a'}`, borderRadius: '8px',
          padding: '10px 16px', color: msg.type === 'error' ? '#ff6666' : '#4caf50', fontSize: '13px', marginBottom: '16px', cursor: 'pointer',
        }}>{msg.text} ✕</div>
      )}

      {fetchError && (
        <div role="alert" style={{
          background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px',
          padding: '10px 16px', color: '#ff6666', fontSize: '13px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        }}>
          <span>{fetchError}</span>
          <button type="button" className="btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }} onClick={fetchUsers}>Tekrar Dene</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Kullanıcılar ({filtered.length})</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'active', label: 'Aktif' },
            { key: 'inactive', label: 'Pasif' },
            { key: 'boosters', label: 'Boosterlar' },
          ].map(f => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} style={{
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

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Kullanıcı adı veya email ara..."
        style={{
          width: '100%', maxWidth: '360px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '9px 14px', color: '#fff', fontSize: '13px',
          fontFamily: 'var(--font-inter)', outline: 'none', marginBottom: '16px',
        }}
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <p className="body-large">Kullanıcı bulunamadı.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['Kullanıcı', 'Email', 'Kayıt', 'Sipariş', 'Harcama', 'Durum', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600', fontFamily: 'var(--font-montserrat)', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: '13px', color: '#fff' }}>
                    {u.username}
                    {u.isAdmin && <span style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 6px', borderRadius: '20px', background: 'rgba(255,102,102,0.1)', border: '1px solid #ff6666', color: '#ff6666' }}>Admin</span>}
                    {u.isBooster && <span style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 6px', borderRadius: '20px', background: 'rgba(245,197,24,0.1)', border: '1px solid var(--gold)', color: 'var(--gold)' }}>Booster</span>}
                    {u.isContentCreator && <span style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 6px', borderRadius: '20px', background: 'rgba(147,51,234,0.1)', border: '1px solid var(--violet)', color: 'var(--violet)' }}>İçerik Üreticisi</span>}
                    {!u.emailVerified && !u.oauthProvider && <span style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 6px', borderRadius: '20px', background: '#2a2a1a', border: '1px solid #3a3a1a', color: '#ffcc44' }}>Doğrulanmadı</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', color: '#fff' }}>{u.orderCount}</td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--gold)', fontWeight: '600' }}>{money(u.totalSpent)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                      background: u.isActive ? '#1a2a1a' : '#2a1a1a',
                      border: `1px solid ${u.isActive ? '#2a4a2a' : '#4a2a2a'}`,
                      color: u.isActive ? '#4caf50' : '#ff6666',
                    }}>{u.isActive ? 'Aktif' : 'Pasif'}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button" aria-pressed={u.isActive}
                        onClick={() => toggleActive(u)}
                        style={{
                          background: 'transparent', border: `1px solid ${u.isActive ? '#4a2a2a' : 'var(--border)'}`,
                          borderRadius: '5px', padding: '4px 10px', fontSize: '11px',
                          color: u.isActive ? '#ff6666' : 'var(--text-muted)', cursor: 'pointer',
                        }}>
                        {u.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                      </button>
                      <button
                        type="button" aria-pressed={u.isContentCreator}
                        onClick={() => toggleContentCreator(u)}
                        style={{
                          background: 'transparent', border: `1px solid ${u.isContentCreator ? 'var(--violet)' : 'var(--border)'}`,
                          borderRadius: '5px', padding: '4px 10px', fontSize: '11px',
                          color: u.isContentCreator ? 'var(--violet)' : 'var(--text-muted)', cursor: 'pointer',
                        }}>
                        {u.isContentCreator ? 'Yazarlığı Kaldır' : 'Yazar Yap'}
                      </button>
                      <button
                        type="button" aria-pressed={u.isBooster}
                        onClick={() => toggleBooster(u)}
                        style={{
                          background: 'transparent', border: `1px solid ${u.isBooster ? 'var(--gold)' : 'var(--border)'}`,
                          borderRadius: '5px', padding: '4px 10px', fontSize: '11px',
                          color: u.isBooster ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
                        }}>
                        {u.isBooster ? 'Booster\'likten Çıkar' : 'Booster Yap'}
                      </button>
                      {viewerIsFounder && (
                        confirmAdminId === u.id ? (
                          <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#ff6666' }}>
                              {u.isAdmin ? 'Yetkiyi kaldır?' : 'Admin yap? Tam yetki verilecek.'}
                            </span>
                            <button type="button" onClick={() => toggleAdmin(u)} style={{
                              background: 'transparent', border: '1px solid #ff6666', borderRadius: '5px',
                              padding: '4px 10px', fontSize: '11px', color: '#ff6666', cursor: 'pointer',
                            }}>Evet</button>
                            <button type="button" onClick={() => setConfirmAdminId(null)} style={{
                              background: 'transparent', border: '1px solid var(--border)', borderRadius: '5px',
                              padding: '4px 10px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer',
                            }}>İptal</button>
                          </span>
                        ) : (
                          <button
                            type="button" aria-pressed={u.isAdmin}
                            onClick={() => setConfirmAdminId(u.id)}
                            style={{
                              background: 'transparent', border: `1px solid ${u.isAdmin ? '#ff6666' : 'var(--border)'}`,
                              borderRadius: '5px', padding: '4px 10px', fontSize: '11px',
                              color: u.isAdmin ? '#ff6666' : 'var(--text-muted)', cursor: 'pointer',
                            }}>
                            {u.isAdmin ? 'Admin Yetkisini Kaldır' : 'Admin Yap'}
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
