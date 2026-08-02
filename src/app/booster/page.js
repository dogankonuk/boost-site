'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import { useCurrency } from '@/context/CurrencyContext'
import { authFetch } from '@/lib/authFetch'

const STATUS_LABELS = {
  pending: 'Bekliyor',
  assigned: 'Sana atandı',
  in_progress: 'Devam ediyor',
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

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'şimdi'
  if (mins < 60) return `${mins}dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}sa önce`
  const days = Math.floor(hours / 24)
  return `${days}g önce`
}

export default function BoosterPage() {
  const router = useRouter()
  const { format } = useCurrency()
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [booster, setBooster] = useState(undefined) // undefined = loading, null = confirmed not a booster
  const [fetchError, setFetchError] = useState(null)
  const [tab, setTab] = useState('pool')
  const [pool, setPool] = useState([])
  const [mine, setMine] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [claimingId, setClaimingId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [msg, setMsg] = useState('')
  const [poolSearch, setPoolSearch] = useState('')
  const [discordId, setDiscordId] = useState('')
  const [savingDiscord, setSavingDiscord] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchMe()
    setCheckedAuth(true)
  }, [])

  async function fetchMe() {
    setFetchError(null)
    try {
      const res = await authFetch('/api/booster?type=me')
      if (!res) return
      const d = await res.json()
      if (d.success) {
        setBooster(d.data) // data is null here only when the account genuinely has no booster row
        if (d.data) setDiscordId(d.data.discordId || '')
      } else {
        setFetchError(d.error || `Sunucu hatası (${res.status})`)
        setBooster(null)
      }
    } catch {
      setFetchError('Sunucuya bağlanılamadı. İnternet bağlantını veya sunucunun çalıştığını kontrol et.')
      setBooster(null)
    }
  }

  async function saveDiscordId() {
    setSavingDiscord(true)
    try {
      const res = await authFetch('/api/booster', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: discordId.trim() }),
      })
      if (!res) return
      const d = await res.json()
      if (d.success) {
        setBooster(b => ({ ...b, discordId: discordId.trim() }))
        setMsg('Discord ID kaydedildi')
        setTimeout(() => setMsg(''), 3000)
      }
    } catch {}
    setSavingDiscord(false)
  }

  useEffect(() => {
    if (booster && booster.status === 'active') {
      fetchPool()
      fetchMine()
    }
  }, [booster])

  async function fetchPool() {
    setLoadingOrders(true)
    try {
      const res = await authFetch('/api/booster?type=pool')
      if (!res) return
      const d = await res.json()
      if (d.success) setPool(d.data)
    } catch {}
    setLoadingOrders(false)
  }

  async function fetchMine() {
    try {
      const res = await authFetch('/api/booster?type=mine')
      if (!res) return
      const d = await res.json()
      if (d.success) setMine(d.data)
    } catch {}
  }

  async function claimOrder(orderId) {
    setClaimingId(orderId)
    try {
      const res = await authFetch('/api/booster', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      if (!res) return
      const d = await res.json()
      if (d.success) {
        setMsg('Sipariş sana atandı')
        fetchPool(); fetchMine()
        setTab('mine')
      } else {
        setMsg(d.error || 'Bu sipariş artık müsait değil')
        fetchPool()
      }
    } catch { setMsg('Bağlantı hatası') }
    setClaimingId(null)
    setConfirmingId(null)
    setTimeout(() => setMsg(''), 3000)
  }

  async function updateStatus(orderId, status) {
    setUpdatingId(orderId)
    try {
      const res = await authFetch('/api/booster', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      if (!res) return
      const d = await res.json()
      if (d.success) fetchMine()
    } catch {}
    setUpdatingId(null)
  }

  const filteredPool = useMemo(() => {
    const q = poolSearch.trim().toLowerCase()
    if (!q) return pool
    return pool.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.user?.username?.toLowerCase().includes(q) ||
      o.service?.name?.toLowerCase().includes(q) ||
      o.service?.game?.name?.toLowerCase().includes(q)
    )
  }, [pool, poolSearch])

  if (!checkedAuth || booster === undefined) {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Container style={{ paddingTop: '60px', paddingBottom: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
        </Container>
        <Footer />
      </main>
    )
  }

  if (!booster) {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Container style={{ paddingTop: '60px', paddingBottom: '80px' }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '60px', textAlign: 'center', maxWidth: '480px', margin: '0 auto',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>{fetchError ? '⚠️' : '🛠️'}</div>
            <h2 className="h3" style={{ color: '#fff', marginBottom: '10px' }}>
              {fetchError ? 'Bir Şeyler Ters Gitti' : 'Booster Hesabın Yok'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: fetchError ? '20px' : 0 }}>
              {fetchError || 'Bu hesap booster olarak kayıtlı değil. Booster olmak istiyorsan bir yöneticiyle iletişime geç.'}
            </p>
            {fetchError && (
              <button className="btn-primary" onClick={() => { setBooster(undefined); fetchMe() }}>
                Tekrar Dene
              </button>
            )}
          </div>
        </Container>
        <Footer />
      </main>
    )
  }

  if (booster.status !== 'active') {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Container style={{ paddingTop: '60px', paddingBottom: '80px' }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '60px', textAlign: 'center', maxWidth: '480px', margin: '0 auto',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>⏸️</div>
            <h2 className="h3" style={{ color: '#fff', marginBottom: '10px' }}>Hesabın Pasif</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              Booster hesabın şu an pasif durumda. Bir yöneticiyle iletişime geç.
            </p>
          </div>
        </Container>
        <Footer />
      </main>
    )
  }

  const activeMine = mine.filter(o => ['assigned', 'in_progress'].includes(o.status))
  const completedMine = mine.filter(o => o.status === 'completed')

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container style={{ paddingTop: '32px', paddingBottom: '60px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '20px', marginBottom: '24px',
        }}>
          <div>
            <h1 className="h2" style={{ color: '#fff' }}>Booster Paneli</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Sana atanan ve müsait siparişleri buradan yönet.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <StatCard icon="⚡" label="Aktif Sipariş" value={activeMine.length} />
            <StatCard icon="✅" label="Tamamlanan" value={booster.completedCount || 0} />
            <StatCard icon="⭐" label="Puan" value={booster.rating > 0 ? booster.rating.toFixed(1) : '—'} accent />
          </div>
        </div>

        {!discordId && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px',
            background: '#2a2a1a', border: '1px solid #3a3a1a', color: '#ffcc44',
          }}>
            <span>💬 Discord ID'ni ekle, sana bir sipariş atandığında anında mention al.</span>
            <button onClick={() => setTab('profile')} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', flexShrink: 0 }}>
              Şimdi Ekle
            </button>
          </div>
        )}

        {msg && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '10px 16px', color: 'var(--gold)', fontSize: '13px', marginBottom: '16px',
          }}>{msg}</div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { key: 'pool', icon: '📥', label: `Müsait Siparişler (${pool.length})` },
            { key: 'mine', icon: '📦', label: `Benim Siparişlerim (${mine.length})` },
            { key: 'profile', icon: '⚙️', label: 'Profil' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px', borderRadius: '20px', fontSize: '13px',
              fontFamily: 'var(--font-montserrat)', fontWeight: '600',
              cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
              background: tab === t.key ? 'var(--gold)' : 'transparent',
              color: tab === t.key ? '#0a0a0a' : 'var(--text-muted)',
              borderColor: tab === t.key ? 'var(--gold)' : 'var(--border)',
            }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab === 'pool' && (
          <div>
            {pool.length > 0 && (
              <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '360px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', opacity: 0.5 }}>🔍</span>
                <input
                  value={poolSearch}
                  onChange={e => setPoolSearch(e.target.value)}
                  placeholder="Oyun, hizmet, sipariş no veya müşteri ara..."
                  style={{
                    width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '10px 14px 10px 36px', color: '#fff',
                    fontSize: '13px', outline: 'none',
                  }}
                />
              </div>
            )}

            {loadingOrders ? (
              <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
            ) : pool.length === 0 ? (
              <EmptyState icon="📭" text="Şu an müsait sipariş yok. Yeni siparişler geldiğinde burada görünecek." />
            ) : filteredPool.length === 0 ? (
              <EmptyState icon="🔍" text="Aramanla eşleşen bir sipariş bulunamadı." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredPool.map(order => (
                  <OrderCard key={order.id} order={order} format={format}>
                    {confirmingId === order.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-primary" style={{ fontSize: '12px', padding: '8px 14px' }}
                          disabled={claimingId === order.id}
                          onClick={() => claimOrder(order.id)}>
                          {claimingId === order.id ? 'Alınıyor...' : 'Evet, Üstlen'}
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }}
                          onClick={() => setConfirmingId(null)}>
                          Vazgeç
                        </button>
                      </div>
                    ) : (
                      <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}
                        onClick={() => setConfirmingId(order.id)}>
                        Üstlen
                      </button>
                    )}
                  </OrderCard>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'mine' && (
          mine.length === 0 ? (
            <EmptyState icon="📦" text="Henüz üstlendiğin bir sipariş yok.">
              <button className="btn-primary" style={{ marginTop: '16px', fontSize: '13px', padding: '9px 18px' }} onClick={() => setTab('pool')}>
                Müsait Siparişlere Bak
              </button>
            </EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <SectionLabel>Devam Eden ({activeMine.length})</SectionLabel>
                {activeMine.length === 0 ? (
                  <EmptyState icon="⚡" text="Devam eden bir siparişin yok." compact />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeMine.map(order => (
                      <OrderCard key={order.id} order={order} format={format} showStatus>
                        {order.status === 'assigned' && (
                          <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}
                            disabled={updatingId === order.id}
                            onClick={() => updateStatus(order.id, 'in_progress')}>
                            {updatingId === order.id ? '...' : 'Başla'}
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}
                            disabled={updatingId === order.id}
                            onClick={() => updateStatus(order.id, 'completed')}>
                            {updatingId === order.id ? '...' : 'Tamamlandı Olarak İşaretle'}
                          </button>
                        )}
                      </OrderCard>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <SectionLabel>Tamamlanan ({completedMine.length})</SectionLabel>
                {completedMine.length === 0 ? (
                  <EmptyState icon="✅" text="Henüz tamamlanan bir siparişin yok." compact />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {completedMine.map(order => (
                      <OrderCard key={order.id} order={order} format={format} showStatus muted />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px',
            }}>
              <h3 className="h4" style={{ color: '#fff', marginBottom: '4px' }}>💬 Discord Bildirimleri</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.6' }}>
                Discord User ID'ni girersen, sana bir sipariş atandığında Discord'dan mention alırsın.
                ID'ni almak için Discord'da Ayarlar → Gelişmiş → Geliştirici Modu'nu aç, sonra profiline sağ tıklayıp "ID'yi Kopyala"yı seç.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={discordId} onChange={e => setDiscordId(e.target.value)} placeholder="123456789012345678"
                  style={{
                    flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none',
                  }} />
                <button className="btn-primary" onClick={saveDiscordId} disabled={savingDiscord} style={{ padding: '10px 18px', fontSize: '13px', flexShrink: 0 }}>
                  {savingDiscord ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px',
            }}>
              <h3 className="h4" style={{ color: '#fff', marginBottom: '14px' }}>Booster Bilgilerin</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <ProfileRow label="Durum">
                  <span style={{
                    fontSize: '11px', padding: '2px 10px', borderRadius: '20px', fontWeight: '700',
                    background: booster.status === 'active' ? '#1a2a1a' : '#2a1a1a',
                    border: `1px solid ${booster.status === 'active' ? '#2a4a2a' : '#4a2a2a'}`,
                    color: booster.status === 'active' ? '#4caf50' : '#ff6666',
                  }}>{booster.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                </ProfileRow>
                <ProfileRow label="Tamamlanan Sipariş"><span style={{ color: '#fff', fontWeight: '600' }}>{booster.completedCount || 0}</span></ProfileRow>
                <ProfileRow label="Puan">
                  {booster.rating > 0 ? (
                    <span style={{ color: 'var(--gold)', fontWeight: '600' }}>
                      {'★'.repeat(Math.round(booster.rating))}{'☆'.repeat(5 - Math.round(booster.rating))}
                      <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontWeight: '400' }}>{booster.rating.toFixed(1)}</span>
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Henüz puan yok</span>
                  )}
                </ProfileRow>
                <ProfileRow label="Yetkili Olduğun Oyunlar">
                  <span style={{ color: '#fff', fontWeight: '600' }}>
                    {Array.isArray(booster.games) && booster.games.length > 0 ? `${booster.games.length} oyun (yönetici belirler)` : 'Tüm oyunlar'}
                  </span>
                </ProfileRow>
              </div>
            </div>
          </div>
        )}
      </Container>
      <Footer />
    </main>
  )
}

function SectionLabel({ children }) {
  return (
    <h3 style={{
      fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)',
      fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
    }}>{children}</h3>
  )
}

function ProfileRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '10px 16px', minWidth: '120px',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
        background: accent ? 'rgba(245,197,24,0.1)' : 'var(--bg-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '17px', fontWeight: '800', color: accent ? 'var(--gold)' : '#fff', fontFamily: 'var(--font-montserrat)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  )
}

function EmptyState({ icon, text, compact, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: compact ? '28px 24px' : '50px', textAlign: 'center',
    }}>
      {icon && <div style={{ fontSize: compact ? '22px' : '30px', marginBottom: '10px', opacity: 0.5 }}>{icon}</div>}
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{text}</p>
      {children}
    </div>
  )
}

function OrderCard({ order, format, showStatus, muted, children }) {
  const details = order.details || {}
  const selection = details.selection || {}
  const options = order.service?.options
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending

  let selectionText = ''
  if (options?.type === 'range') selectionText = `${selection.from} → ${selection.to} ${options.unitName}`
  else if (options?.type === 'quantity') selectionText = `${selection.quantity} × ${options.unitName}`
  else if (options?.type === 'options') selectionText = selection.choice

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      opacity: muted ? 0.65 : 1, transition: 'border-color 0.15s, opacity 0.15s',
    }}
      onMouseEnter={e => { if (!muted) e.currentTarget.style.borderColor = 'var(--border-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
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

      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>
            {order.service?.game?.name} — {order.service?.name}
          </span>
          {showStatus && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
              {STATUS_LABELS[order.status]}
            </span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {order.orderNumber}
          {selectionText && ` · ${selectionText}`}
          {' · '}müşteri: {order.user?.username}
          {order.createdAt && ` · ${timeAgo(order.createdAt)}`}
        </div>
        {details.note && (
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontStyle: 'italic' }}>
            "{details.note}"
          </div>
        )}
      </div>

      <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', flexShrink: 0 }}>
        {format(order.price)}
      </div>

      {children}
    </div>
  )
}
