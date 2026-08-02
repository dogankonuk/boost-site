'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import { authFetch } from '@/lib/authFetch'

const TYPE_ICONS = {
  order_assigned: '🛠️',
  order_status: '📦',
  message: '💬',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await authFetch('/api/notifications')
      if (!res) return
      const d = await res.json()
      if (d.success) setNotifications(d.data)
    } catch {}
    setLoading(false)
  }

  async function markAllRead() {
    const res = await authFetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' }),
    })
    if (!res) return
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  async function handleClick(n) {
    if (!n.isRead) {
      const res = await authFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', id: n.id }),
      })
      if (!res) return
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))
    }
    if (n.link) router.push(n.link)
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 className="h2" style={{ color: '#fff' }}>Notifications</h1>
          {unreadCount > 0 && (
            <button className="btn-secondary" style={{ fontSize: '13px', padding: '7px 14px' }} onClick={markAllRead}>
              Mark All as Read
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : notifications.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '60px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>🔔</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>You don't have any notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.map(n => (
              <div key={n.id} onClick={() => handleClick(n)} style={{
                background: n.isRead ? 'var(--bg-card)' : 'rgba(245,197,24,0.05)',
                border: `1px solid ${n.isRead ? 'var(--border)' : 'rgba(245,197,24,0.3)'}`,
                borderRadius: '12px', padding: '14px 18px',
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                cursor: n.link ? 'pointer' : 'default',
                transition: 'border-color 0.15s',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                }}>{TYPE_ICONS[n.type] || '🔔'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>{n.title}</span>
                    {!n.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />}
                  </div>
                  {n.body && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{n.body}</div>}
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {new Date(n.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
      <Footer />
    </main>
  )
}
