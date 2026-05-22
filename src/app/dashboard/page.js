'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const STATUS_LABELS = {
  pending: 'Bekliyor',
  assigned: 'Atandı',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

const STATUS_COLORS = {
  pending:     { bg: '#1a1a2a', border: '#2a2a4a', color: '#8888ff' },
  assigned:    { bg: '#2a2a1a', border: '#3a3a1a', color: '#ffcc44' },
  in_progress: { bg: '#1a2a2a', border: '#2a4a4a', color: '#44aaff' },
  completed:   { bg: '#1a2a1a', border: '#2a4a2a', color: '#4caf50' },
  cancelled:   { bg: '#2a1a1a', border: '#4a2a2a', color: '#ff6666' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const uname = localStorage.getItem('username')
    if (!token) { router.push('/login'); return }
    setUsername(uname || '')
    fetchOrders(token)
  }, [])

  async function fetchOrders(token) {
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await res.json()
      if (d.success) setOrders(d.data)
    } catch {}
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    router.push('/')
  }

  return (
    <main>
      <Navbar />
      <div style={{ padding: '40px 32px', maxWidth: '900px', margin: '0 auto' }}>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '32px',
        }}>
          <div>
            <h1 className="h2" style={{ color: '#fff', marginBottom: '4px' }}>
              Hoş geldin, <span style={{ color: 'var(--gold)' }}>{username}</span>
            </h1>
            <p className="body-small" style={{ color: 'var(--text-muted)' }}>
              Siparişlerini buradan takip edebilirsin.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/games" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">+ Yeni Sipariş</button>
            </Link>
            <button className="btn-secondary" onClick={logout}>Çıkış</button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px', marginBottom: '32px',
        }}>
          {[
            { label: 'Toplam Sipariş', value: orders.length },
            { label: 'Aktif', value: orders.filter(o => o.status === 'in_progress').length },
            { label: 'Tamamlanan', value: orders.filter(o => o.status === 'completed').length },
            { label: 'Bekleyen', value: orders.filter(o => o.status === 'pending').length },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-montserrat)', color: 'var(--gold)' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <h2 className="h3" style={{ color: '#fff', marginBottom: '16px' }}>Siparişlerim</h2>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
        ) : orders.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '60px', textAlign: 'center',
          }}>
            <p className="body-large" style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Henüz sipariş vermediniz.
            </p>
            <Link href="/games" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">Hizmetlere Göz At</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map(order => {
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
                      {order.price?.toLocaleString('tr-TR')} ₺ · {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}