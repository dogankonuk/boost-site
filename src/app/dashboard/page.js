'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useCurrency } from '@/context/CurrencyContext'
import { authFetch } from '@/lib/authFetch'
import MessageThread from '@/components/MessageThread'

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
  const [tab, setTab] = useState(searchParams.get('tab') === 'account' ? 'account' : 'orders')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const uname = localStorage.getItem('username')
    if (!token) { router.push('/login'); return }
    setUsername(uname || '')
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const res = await authFetch('/api/orders')
      if (!res) return
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

  function handleOrderRated(orderId, rating, review) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, rating, review } : o))
  }

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'in_progress' || o.status === 'assigned')
  const completedOrders = orders.filter(o => o.status === 'completed')
  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.price || 0), 0)

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '32px 48px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'flex-start' }}>

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
                fontSize: '20px', fontWeight: '800', color: 'var(--gold)',
                fontFamily: 'var(--font-montserrat)', flexShrink: 0,
              }}>
                {username[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: '700', fontSize: '15px', color: '#0a0a0a' }}>
                  {username}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.6)', marginTop: '2px' }}>
                  Member
                </div>
              </div>
            </div>

            {/* İstatistikler */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Total', value: orders.length },
                { label: 'Active', value: activeOrders.length },
                { label: 'Completed', value: completedOrders.length },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>{stat.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Harcama */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Spent</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
                  {format(totalSpent)}
                </span>
              </div>
            </div>

            {/* Menü */}
            <div style={{ padding: '8px' }}>
              {[
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

        {/* Sağ içerik */}
        <div>
          {tab === 'orders' && (
            <OrdersTab orders={orders} loading={loading} title="All Orders" onRated={handleOrderRated} username={username} />
          )}
          {tab === 'active' && (
            <OrdersTab orders={activeOrders} loading={loading} title="Active Orders" emptyText="No active orders." onRated={handleOrderRated} username={username} />
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

function OrdersTab({ orders, loading, title, emptyText, onRated, username }) {
  const { format } = useCurrency()
  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading...</p>

  return (
    <div>
      <h2 className="h3" style={{ color: '#fff', marginBottom: '20px' }}>{title}</h2>

      {orders.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '60px', textAlign: 'center',
        }}>
          <p className="body-large" style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            {emptyText || 'You have not placed any orders yet.'}
          </p>
          <Link href="/games" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">Browse Services</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {orders.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
            const details = order.details || {}
            const selection = details.selection || {}
            const options = order.service?.options

            return (
              <div key={order.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
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
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {order.service?.game?.name}
                      {options?.type === 'range' && ` · ${selection.from} → ${selection.to} ${options.unitName}`}
                      {options?.type === 'quantity' && ` · ${selection.quantity} ${options.unitName}`}
                      {options?.type === 'options' && ` · ${selection.choice}`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
                      {order.price !== undefined && order.price !== null ? format(order.price) : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US')}
                    </div>
                  </div>
                </div>

                {order.boosterId && (
                  <MessageThread orderId={order.id} currentUsername={username} />
                )}

                {order.status === 'completed' && (
                  <RatingWidget order={order} onRated={onRated} />
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

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading...</p>

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
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
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

      {/* Sekme butonları */}
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
              <ProfileField label="Username" value={username} disabled />
              <ProfileField label="Email" value={profile?.email || ''} disabled />
            </div>
            <ProfileField label="Display Name" value={form.displayName}
              onChange={v => setForm(f => ({ ...f, displayName: v }))}
              placeholder="Give a nickname" />
            <ProfileField label="Discord ID" value={form.discordId}
              onChange={v => setForm(f => ({ ...f, discordId: v }))}
              placeholder="e.g., username#1234" />
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
              placeholder="Name and surname to appear on the invoice" />
            <ProfileField label="Address" value={form.billingAddress}
              onChange={v => setForm(f => ({ ...f, billingAddress: v }))}
              placeholder="Street, building number..." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ProfileField label="City" value={form.billingCity}
                onChange={v => setForm(f => ({ ...f, billingCity: v }))}
                placeholder="London" />
              <ProfileField label="Postal Code" value={form.billingPostalCode}
                onChange={v => setForm(f => ({ ...f, billingPostalCode: v }))}
                placeholder="SW1A 1AA" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ProfileField label="Country" value={form.billingCountry}
                onChange={v => setForm(f => ({ ...f, billingCountry: v }))}
                placeholder="Turkey" />
              <ProfileField label="Phone" value={form.billingPhone}
                onChange={v => setForm(f => ({ ...f, billingPhone: v }))}
                placeholder="+90 555 000 00 00" />
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
              onChange={v => setPwForm(f => ({ ...f, currentPassword: v }))} />
            <ProfileField label="New Password" value={pwForm.newPassword} type="password"
              onChange={v => setPwForm(f => ({ ...f, newPassword: v }))} />
            <ProfileField label="Confirm New Password" value={pwForm.confirmPassword} type="password"
              onChange={v => setPwForm(f => ({ ...f, confirmPassword: v }))} />
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

function ProfileField({ label, value, onChange, type = 'text', placeholder, disabled }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
        {label}
      </label>
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} disabled={disabled}
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