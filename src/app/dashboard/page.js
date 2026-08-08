'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts'
import Skeleton from 'react-loading-skeleton'
import AnimatedNumber from '@/components/AnimatedNumber'
import AnimatedEmptyIcon from '@/components/AnimatedEmptyIcon'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useCurrency } from '@/context/CurrencyContext'
import { authFetch } from '@/lib/authFetch'
import MessageThread from '@/components/MessageThread'
import OrderTimeline from '@/components/OrderTimeline'
import { getLoyaltyTier, pointsFromSpend } from '@/lib/loyalty'
import { celebrate } from '@/lib/celebrate'
import { trackEvent } from '@/lib/analytics'

// Compares against the last-seen tier/referral count in localStorage so a
// reward toast + confetti only fires the moment a milestone is newly crossed.
function checkRewardMilestones(data) {
  if (typeof window === 'undefined' || !data) return
  const key = `milestones_${data.username || 'user'}`
  const prev = JSON.parse(localStorage.getItem(key) || '{}')
  const tierName = data.loyaltyTier?.name
  const referralCount = data.referralCount || 0

  if (prev.tierName && tierName && tierName !== prev.tierName) {
    celebrate()
    toast.success(`You've reached ${tierName} tier!`)
  }
  if (typeof prev.referralCount === 'number' && referralCount > prev.referralCount) {
    celebrate()
    toast.success('Referral bonus earned!')
  }

  localStorage.setItem(key, JSON.stringify({ tierName, referralCount }))
}

const STATUS_LABELS = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS = {
  pending:     { bg: '#1a1a2a', border: '#2a2a4a', color: '#8888ff' },
  assigned:    { bg: '#2a2a1a', border: '#3a3a1a', color: '#ffcc44' },
  in_progress: { bg: '#1a2a2a', border: '#2a4a4a', color: '#44aaff' },
  completed:   { bg: '#1a2a1a', border: '#2a4a2a', color: '#4caf50' },
  cancelled:   { bg: '#2a1a1a', border: '#4a2a2a', color: '#ff6666' },
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { format } = useCurrency()
  const [orders, setOrders] = useState([])
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState(
    ['account', 'orders', 'active'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview'
  )
  const highlightOrderId = parseInt(searchParams.get('orderId')) || null
  const [unreadMessageOrderIds, setUnreadMessageOrderIds] = useState(new Set())

  useEffect(() => {
    const token = localStorage.getItem('token')
    const uname = localStorage.getItem('username')
    if (!token) { router.push('/login'); return }
    setUsername(uname || '')
    fetchOrders()
    fetchProfile()
    fetchUnreadMessageOrders()
  }, [])

  async function fetchUnreadMessageOrders() {
    try {
      const res = await authFetch('/api/notifications')
      if (!res) return
      const d = await res.json()
      if (d.success) {
        const ids = d.data
          .filter(n => n.type === 'message' && !n.isRead)
          .map(n => parseInt(n.link?.match(/orderId=(\d+)/)?.[1]))
          .filter(Boolean)
        setUnreadMessageOrderIds(new Set(ids))
      }
    } catch {}
  }

  function clearUnreadMessages(orderId) {
    setUnreadMessageOrderIds(prev => {
      if (!prev.has(orderId)) return prev
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
  }

  async function fetchOrders() {
    try {
      const res = await authFetch('/api/orders')
      if (!res) return
      const d = await res.json()
      if (d.success) setOrders(d.data)
    } catch {}
    setLoading(false)
  }

  async function fetchProfile() {
    try {
      const res = await authFetch('/api/auth', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getProfile' }),
      })
      if (!res) return
      const d = await res.json()
      if (d.success) {
        checkRewardMilestones(d.data)
        setProfile(d.data)
      }
    } catch {}
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    router.push('/')
  }

  function handleOrderRated(orderId, rating, review) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, rating, review } : o))
  }

  function handleOrderCancelled(orderId) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
  }

  function handleIssueReported(orderId, message) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, issueReport: message, issueResolved: false } : o))
  }

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'in_progress' || o.status === 'assigned')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.price || 0), 0)
  const tier = profile?.loyaltyTier || getLoyaltyTier(pointsFromSpend(totalSpent))

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <div className="dashboard-grid" style={{ flex: 1 }}>

        {/* Sol sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '80px' }}>

          {/* Profil kartı */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            <div style={{
              background: 'var(--gold)', padding: '20px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#0a0a0a', border: '2px solid rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: '700', color: 'var(--gold)',
                fontFamily: 'var(--font-montserrat)', flexShrink: 0,
              }}>
                {username[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: '700', fontSize: '15px', color: '#0a0a0a' }}>
                  {username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(0,0,0,0.7)', marginTop: '2px', fontWeight: '700' }}>
                  <span>{tier.icon}</span>{tier.name} Member
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Total', value: orders.length },
                { label: 'Active', value: activeOrders.length },
                { label: 'Completed', value: completedOrders.length },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>{stat.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Points */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loyalty Points</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
                  {tier.points.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* Menu */}
            <div style={{ padding: '8px' }}>
              {[
                { key: 'overview', icon: '🏠', label: 'Overview' },
                { key: 'orders', icon: '📦', label: 'My Orders' },
                { key: 'active', icon: '⚡', label: 'Active Orders' },
                { key: 'account', icon: '⚙️', label: 'Account Settings' },
              ].map(item => (
                <button key={item.key} onClick={() => setTab(item.key)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: tab === item.key ? 'rgba(245,197,24,0.1)' : 'transparent',
                  border: tab === item.key ? '1px solid rgba(245,197,24,0.3)' : '1px solid transparent',
                  color: tab === item.key ? 'var(--gold)' : 'var(--text-muted)',
                  fontSize: '13px', fontFamily: 'var(--font-inter)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  marginBottom: '2px',
                }}>
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />
              <button onClick={logout} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                background: 'transparent', border: '1px solid transparent',
                color: '#ff6666', fontSize: '13px', fontFamily: 'var(--font-inter)',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,100,100,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </div>

          <Link href="/games" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ width: '100%', padding: '11px' }}>
              + New Order
            </button>
          </Link>
        </div>

        {/* Right content */}
        <div>
          {tab === 'overview' && (
            <OverviewTab username={username} orders={orders} loading={loading} onNavigate={setTab} tier={tier} profile={profile} />
          )}
          {tab === 'orders' && (
            <OrdersTab orders={orders} loading={loading} title="All Orders" onRated={handleOrderRated} onCancelled={handleOrderCancelled} onIssueReported={handleIssueReported} highlightOrderId={highlightOrderId} unreadMessageOrderIds={unreadMessageOrderIds} onMessagesSeen={clearUnreadMessages} />
          )}
          {tab === 'active' && (
            <OrdersTab orders={activeOrders} loading={loading} title="Active Orders" emptyText="No active orders." onRated={handleOrderRated} onCancelled={handleOrderCancelled} onIssueReported={handleIssueReported} highlightOrderId={highlightOrderId} unreadMessageOrderIds={unreadMessageOrderIds} onMessagesSeen={clearUnreadMessages} />
          )}
          {tab === 'account' && (
            <AccountTab username={username} orders={orders} onRated={handleOrderRated} />
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}

function buildMonthlySpend(orders) {
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }), total: 0 })
  }
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    const d = new Date(o.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const m = months.find(m => m.key === key)
    if (m) m.total += (o.price || 0)
  })
  return months
}

function DashboardSkeleton() {
  return (
    <div>
      <Skeleton height={80} borderRadius={14} style={{ marginBottom: 12 }} />
      <Skeleton height={80} borderRadius={14} style={{ marginBottom: 12 }} />
      <Skeleton height={80} borderRadius={14} style={{ marginBottom: 12 }} />
    </div>
  )
}

function PointsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: 'var(--gold)', fontWeight: '700' }}>{payload[0].value.toLocaleString('en-US')} pts</div>
    </div>
  )
}

function OverviewTab({ username, orders, loading, onNavigate, tier, profile }) {
  if (loading) return <DashboardSkeleton />

  const activeOrders = orders.filter(o => ['pending', 'assigned', 'in_progress'].includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'completed')
  const currentOrder = activeOrders[0]
  const monthlySpend = buildMonthlySpend(orders)
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  // Brand-new accounts have nothing to show in the usual stat grid/chart —
  // a wall of zeros between signup and the "browse games" CTA just adds
  // scrolling before the one action that matters. Skip straight to it.
  if (orders.length === 0) {
    return (
      <div>
        <h2 className="h3" style={{ color: '#fff', marginBottom: '4px' }}>
          Welcome, {profile?.displayName || username} 👋
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
          Let's get your first order started.
        </p>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '28px 24px', marginBottom: '20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎮</div>
          <h3 className="h4" style={{ color: '#fff', marginBottom: '8px' }}>Ready when you are</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 18px', lineHeight: '1.6' }}>
            Browse boosting services for your game and place your first order — a professional booster is typically ready within 15–30 minutes.
          </p>
          <Link href="/games" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '11px 28px' }}>Browse Games</button>
          </Link>
        </div>

        <ReferralCard profile={profile} hasCompletedOrder={false} />
      </div>
    )
  }

  return (
    <div>
      <h2 className="h3" style={{ color: '#fff', marginBottom: '4px' }}>
        Welcome back, {profile?.displayName || username}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
        Here's a quick look at your activity.
      </p>

      {(profile?.isBooster || profile?.isContentCreator) && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {profile?.isBooster && <PanelShortcut href="/booster" icon="🛠️" title="Booster Panel" subtitle="Manage your assigned orders" />}
          {profile?.isContentCreator && <PanelShortcut href="/creator" icon="✍️" title="Creator Dashboard" subtitle="Write and manage your blog posts" />}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        <OverviewStat icon="📦" label="Total Orders" countTo={orders.length} />
        <OverviewStat icon="⚡" label="Active" countTo={activeOrders.length} />
        <OverviewStat icon="✅" label="Completed" countTo={completedOrders.length} />
        <OverviewStat icon="🏆" label="Loyalty Points" countTo={tier.points} accent />
        <OverviewStat icon="🗓️" label="Member Since" value={memberSince} small />
      </div>

      <div style={{
        background: 'var(--bg-card)', border: `1px solid ${tier.color}55`,
        borderRadius: '16px', padding: '20px 24px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
          background: `${tier.color}1a`, border: `1px solid ${tier.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
        }}>{tier.icon}</div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: tier.color, fontFamily: 'var(--font-montserrat)' }}>
              {tier.name} Member
            </span>
            {tier.discount > 0 && (
              <span style={{
                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(76,175,80,0.12)', color: '#4caf50',
              }}>-{tier.discount}% on every order</span>
            )}
          </div>
          {tier.next ? (
            <>
              <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ width: `${tier.progress * 100}%`, height: '100%', background: tier.color, borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {tier.remaining.toLocaleString('en-US')} more points to reach <strong style={{ color: tier.next.color }}>{tier.next.icon} {tier.next.name}</strong> (-{tier.next.discount}% discount)
              </div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You've reached our highest tier — thank you!</div>
          )}
        </div>
      </div>

      <ReferralCard profile={profile} hasCompletedOrder={completedOrders.length > 0} />

      {currentOrder && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '20px 24px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <h3 className="h4" style={{ color: '#fff' }}>Continue Where You Left Off</h3>
            <button onClick={() => onNavigate('orders')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '12px', cursor: 'pointer' }}>
              View all orders →
            </button>
          </div>
          <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600', marginBottom: '10px' }}>
            {currentOrder.service?.game?.name} — {currentOrder.service?.name}
          </div>
          <OrderTimeline order={currentOrder} />
        </div>
      )}

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '20px 24px', marginBottom: '20px',
      }}>
        <h3 className="h4" style={{ color: '#fff', marginBottom: '16px' }}>Points Earned — Last 6 Months</h3>
        <div style={{ height: '140px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySpend.map(m => ({ label: m.label, points: pointsFromSpend(m.total) }))} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
              <Tooltip content={<PointsTooltip />} cursor={{ fill: 'rgba(245,197,24,0.08)' }} />
              <Bar dataKey="points" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {monthlySpend.map(m => (
                  <Cell key={m.key} fill={m.total > 0 ? 'var(--gold)' : 'var(--bg-elevated)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link href="/games" style={{ textDecoration: 'none', flex: 1, minWidth: '160px' }}>
          <button className="btn-primary" style={{ width: '100%', padding: '11px' }}>+ New Order</button>
        </Link>
        <button className="btn-secondary" style={{ flex: 1, minWidth: '160px', padding: '11px' }} onClick={() => onNavigate('orders')}>
          View All Orders
        </button>
        <button className="btn-secondary" style={{ flex: 1, minWidth: '160px', padding: '11px' }} onClick={() => onNavigate('account')}>
          Account Settings
        </button>
      </div>
    </div>
  )
}

function ReferralCard({ profile, hasCompletedOrder }) {
  const [copied, setCopied] = useState(false)
  if (!profile?.referralCode) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${origin}/login?ref=${profile.referralCode}`

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      toast.success('Referral link copied!')
      trackEvent('referral_link_copied', { referral_count: profile.referralCount || 0 })
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Ask for referrals after the customer has actually experienced the
  // service, not before — a brand-new account has nothing to vouch for yet.
  if (!hasCompletedOrder) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '20px 24px', marginBottom: '20px',
      }}>
        <h3 className="h4" style={{ color: '#fff', marginBottom: '6px' }}>🎁 Invite Friends, Earn Points</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Your referral link unlocks after your first order is delivered — come back then to start earning points for every friend you bring in.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '20px 24px', marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 className="h4" style={{ color: '#fff' }}>🎁 Invite Friends, Earn Points</h3>
        {profile.referralCount > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--gold)' }}>{profile.referralCount}</strong> friend{profile.referralCount !== 1 ? 's' : ''} joined
          </span>
        )}
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.6' }}>
        Share your link — when a friend signs up and completes their first order, you get <strong style={{ color: '#fff' }}>+100 points</strong> and they get <strong style={{ color: '#fff' }}>+50 points</strong>.
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input readOnly value={link} onClick={e => e.target.select()}
          style={{
            flex: 1, minWidth: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '10px 14px', color: 'var(--text-muted)', fontSize: '12px', outline: 'none',
          }} />
        <button className="btn-primary" onClick={copyLink} style={{ padding: '10px 18px', fontSize: '13px', flexShrink: 0 }}>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}

function PanelShortcut({ href, icon, title, subtitle }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', flex: '1 1 220px', minWidth: '220px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '14px 18px', cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <span style={{ fontSize: '22px', flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>{title}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>{subtitle}</div>
        </div>
        <span style={{ color: 'var(--gold)', fontSize: '16px', flexShrink: 0 }}>→</span>
      </div>
    </Link>
  )
}

function OverviewStat({ icon, label, value, accent, small, countTo }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '14px 16px',
    }}>
      <div style={{ fontSize: '16px', marginBottom: '6px' }}>{icon}</div>
      <div style={{
        fontSize: small ? '13px' : '18px', fontWeight: '700', color: accent ? 'var(--gold)' : '#fff',
        fontFamily: 'var(--font-montserrat)', lineHeight: 1.2,
      }}>
        {countTo !== undefined ? <AnimatedNumber end={countTo} /> : value}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{label}</div>
    </div>
  )
}

function OrdersTab({ orders, loading, title, emptyText, onRated, onCancelled, onIssueReported, highlightOrderId, unreadMessageOrderIds, onMessagesSeen }) {
  const { format } = useCurrency()
  const [listRef] = useAutoAnimate()
  const [activeHighlight, setActiveHighlight] = useState(highlightOrderId || null)
  const scrolledRef = useRef(false)

  useEffect(() => {
    if (!highlightOrderId || loading || scrolledRef.current) return
    const el = document.getElementById(`order-${highlightOrderId}`)
    if (!el) return
    scrolledRef.current = true
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = setTimeout(() => setActiveHighlight(null), 2500)
    return () => clearTimeout(timer)
  }, [highlightOrderId, loading, orders])

  if (loading) return <DashboardSkeleton />

  return (
    <div>
      <h2 className="h3" style={{ color: '#fff', marginBottom: '20px' }}>{title}</h2>

      {orders.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '60px', textAlign: 'center',
        }}>
          <AnimatedEmptyIcon icon="📦" />
          <p className="body-large" style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            {emptyText || 'You have not placed any orders yet.'}
          </p>
          <Link href="/games" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">Browse Services</button>
          </Link>
        </div>
      ) : (
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {orders.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
            const details = order.details || {}
            const selection = details.selection || {}
            const options = order.service?.options
            const hasNewMessage = unreadMessageOrderIds?.has(order.id)
            const isHighlighted = activeHighlight === order.id || hasNewMessage

            return (
              <div key={order.id} id={`order-${order.id}`} style={{
                background: 'var(--bg-card)',
                border: isHighlighted ? '1px solid var(--gold)' : '1px solid var(--border)',
                boxShadow: isHighlighted ? '0 0 0 3px rgba(245,197,24,0.25)' : 'none',
                transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
                borderRadius: '12px', padding: '16px 20px',
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {order.service?.game?.coverImage ? (
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
                      backgroundImage: `url(${order.service.game.coverImage})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      border: '1px solid var(--border)',
                    }} />
                  ) : (
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '10px',
                      background: 'var(--bg-elevated)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', border: '1px solid var(--border)',
                    }}>🎮</div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>
                        {order.service?.name}
                      </span>
                      <span style={{
                        fontSize: '10px', padding: '2px 7px', borderRadius: '20px',
                        background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
                      }}>{STATUS_LABELS[order.status]}</span>
                      {hasNewMessage && (
                        <span style={{
                          fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                          background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.4)',
                          color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold)' }} />
                          New message
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {order.service?.game?.name}
                      {options?.type === 'range' && ` · ${selection.from} → ${selection.to} ${options.unitName}`}
                      {options?.type === 'quantity' && ` · ${selection.quantity} ${options.unitName}`}
                      {options?.type === 'options' && ` · ${selection.choice}`}
                      {details.selectedAddons && Object.values(details.selectedAddons).map((g, i) => (
                        <span key={i}> · {g.values.map(v => v.label).join(', ')}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
                      {order.price !== undefined && order.price !== null ? format(order.price) : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US')}
                    </div>
                  </div>
                </div>

                <OrderTimeline order={order} />

                {!['completed', 'cancelled'].includes(order.status) && (
                  <MessageThread orderId={order.id} onOpen={() => onMessagesSeen?.(order.id)} />
                )}

                {order.status === 'completed' && (
                  <RatingWidget order={order} onRated={onRated} />
                )}

                {order.status !== 'cancelled' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      {['pending', 'assigned'].includes(order.status) && (
                        <CancelOrderButton order={order} onCancelled={onCancelled} />
                      )}
                    </div>
                    <ReportIssueButton order={order} onReported={onIssueReported} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AccountTab({ username, orders, onRated }) {
  const { format } = useCurrency()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [activeSection, setActiveSection] = useState('profile')

  const [form, setForm] = useState({
    displayName: '', discordId: '',
    billingName: '', billingAddress: '', billingCity: '',
    billingCountry: '', billingPhone: '', billingPostalCode: '',
  })

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem('token')
      if (!token) { setLoading(false); return }
      const res = await authFetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getProfile' }),
      })
      if (!res) return
      const d = await res.json()
      if (d.success) {
        setProfile(d.data)
        setForm({
          displayName: d.data.displayName || '',
          discordId: d.data.discordId || '',
          billingName: d.data.billingName || '',
          billingAddress: d.data.billingAddress || '',
          billingCity: d.data.billingCity || '',
          billingCountry: d.data.billingCountry || '',
          billingPhone: d.data.billingPhone || '',
          billingPostalCode: d.data.billingPostalCode || '',
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  async function saveProfile() {
    setSaving(true)
    const res = await authFetch('/api/auth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateProfile', ...form }),
    })
    if (!res) return
    const d = await res.json()
    if (d.success) setMsg({ text: 'Profile updated!', type: 'success' })
    else setMsg({ text: d.error || 'An error occurred', type: 'error' })
    setSaving(false)
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  async function changePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setMsg({ text: 'New passwords do not match', type: 'error' }); return
    }
    if (pwForm.newPassword.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters long', type: 'error' }); return
    }
    setSaving(true)
    const res = await authFetch('/api/auth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'changePassword', currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    if (!res) return
    const d = await res.json()
    if (d.success) { setMsg({ text: 'Password updated!', type: 'success' }); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) }
    else setMsg({ text: d.error || 'An error occurred', type: 'error' })
    setSaving(false)
    setTimeout(() => setMsg({ text: '', type: '' }), 3000)
  }

  async function resendVerification() {
    setResending(true)
    setResendMsg('')
    const res = await authFetch('/api/auth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resendVerification' }),
    })
    if (!res) return
    const d = await res.json()
    setResendMsg(d.success ? 'Verification email sent!' : (d.error || 'An error occurred'))
    setResending(false)
  }

  if (loading) return <DashboardSkeleton />

  const completedOrders = (orders || []).filter(o => o.status === 'completed')
  const unratedCount = completedOrders.filter(o => !o.rating).length
  const sortedCompleted = [...completedOrders].sort((a, b) => {
    if (!a.rating && b.rating) return -1
    if (a.rating && !b.rating) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div>
      <h2 className="h3" style={{ color: '#fff', marginBottom: '20px' }}>Account Settings</h2>

      {completedOrders.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '20px 24px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h3 className="h4" style={{ color: '#fff' }}>Your Completed Orders</h3>
            {unratedCount > 0 && (
              <span style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '700',
                background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.3)', color: 'var(--gold)',
              }}>{unratedCount} awaiting review</span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Rate your experience to help other customers and our boosters.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedCompleted.map(order => (
              <div key={order.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>
                      {order.service?.game?.name} — {order.service?.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US')}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
                    {format(order.price)}
                  </div>
                </div>
                <RatingWidget order={order} onRated={onRated} />
              </div>
            ))}
          </div>
        </div>
      )}

      {profile && !profile.emailVerified && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
          background: '#2a2a1a', border: '1px solid #3a3a1a', color: '#ffcc44',
        }}>
          <span>Please verify your email address to secure your account.{resendMsg && ` ${resendMsg}`}</span>
          <button onClick={resendVerification} disabled={resending} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', flexShrink: 0 }}>
            {resending ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      )}

      {msg.text && (
        <div style={{
          padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
          background: msg.type === 'success' ? '#1a2a1a' : '#2a1a1a',
          border: `1px solid ${msg.type === 'success' ? '#2a4a2a' : '#4a2a2a'}`,
          color: msg.type === 'success' ? '#4caf50' : '#ff6666',
        }}>{msg.text}</div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ key: 'profile', label: 'Profile' }, { key: 'billing', label: 'Billing' }, { key: 'password', label: 'Password' }].map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
            fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer',
            border: '1px solid',
            background: activeSection === s.key ? 'var(--gold)' : 'transparent',
            color: activeSection === s.key ? '#0a0a0a' : 'var(--text-muted)',
            borderColor: activeSection === s.key ? 'var(--gold)' : 'var(--border)',
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>

        {activeSection === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ProfileField label="Username" value={username} disabled autoComplete="username" />
              <ProfileField label="Email" value={profile?.email || ''} disabled autoComplete="email" />
            </div>
            <ProfileField label="Display Name" value={form.displayName}
              onChange={v => setForm(f => ({ ...f, displayName: v }))}
              placeholder="Give a nickname" autoComplete="nickname" />
            <ProfileField label="Discord ID" value={form.discordId}
              onChange={v => setForm(f => ({ ...f, discordId: v }))}
              placeholder="e.g., username#1234" autoComplete="off" />
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Contact support to change your email address.
            </div>
            <button className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
              onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {activeSection === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ProfileField label="Name & Surname" value={form.billingName}
              onChange={v => setForm(f => ({ ...f, billingName: v }))}
              placeholder="Name and surname to appear on the invoice" autoComplete="name" />
            <ProfileField label="Address" value={form.billingAddress}
              onChange={v => setForm(f => ({ ...f, billingAddress: v }))}
              placeholder="Street, building number..." autoComplete="street-address" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ProfileField label="City" value={form.billingCity}
                onChange={v => setForm(f => ({ ...f, billingCity: v }))}
                placeholder="London" autoComplete="address-level2" />
              <ProfileField label="Postal Code" value={form.billingPostalCode}
                onChange={v => setForm(f => ({ ...f, billingPostalCode: v }))}
                placeholder="SW1A 1AA" autoComplete="postal-code" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ProfileField label="Country" value={form.billingCountry}
                onChange={v => setForm(f => ({ ...f, billingCountry: v }))}
                placeholder="United Kingdom" autoComplete="country-name" />
              <ProfileField label="Phone" value={form.billingPhone}
                onChange={v => setForm(f => ({ ...f, billingPhone: v }))}
                placeholder="+1 555 000 0000" autoComplete="tel" />
            </div>
            <button className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
              onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {activeSection === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
            <ProfileField label="Current Password" value={pwForm.currentPassword} type="password"
              onChange={v => setPwForm(f => ({ ...f, currentPassword: v }))} autoComplete="current-password" />
            <ProfileField label="New Password" value={pwForm.newPassword} type="password"
              onChange={v => setPwForm(f => ({ ...f, newPassword: v }))} autoComplete="new-password" />
            <ProfileField label="Confirm New Password" value={pwForm.confirmPassword} type="password"
              onChange={v => setPwForm(f => ({ ...f, confirmPassword: v }))} autoComplete="new-password" />
            <button className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
              onClick={changePassword} disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileField({ label, value, onChange, type = 'text', placeholder, disabled, autoComplete }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
        {label}
      </label>
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} disabled={disabled} autoComplete={autoComplete}
        style={{
          width: '100%', background: disabled ? 'var(--bg)' : 'var(--bg-elevated)',
          border: '1px solid var(--border)', borderRadius: '8px',
          padding: '10px 14px', color: disabled ? 'var(--text-muted)' : '#fff',
          fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none',
          cursor: disabled ? 'not-allowed' : 'text',
        }} />
    </div>
  )
}

function ReportIssueButton({ order, onReported }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (order.issueReport && !order.issueResolved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', width: '100%' }}>
        ⚠️ Issue reported — our team will follow up with you.
      </div>
    )
  }

  async function submit() {
    const text = message.trim()
    if (!text) return
    setSubmitting(true)
    try {
      const res = await authFetch('/api/orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action: 'reportIssue', message: text }),
      })
      if (res) {
        const d = await res.json()
        if (d.success) {
          onReported(order.id, text)
          setOpen(false)
          setMessage('')
        }
      }
    } catch {}
    setSubmitting(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Having a problem with this order?"
        aria-label="Report a problem with this order"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '26px', height: '26px', borderRadius: '50%',
          background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer',
          color: 'var(--text-dim)', fontSize: '12px', padding: 0, flexShrink: 0,
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ffcc44'; e.currentTarget.style.borderColor = '#ffcc44' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        ⚠️
      </button>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Tell us what's wrong and we'll help sort it out..."
        rows={2}
        style={{
          width: '100%', background: 'var(--bg-elevated)', border: '1px solid #3a3a1a',
          borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px',
          fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical', marginBottom: '8px',
        }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-primary" onClick={submit} disabled={submitting || !message.trim()} style={{ fontSize: '12px', padding: '7px 16px' }}>
          {submitting ? 'Sending...' : 'Submit'}
        </button>
        <button onClick={() => { setOpen(false); setMessage('') }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '12px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function CancelOrderButton({ order, onCancelled }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function cancel() {
    setLoading(true)
    try {
      const res = await authFetch('/api/orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, action: 'cancel' }),
      })
      if (res) {
        const d = await res.json()
        if (d.success) onCancelled(order.id)
      }
    } catch {}
    setLoading(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cancel this order?</span>
        <button onClick={cancel} disabled={loading} style={{ fontSize: '12px', color: '#ff6666', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
          {loading ? '...' : 'Yes, cancel it'}
        </button>
        <button onClick={() => setConfirming(false)} style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Never mind
        </button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setConfirming(true)} style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Cancel order
      </button>
    </div>
  )
}

function RatingWidget({ order, onRated }) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (order.rating) {
    return (
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Your rating:</span>
        <span style={{ color: 'var(--gold)', fontSize: '14px', letterSpacing: '1px' }}>
          {'★'.repeat(order.rating)}{'☆'.repeat(5 - order.rating)}
        </span>
        {order.review && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{order.review}"</span>
        )}
      </div>
    )
  }

  if (dismissed) return null

  async function submit() {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await authFetch('/api/orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, rating: selected, review: review.trim() }),
      })
      if (res) {
        const d = await res.json()
        if (d.success) onRated(order.id, selected, review.trim())
      }
    } catch {}
    setSubmitting(false)
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rate this order:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button"
                onClick={() => setSelected(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '19px',
                  padding: '0 1px', lineHeight: 1,
                  color: (hovered || selected) >= n ? 'var(--gold)' : 'var(--border-hover)',
                  transition: 'color 0.1s',
                }}
              >★</button>
            ))}
          </div>
          <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '11px', cursor: 'pointer' }}>
            Not now
          </button>
        </div>
      </div>

      {selected > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
          <input value={review} onChange={e => setReview(e.target.value)}
            placeholder="Optional feedback..."
            style={{
              flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none',
            }} />
          <button className="btn-primary" onClick={submit} disabled={submitting} style={{ fontSize: '12px', padding: '8px 16px', flexShrink: 0 }}>
            {submitting ? '...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  )
}