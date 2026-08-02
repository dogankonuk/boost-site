'use client'
import { useState, useEffect, useMemo } from 'react'

function money(n) {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AdminUsers({ secret }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState('')

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=users', { headers })
      const d = await res.json()
      if (d.success) setUsers(d.data)
    } catch {}
    setLoading(false)
  }

  async function toggleActive(user) {
    await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'user', id: user.id, data: { isActive: !user.isActive } }),
    })
    setMsg(user.isActive ? `${user.username} pasifleştirildi` : `${user.username} aktifleştirildi`)
    fetchUsers()
    setTimeout(() => setMsg(''), 3000)
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

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>

  return (
    <div>
      {msg && (
        <div onClick={() => setMsg('')} style={{
          background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: '8px',
          padding: '10px 16px', color: '#4caf50', fontSize: '13px', marginBottom: '16px', cursor: 'pointer',
        }}>{msg} ✕</div>
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
                    {u.isBooster && <span style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 6px', borderRadius: '20px', background: 'rgba(245,197,24,0.1)', border: '1px solid var(--gold)', color: 'var(--gold)' }}>Booster</span>}
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
                    <button
                      onClick={() => toggleActive(u)}
                      style={{
                        background: 'transparent', border: `1px solid ${u.isActive ? '#4a2a2a' : 'var(--border)'}`,
                        borderRadius: '5px', padding: '4px 10px', fontSize: '11px',
                        color: u.isActive ? '#ff6666' : 'var(--text-muted)', cursor: 'pointer',
                      }}>
                      {u.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
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
