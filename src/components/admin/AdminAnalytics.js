'use client'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Legend } from 'recharts'
import Skeleton from 'react-loading-skeleton'

const PERIODS = [
  { key: '14d', label: 'Günlük', heading: 'Son 14 Gün' },
  { key: '12w', label: 'Haftalık', heading: 'Son 12 Hafta' },
  { key: '12m', label: 'Aylık', heading: 'Son 12 Ay' },
]

const DIMENSIONS = [
  { key: 'game', label: 'Oyun', trendField: 'trendByGame', breakdownField: 'gameBreakdown' },
  { key: 'service', label: 'Hizmet', trendField: 'trendByService', breakdownField: 'serviceBreakdown' },
]

// One color per stacked series — the last always maps to the "Diğer" catch-all
// the API appends after the top 5 keys, so this array must stay 6 long.
const SERIES_COLORS = ['#f5c518', '#9333ea', '#44aaff', '#4caf50', '#ff8a3d', '#6b6b6b']

function money(n) {
  return `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatBucketLabel(dateStr, period) {
  const d = new Date(dateStr)
  if (period === '12m') return d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
  if (period === '12w') return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' })
}

function StackedTooltip({ active, payload, label, period, topKeys }) {
  if (!active || !payload?.length) return null
  const d = new Date(label)
  const dateLabel = period === '12m'
    ? d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    : period === '12w'
      ? `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} haftası`
      : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
  const total = topKeys.reduce((sum, key) => sum + (payload.find(p => p.dataKey === key)?.value || 0), 0)
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>{dateLabel}</div>
      {payload.filter(p => p.value > 0).map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', color: p.color }}>
          <span>{p.dataKey}</span>
          <span style={{ fontWeight: '700' }}>{money(p.value)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', color: 'var(--gold)', fontWeight: '700', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
        <span>Toplam</span>
        <span>{money(total)}</span>
      </div>
    </div>
  )
}

function sortRows(rows, sort) {
  const list = [...rows]
  list.sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key]
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
    return sort.dir === 'asc' ? cmp : -cmp
  })
  return list
}

function toggleSort(sort, setSort, key, defaultDir = 'desc') {
  setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: defaultDir })
}

function SortableTh({ label, sortKey, sort, onSort, align = 'left' }) {
  const active = sort.key === sortKey
  return (
    <th onClick={() => onSort(sortKey)} style={{
      textAlign: align, padding: '8px 10px', color: active ? 'var(--gold)' : 'var(--text-dim)',
      fontSize: '11px', fontFamily: 'var(--font-montserrat)', fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    }}>
      {label}{active && (sort.dir === 'asc' ? ' ▲' : ' ▼')}
    </th>
  )
}

function formatRangeDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function DrillTooltip({ active, payload, label, period }) {
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

export default function AdminAnalytics({ secret }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('14d')
  const [dimension, setDimension] = useState('game')
  const [fetchError, setFetchError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [serviceSort, setServiceSort] = useState({ key: 'revenue', dir: 'desc' })
  const [boosterSort, setBoosterSort] = useState({ key: 'revenue', dir: 'desc' })

  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [appliedRange, setAppliedRange] = useState(null) // { start, end } once "Uygula" is clicked

  const [drill, setDrill] = useState(null) // { type: 'service'|'booster', id, label }
  const [drillData, setDrillData] = useState(null)
  const [drillLoading, setDrillLoading] = useState(false)
  const [drillError, setDrillError] = useState('')

  function selectPreset(key) {
    setPeriod(key)
    setShowCustomPicker(false)
  }

  function applyCustomRange() {
    if (!customStart || !customEnd) return
    setAppliedRange({ start: customStart, end: customEnd })
    setPeriod('custom')
    setShowCustomPicker(false)
  }

  useEffect(() => {
    const controller = new AbortController()

    async function fetchStats() {
      await Promise.resolve()
      if (controller.signal.aborted) return
      setLoading(true)
      setFetchError('')

      try {
        const params = new URLSearchParams({ type: 'stats', period })
        if (period === 'custom' && appliedRange) {
          params.set('startDate', appliedRange.start)
          params.set('endDate', appliedRange.end)
        }
        const res = await fetch(`/api/admin?${params}`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
          signal: controller.signal,
        })
        const data = await res.json()
        if (controller.signal.aborted) return
        if (data.success) setStats(data.data)
        else setFetchError(data.error || 'Veri yüklenemedi')
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(error)
          setFetchError('Veri yüklenemedi')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchStats()
    return () => controller.abort()
  }, [period, appliedRange, secret, retryToken])

  useEffect(() => {
    if (!drill) return
    const controller = new AbortController()

    async function fetchDrill() {
      await Promise.resolve()
      if (controller.signal.aborted) return
      setDrillData(null)
      setDrillLoading(true)
      setDrillError('')
      try {
        const params = new URLSearchParams({
          type: drill.type === 'service' ? 'serviceTrend' : 'boosterTrend',
          period,
        })
        params.set(drill.type === 'service' ? 'serviceId' : 'boosterId', drill.id)
        if (period === 'custom' && appliedRange) {
          params.set('startDate', appliedRange.start)
          params.set('endDate', appliedRange.end)
        }
        const res = await fetch(`/api/admin?${params}`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
          signal: controller.signal,
        })
        const data = await res.json()
        if (controller.signal.aborted) return
        if (data.success) setDrillData(data.data)
        else setDrillError(data.error || 'Veri yüklenemedi')
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(error)
          setDrillError('Veri yüklenemedi')
        }
      } finally {
        if (!controller.signal.aborted) setDrillLoading(false)
      }
    }

    fetchDrill()
    return () => controller.abort()
  }, [drill, period, appliedRange, secret])

  if (loading) return <AnalyticsSkeleton />
  if (!stats) {
    return (
      <div role="alert" style={{
        background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px',
        padding: '10px 16px', color: '#ff6666', fontSize: '13px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
      }}>
        <span>{fetchError || 'Veri yüklenemedi.'}</span>
        <button type="button" className="btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }} onClick={() => setRetryToken(t => t + 1)}>Tekrar Dene</button>
      </div>
    )
  }

  const activeDimension = DIMENSIONS.find(d => d.key === dimension)
  const trend = stats[activeDimension.trendField]
  const sortedServices = sortRows(stats.serviceBreakdown, serviceSort)
  const sortedBoosters = sortRows(stats.boosterBreakdown, boosterSort)
  const maxCategoryRevenue = Math.max(1, ...stats.categoryBreakdown.map(c => c.revenue))
  const heading = period === 'custom'
    ? `${formatRangeDate(stats.rangeStart)} – ${formatRangeDate(stats.rangeEnd)}`
    : PERIODS.find(p => p.key === period)?.heading
  const requestedSpanDays = appliedRange
    ? Math.round((new Date(appliedRange.end) - new Date(appliedRange.start)) / 86400000)
    : 0
  const wasClamped = period === 'custom' && requestedSpanDays > 92

  return (
    <div>
      <h2 className="h3" style={{ color: '#fff', marginBottom: '20px' }}>Analitik</h2>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', margin: 0 }}>
            {heading} — Satış Trendi ({activeDimension.label} Kırılımı)
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
              {DIMENSIONS.map(d => (
                <button key={d.key} type="button" aria-pressed={dimension === d.key} onClick={() => setDimension(d.key)} style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                  fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer', border: 'none',
                  background: dimension === d.key ? 'var(--violet)' : 'transparent',
                  color: dimension === d.key ? '#fff' : 'var(--text-muted)',
                }}>{d.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
              {PERIODS.map(p => (
                <button key={p.key} type="button" aria-pressed={period === p.key} onClick={() => selectPreset(p.key)} style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                  fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer', border: 'none',
                  background: period === p.key ? 'var(--gold)' : 'transparent',
                  color: period === p.key ? '#0a0a0a' : 'var(--text-muted)',
                }}>{p.label}</button>
              ))}
              <button type="button" aria-pressed={period === 'custom'} onClick={() => setShowCustomPicker(v => !v)} style={{
                padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer', border: 'none',
                background: period === 'custom' ? 'var(--gold)' : 'transparent',
                color: period === 'custom' ? '#0a0a0a' : 'var(--text-muted)',
              }}>Özel</button>
            </div>
          </div>
        </div>

        {showCustomPicker && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <label htmlFor="analytics-range-start" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Başlangıç</label>
              <input id="analytics-range-start" type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }} />
            </div>
            <div>
              <label htmlFor="analytics-range-end" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Bitiş</label>
              <input id="analytics-range-end" type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }} />
            </div>
            <button type="button" className="btn-primary" style={{ fontSize: '12px', padding: '7px 16px' }} disabled={!customStart || !customEnd} onClick={applyCustomRange}>
              Uygula
            </button>
          </div>
        )}
        {wasClamped && (
          <p role="status" style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '-6px', marginBottom: '14px' }}>
            92 günden uzun aralıklar 92 güne kısaltılır — gösterilen: {formatRangeDate(stats.rangeStart)} – {formatRangeDate(stats.rangeEnd)}
          </p>
        )}

        <div style={{ height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend.buckets} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-dim)', fontSize: 9 }}
                tickFormatter={d => formatBucketLabel(d, period)}
              />
              <Tooltip content={<StackedTooltip period={period} topKeys={trend.topKeys} />} cursor={{ fill: 'rgba(245,197,24,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-muted)' }} />
              {trend.topKeys.map((key, i) => (
                <Bar key={key} dataKey={key} stackId="a" fill={SERIES_COLORS[i] || SERIES_COLORS[SERIES_COLORS.length - 1]} radius={i === trend.topKeys.length - 1 ? [3, 3, 0, 0] : undefined} maxBarSize={28} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {drill && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', margin: 0 }}>
              Detay: {drill.label}
            </h3>
            <button type="button" onClick={() => setDrill(null)} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
              padding: '4px 10px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer',
            }}>× Kapat</button>
          </div>
          {drillLoading ? (
            <Skeleton height={140} borderRadius={8} />
          ) : drillError ? (
            <p role="alert" style={{ color: '#ff6666', fontSize: '13px' }}>{drillError}</p>
          ) : drillData && (
            <div style={{ height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drillData.buckets} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-dim)', fontSize: 9 }}
                    tickFormatter={d => formatBucketLabel(d, period)}
                  />
                  <Tooltip content={<DrillTooltip period={period} />} cursor={{ fill: 'rgba(245,197,24,0.08)' }} />
                  <Bar dataKey="revenue" fill="var(--gold)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', overflowX: 'auto' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', marginBottom: '14px' }}>
            En Çok Satan Hizmetler ({sortedServices.length})
          </h3>
          {sortedServices.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Henüz veri yok.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <SortableTh label="Hizmet" sortKey="name" sort={serviceSort} onSort={k => toggleSort(serviceSort, setServiceSort, k, 'asc')} />
                  <SortableTh label="Sipariş" sortKey="orders" sort={serviceSort} onSort={k => toggleSort(serviceSort, setServiceSort, k)} align="right" />
                  <SortableTh label="Gelir" sortKey="revenue" sort={serviceSort} onSort={k => toggleSort(serviceSort, setServiceSort, k)} align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedServices.map(s => (
                  <tr key={s.id} onClick={() => setDrill({ type: 'service', id: s.id, label: `${s.name} — ${s.gameName}` })}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '8px 10px', color: '#fff' }}>
                      {s.name}
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{s.gameName}</div>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>{s.orders}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--gold)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{money(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', overflowX: 'auto' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', marginBottom: '14px' }}>
            Booster Performansı ({sortedBoosters.length})
          </h3>
          {sortedBoosters.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Henüz booster yok.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <SortableTh label="Booster" sortKey="username" sort={boosterSort} onSort={k => toggleSort(boosterSort, setBoosterSort, k, 'asc')} />
                  <SortableTh label="Tamamlanan" sortKey="completedOrders" sort={boosterSort} onSort={k => toggleSort(boosterSort, setBoosterSort, k)} align="right" />
                  <SortableTh label="Puan" sortKey="rating" sort={boosterSort} onSort={k => toggleSort(boosterSort, setBoosterSort, k)} align="right" />
                  <SortableTh label="Gelir" sortKey="revenue" sort={boosterSort} onSort={k => toggleSort(boosterSort, setBoosterSort, k)} align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedBoosters.map(b => (
                  <tr key={b.id} onClick={() => setDrill({ type: 'booster', id: b.id, label: b.username })}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '8px 10px', color: '#fff' }}>
                      {b.username}
                      <span style={{
                        marginLeft: '6px', fontSize: '9px', padding: '1px 6px', borderRadius: '20px',
                        background: b.status === 'active' ? '#1a2a1a' : '#2a1a1a',
                        border: `1px solid ${b.status === 'active' ? '#2a4a2a' : '#4a2a2a'}`,
                        color: b.status === 'active' ? '#4caf50' : '#ff6666',
                      }}>{b.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>{b.completedOrders}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>{b.rating > 0 ? b.rating.toFixed(1) : '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--gold)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{money(b.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', marginBottom: '16px' }}>
          Kategori Bazında Dağılım
        </h3>
        {stats.categoryBreakdown.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Henüz veri yok.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.categoryBreakdown.map(c => (
              <div key={c.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{c.name}</span>
                  <span style={{ color: 'var(--violet)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{money(c.revenue)} · {c.orders} sipariş</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(c.revenue / maxCategoryRevenue) * 100}%`, height: '100%', background: 'var(--violet)', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div>
      <Skeleton height={26} width={140} style={{ marginBottom: 20 }} />
      <Skeleton height={300} borderRadius={12} style={{ marginBottom: '16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <Skeleton height={220} borderRadius={12} />
        <Skeleton height={220} borderRadius={12} />
      </div>
      <Skeleton height={180} borderRadius={12} />
    </div>
  )
}
