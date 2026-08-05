'use client'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts'
import Skeleton from 'react-loading-skeleton'
import AnimatedNumber from '@/components/AnimatedNumber'

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

const PERIODS = [
  { key: '14d', label: 'Günlük', heading: 'Son 14 Gün' },
  { key: '12w', label: 'Haftalık', heading: 'Son 12 Hafta' },
  { key: '12m', label: 'Aylık', heading: 'Son 12 Ay' },
]

function formatBucketLabel(dateStr, period) {
  const d = new Date(dateStr)
  if (period === '12m') return d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
  if (period === '12w') return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' })
}

function RevenueTooltip({ active, payload, label, period }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const d = new Date(label)
  const dateLabel = period === '12m'
    ? d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    : period === '12w'
      ? `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} haftası`
      : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>{dateLabel}</div>
      <div style={{ color: 'var(--gold)', fontWeight: '700' }}>{money(payload[0].value)}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>{point.orders} sipariş</div>
    </div>
  )
}

export default function AdminOverview({ secret, onNavigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('14d')

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }

  useEffect(() => { fetchStats(period) }, [period])

  async function fetchStats(p) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin?type=stats&period=${p}`, { headers })
      const d = await res.json()
      if (d.success) setStats(d.data)
    } catch {}
    setLoading(false)
  }

  if (loading) return <OverviewSkeleton />
  if (!stats) return <p style={{ color: 'var(--text-muted)' }}>Veri yüklenemedi.</p>

  const totalStatusOrders = Object.values(stats.statusCounts).reduce((a, b) => a + b, 0)
  const maxGameRevenue = Math.max(1, ...stats.gameBreakdown.map(g => g.revenue))
  const needsAttention = stats.pendingApplications + stats.openIssues + stats.unratedCompleted

  return (
    <div>
      <h2 className="h3" style={{ color: '#fff', marginBottom: '20px' }}>Genel Bakış</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <StatCard icon="💰" label="Toplam Gelir" countTo={stats.totalRevenue} decimals={2} prefix="$" accent />
        <StatCard icon="📈" label="Son 30 Gün" countTo={stats.last30Revenue} decimals={2} prefix="$" growth={stats.revenueGrowthPct} />
        <StatCard icon="📦" label="Toplam Sipariş" countTo={stats.totalOrders} />
        <StatCard icon="👥" label="Toplam Kullanıcı" countTo={stats.totalUsers} growth={stats.userGrowthPct} growthLabel="30g" />
        <StatCard icon="🛠️" label="Booster" value={`${stats.activeBoosters} / ${stats.totalBoosters}`} />
        <StatCard icon="🏷️" label="Verilen İndirim (toplam)" countTo={stats.totalDiscountGiven} decimals={2} prefix="$" />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', margin: 0 }}>
            {PERIODS.find(p => p.key === period)?.heading} — Gelir Trendi
          </h3>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer', border: 'none',
                background: period === p.key ? 'var(--gold)' : 'transparent',
                color: period === p.key ? '#0a0a0a' : 'var(--text-muted)',
              }}>{p.label}</button>
            ))}
          </div>
        </div>
        <div style={{ height: '130px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.revenueTrend} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-dim)', fontSize: 9 }}
                tickFormatter={d => formatBucketLabel(d, period)}
              />
              <Tooltip content={<RevenueTooltip period={period} />} cursor={{ fill: 'rgba(245,197,24,0.08)' }} />
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

function OverviewSkeleton() {
  return (
    <div>
      <Skeleton height={26} width={160} style={{ marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={84} borderRadius={12} />
        ))}
      </div>
      <Skeleton height={200} borderRadius={12} style={{ marginBottom: '16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Skeleton height={180} borderRadius={12} />
        <Skeleton height={180} borderRadius={12} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent, growth, growthLabel, countTo, decimals = 0, prefix = '' }) {
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
        fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-montserrat)',
        color: accent ? 'var(--gold)' : '#fff',
      }}>
        {countTo !== undefined ? (
          <AnimatedNumber end={countTo} decimals={decimals} prefix={prefix} />
        ) : value}
      </div>
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
