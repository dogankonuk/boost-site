'use client'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts'

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

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>{new Date(label).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</div>
      <div style={{ color: 'var(--gold)', fontWeight: '700' }}>{money(payload[0].value)}</div>
    </div>
  )
}

export default function AdminOverview({ secret, onNavigate }) {
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
  const maxGameRevenue = Math.max(1, ...stats.gameBreakdown.map(g => g.revenue))
  const needsAttention = stats.pendingApplications + stats.openIssues + stats.unratedCompleted

  return (
    <div>
      <h2 className="h3" style={{ color: '#fff', marginBottom: '20px' }}>Genel Bakış</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <StatCard icon="💰" label="Toplam Gelir" value={money(stats.totalRevenue)} accent />
        <StatCard icon="📈" label="Son 30 Gün" value={money(stats.last30Revenue)} growth={stats.revenueGrowthPct} />
        <StatCard icon="📦" label="Toplam Sipariş" value={stats.totalOrders} />
        <StatCard icon="👥" label="Toplam Kullanıcı" value={stats.totalUsers} growth={stats.userGrowthPct} growthLabel="30g" />
        <StatCard icon="🛠️" label="Booster" value={`${stats.activeBoosters} / ${stats.totalBoosters}`} />
      </div>

      {needsAttention > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            İlgi Bekleyenler
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {stats.pendingApplications > 0 && (
              <AlertCard icon="📝" count={stats.pendingApplications} label="bekleyen başvuru" onClick={() => onNavigate?.('applications')} />
            )}
            {stats.openIssues > 0 && (
              <AlertCard icon="⚠️" count={stats.openIssues} label="açık sorun bildirimi" onClick={() => onNavigate?.('orders')} />
            )}
            {stats.unratedCompleted > 0 && (
              <AlertCard icon="⭐" count={stats.unratedCompleted} label="değerlendirilmemiş sipariş" onClick={() => onNavigate?.('orders')} />
            )}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', marginBottom: '16px' }}>
          Son 14 Gün — Gelir Trendi
        </h3>
        <div style={{ height: '130px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.revenueTrend} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-dim)', fontSize: 9 }}
                tickFormatter={d => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' })}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(245,197,24,0.08)' }} />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {stats.revenueTrend.map(d => (
                  <Cell key={d.date} fill={d.revenue > 0 ? 'var(--gold)' : 'var(--bg-elevated)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
          {stats.gameBreakdown.filter(g => g.revenue > 0).length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Henüz tamamlanan sipariş yok.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.gameBreakdown.slice(0, 5).map(g => (
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

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', marginBottom: '16px' }}>
          Oyun Bazında Dağılım ({stats.gameBreakdown.length} oyun)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Oyun', 'Toplam Sipariş', 'Aktif', 'Gelir'].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i === 0 ? 'left' : 'right', padding: '8px 10px',
                    color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'var(--font-montserrat)',
                    fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.gameBreakdown.map(g => (
                <tr key={g.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px', color: '#fff', fontWeight: '600' }}>{g.name}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-muted)' }}>{g.orders}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: g.activeOrders > 0 ? '#ffcc44' : 'var(--text-dim)' }}>{g.activeOrders}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: 'var(--gold)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{money(g.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent, growth, growthLabel }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>{icon}</div>
        {growth !== undefined && (
          <span style={{
            fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px',
            background: growth >= 0 ? 'rgba(76,175,80,0.12)' : 'rgba(255,102,102,0.12)',
            color: growth >= 0 ? '#4caf50' : '#ff6666',
          }}>
            {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}% {growthLabel || ''}
          </span>
        )}
      </div>
      <div style={{
        fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-montserrat)',
        color: accent ? 'var(--gold)' : '#fff',
      }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{label}</div>
    </div>
  )
}

function AlertCard({ icon, count, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: '#2a2a1a', border: '1px solid #3a3a1a', borderRadius: '10px',
      padding: '10px 16px', cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{ fontSize: '13px', color: '#ffcc44' }}>
        <strong style={{ fontFamily: 'var(--font-montserrat)' }}>{count}</strong> {label}
      </span>
    </button>
  )
}
