'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminOverview from '@/components/admin/AdminOverview'
import AdminGames from '@/components/admin/AdminGames'
import AdminOrders from '@/components/admin/AdminOrders'
import AdminBoosters from '@/components/admin/AdminBoosters'
import AdminUsers from '@/components/admin/AdminUsers'
import AdminBlog from '@/components/admin/AdminBlog'
import AdminApplications from '@/components/admin/AdminApplications'
import AdminPromotions from '@/components/admin/AdminPromotions'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [status, setStatus] = useState('loading') // loading | no-token | not-admin | ok
  const [token, setToken] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function verifyAdmin() {
      const stored = localStorage.getItem('token')
      if (!stored) {
        if (!cancelled) setStatus('no-token')
        return
      }

      try {
        const res = await fetch('/api/auth', {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored}` },
          body: JSON.stringify({ action: 'getProfile' }),
        })
        const data = await res.json()
        if (cancelled) return

        if (data.success && data.data?.isAdmin) {
          setToken(stored)
          setStatus('ok')
        } else {
          setStatus('not-admin')
        }
      } catch {
        if (!cancelled) setStatus('no-token')
      }
    }

    verifyAdmin()
    return () => { cancelled = true }
  }, [])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    router.push('/login')
  }

  if (status === 'loading') return null

  if (status === 'no-token' || status === 'not-admin') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '40px', width: '360px', textAlign: 'center',
        }}>
          <h2 className="h2" style={{ color: '#fff', marginBottom: '10px' }}>Admin Girişi</h2>
          <p className="body-small" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            {status === 'no-token'
              ? 'Bu paneli görüntülemek için yönetici yetkisi olan bir hesapla giriş yapman gerekiyor.'
              : 'Bu hesabın yönetici yetkisi yok.'}
          </p>
          {status === 'no-token' ? (
            <Link href="/login" className="btn-primary" style={{ width: '100%' }}>
              Giriş Yap
            </Link>
          ) : (
            <button className="btn-secondary" style={{ width: '100%' }} onClick={logout}>Çıkış Yap</button>
          )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/" className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🏠 Anasayfaya Git
            </Link>
            <button className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }} onClick={logout}>
              Çıkış
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', display: 'flex' }}>
          {[{ key: 'overview', label: 'Genel Bakış' }, { key: 'games', label: 'Oyunlar & Hizmetler' }, { key: 'orders', label: 'Siparişler' }, { key: 'boosters', label: 'Boosterlar' }, { key: 'users', label: 'Kullanıcılar' }, { key: 'blog', label: 'Blog' }, { key: 'applications', label: 'Başvurular' }, { key: 'promotions', label: 'Kupon & Kampanya' }].map(t => (
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
        {tab === 'overview' && <AdminOverview secret={token} onNavigate={setTab} />}
        {tab === 'games' && <AdminGames secret={token} />}
        {tab === 'orders' && <AdminOrders secret={token} />}
        {tab === 'boosters' && <AdminBoosters secret={token} />}
        {tab === 'users' && <AdminUsers secret={token} />}
        {tab === 'blog' && <AdminBlog secret={token} />}
        {tab === 'applications' && <AdminApplications secret={token} />}
        {tab === 'promotions' && <AdminPromotions secret={token} />}
      </div>
    </div>
  )
}
