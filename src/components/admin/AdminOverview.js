'use client'
import { useState, useEffect } from 'react'

const STATUS_LABELS = {
  pending: 'Bekliyor',
  assigned: 'Atandı',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

const STATUS_COLORS = {
  pending: '#8888ff',
  assigned: '#ffcc44',
  in_progress: '#44aaff',
  completed: '#4caf50',
  cancelled: '#ff6666',
}

function money(n) {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AdminOverview({ secret }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=stats', { headers })
      const d = await res.json()
      if (d.success) setStats(d.data)
    } catch {}
    setLoading(false)
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
  if (!stats) return <p style={{ color: 'var(--text-muted)' }}>Veri yüklenemedi.</p>

  const totalStatusOrders = Object.values(stats.statusCounts).reduce((a, b) => a + b, 0)
  const maxGameRevenue = Math.max(1, ...stats.topGames.map(g => g.revenue))

  return (
    <div>
      <h2 className="h3" style={{ color: '#fff', marginBottom: '20px' }}>Genel Bakış</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard icon="💰" label="Toplam Gelir" value={money(stats.totalRevenue)} accent />
        <StatCard icon="📈" label="Son 30 Gün" value={money(stats.last30Revenue)} />
        <StatCard icon="📦" label="Toplam Sipariş" value={stats.totalOrders} />
        <StatCard icon="👥" label="Toplam Kullanıcı" value={stats.totalUsers} />
        <StatCard icon="🛠️" label="Booster" value={`${stats.activeBoosters} / ${stats.totalBoosters}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', marginBottom: '16px' }}>
            Sipariş Durumu Dağılımı
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const pct = totalStatusOrders > 0 ? Math.round((count / totalStatusOrders) * 100) : 0
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{STATUS_LABELS[status]}</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>{count}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: STATUS_COLORS[status], borderRadius: '3px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', marginBottom: '16px' }}>
            En Çok Gelir Getiren Oyunlar
          </h3>
          {stats.topGames.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Henüz tamamlanan sipariş yok.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.topGames.map(g => (
                <div key={g.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{g.name}</span>
                    <span style={{ color: 'var(--gold)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{money(g.revenue)}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(g.revenue / maxGameRevenue) * 100}%`, height: '100%', background: 'var(--gold)', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '16px',
    }}>
      <div style={{ fontSize: '20px', marginBottom: '8px' }}>{icon}</div>
      <div style={{
        fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-montserrat)',
        color: accent ? 'var(--gold)' : '#fff',
      }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{label}</div>
    </div>
  )
}
