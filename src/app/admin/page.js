'use client'
import { useState, useEffect } from 'react'
import AdminOverview from '@/components/admin/AdminOverview'
import AdminGames from '@/components/admin/AdminGames'
import AdminOrders from '@/components/admin/AdminOrders'
import AdminBoosters from '@/components/admin/AdminBoosters'
import AdminUsers from '@/components/admin/AdminUsers'
import AdminBlog from '@/components/admin/AdminBlog'

const ADMIN_SECRET = 'boost-admin-2024'

export default function AdminPage() {
  const [tab, setTab] = useState('overview')
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('admin_auth')
    if (saved === ADMIN_SECRET) setAuth(true)
  }, [])

  function login() {
    if (password === ADMIN_SECRET) {
      localStorage.setItem('admin_auth', ADMIN_SECRET)
      setAuth(true)
      setError('')
    } else {
      setError('Şifre hatalı')
    }
  }

  if (!auth) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '40px', width: '360px',
        }}>
          <h2 className="h2" style={{ color: '#fff', marginBottom: '8px' }}>Admin Girişi</h2>
          <p className="body-small" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            ShadowBoosting yönetim paneli
          </p>
          <input type="password" placeholder="Şifre" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{
              width: '100%', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: '8px',
              padding: '10px 14px', color: '#fff', fontSize: '14px',
              fontFamily: 'var(--font-inter)', outline: 'none', marginBottom: '12px',
            }} />
          {error && <p style={{ color: '#ff4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
          <button className="btn-primary" style={{ width: '100%' }} onClick={login}>Giriş Yap</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: '700', fontSize: '15px', color: 'var(--gold)' }}>
            ShadowBoosting — Admin
          </div>
          <button className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}
            onClick={() => { localStorage.removeItem('admin_auth'); setAuth(false) }}>
            Çıkış
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', display: 'flex' }}>
          {[{ key: 'overview', label: 'Genel Bakış' }, { key: 'games', label: 'Oyunlar & Hizmetler' }, { key: 'orders', label: 'Siparişler' }, { key: 'boosters', label: 'Boosterlar' }, { key: 'users', label: 'Kullanıcılar' }, { key: 'blog', label: 'Blog' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '14px 20px', background: 'transparent', border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              color: tab === t.key ? 'var(--gold)' : 'var(--text-muted)',
              fontFamily: 'var(--font-montserrat)', fontWeight: '600', fontSize: '14px',
              cursor: 'pointer', transition: 'color 0.2s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 48px' }}>
        {tab === 'overview' && <AdminOverview secret={ADMIN_SECRET} />}
        {tab === 'games' && <AdminGames secret={ADMIN_SECRET} />}
        {tab === 'orders' && <AdminOrders secret={ADMIN_SECRET} />}
        {tab === 'boosters' && <AdminBoosters secret={ADMIN_SECRET} />}
        {tab === 'users' && <AdminUsers secret={ADMIN_SECRET} />}
        {tab === 'blog' && <AdminBlog secret={ADMIN_SECRET} />}
      </div>
    </div>
  )
}