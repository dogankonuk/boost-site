'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import { useCurrency } from '@/context/CurrencyContext'

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
  const [msg, setMsg] = useState('')
  const [discordId, setDiscordId] = useState('')
  const [savingDiscord, setSavingDiscord] = useState(false)

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }), [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchMe()
    setCheckedAuth(true)
  }, [])

  async function fetchMe() {
    setFetchError(null)
    try {
      const res = await fetch('/api/booster?type=me', { headers: authHeaders() })
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
      const res = await fetch('/api/booster', {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ discordId: discordId.trim() }),
      })
      const d = await res.json()
      if (d.success) {
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
      const res = await fetch('/api/booster?type=pool', { headers: authHeaders() })
      const d = await res.json()
      if (d.success) setPool(d.data)
    } catch {}
    setLoadingOrders(false)
  }

  async function fetchMine() {
    try {
      const res = await fetch('/api/booster?type=mine', { headers: authHeaders() })
      const d = await res.json()
      if (d.success) setMine(d.data)
    } catch {}
  }

  async function claimOrder(orderId) {
    setClaimingId(orderId)
    try {
      const res = await fetch('/api/booster', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ orderId }),
      })
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
    setTimeout(() => setMsg(''), 3000)
  }

  async function updateStatus(orderId, status) {
    try {
      const res = await fetch('/api/booster', {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ orderId, status }),
      })
      const d = await res.json()
      if (d.success) fetchMine()
    } catch {}
  }

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

  const activeMineCount = mine.filter(o => ['assigned', 'in_progress'].includes(o.status)).length

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container style={{ paddingTop: '32px', paddingBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 className="h2" style={{ color: '#fff' }}>Booster Paneli</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Sana atanan ve müsait siparişleri buradan yönet.</p>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <MiniStat label="Aktif" value={activeMineCount} />
            <MiniStat label="Tamamlanan" value={booster.completedCount || 0} />
            <MiniStat label="Puan" value={booster.rating > 0 ? booster.rating.toFixed(1) : '—'} />
          </div>
        </div>

        {msg && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '10px 16px', color: 'var(--gold)', fontSize: '13px', marginBottom: '16px',
          }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { key: 'pool', label: `Müsait Siparişler (${pool.length})` },
            { key: 'mine', label: `Benim Siparişlerim (${mine.length})` },
            { key: 'profile', label: 'Profil' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px',
              fontFamily: 'var(--font-montserrat)', fontWeight: '600',
              cursor: 'pointer', border: '1px solid',
              background: tab === t.key ? 'var(--gold)' : 'transparent',
              color: tab === t.key ? '#0a0a0a' : 'var(--text-muted)',
              borderColor: tab === t.key ? 'var(--gold)' : 'var(--border)',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'pool' && (
          loadingOrders ? (
            <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
          ) : pool.length === 0 ? (
            <EmptyState text="Şu an müsait sipariş yok. Yeni siparişler geldiğinde burada görünecek." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pool.map(order => (
                <OrderCard key={order.id} order={order} format={format}>
                  <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}
                    disabled={claimingId === order.id}
                    onClick={() => claimOrder(order.id)}>
                    {claimingId === order.id ? 'Alınıyor...' : 'Üstlen'}
                  </button>
                </OrderCard>
              ))}
            </div>
          )
        )}

        {tab === 'mine' && (
          mine.length === 0 ? (
            <EmptyState text="Henüz üstlendiğin bir sipariş yok. Müsait Siparişler sekmesinden bir tane al." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <h3 style={{
                  fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)',
                  fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
                }}>
                  Devam Eden ({mine.filter(o => ['assigned', 'in_progress'].includes(o.status)).length})
                </h3>
                {mine.filter(o => ['assigned', 'in_progress'].includes(o.status)).length === 0 ? (
                  <EmptyState text="Devam eden bir siparişin yok." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {mine.filter(o => ['assigned', 'in_progress'].includes(o.status)).map(order => (
                      <OrderCard key={order.id} order={order} format={format} showStatus>
                        {order.status === 'assigned' && (
                          <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}
                            onClick={() => updateStatus(order.id, 'in_progress')}>
                            Başla
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}
                            onClick={() => updateStatus(order.id, 'completed')}>
                            Tamamlandı Olarak İşaretle
                          </button>
                        )}
                      </OrderCard>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{
                  fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)',
                  fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
                }}>
                  Tamamlanan ({mine.filter(o => o.status === 'completed').length})
                </h3>
                {mine.filter(o => o.status === 'completed').length === 0 ? (
                  <EmptyState text="Henüz tamamlanan bir siparişin yok." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {mine.filter(o => o.status === 'completed').map(order => (
                      <OrderCard key={order.id} order={order} format={format} showStatus />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px',
            }}>
              <h3 className="h4" style={{ color: '#fff', marginBottom: '4px' }}>Discord Bildirimleri</h3>
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
                <button className="btn-primary" onClick={saveDiscordId} disabled={savingDiscord} style={{ padding: '10px 18px', fontSize: '13px' }}>
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
                <ProfileRow label="Durum" value={booster.status === 'active' ? 'Aktif' : 'Pasif'} />
                <ProfileRow label="Tamamlanan Sipariş" value={booster.completedCount || 0} />
                <ProfileRow label="Puan" value={booster.rating > 0 ? booster.rating.toFixed(1) : 'Henüz puan yok'} />
                <ProfileRow
                  label="Yetkili Olduğun Oyunlar"
                  value={Array.isArray(booster.games) && booster.games.length > 0 ? `${booster.games.length} oyun (yönetici belirler)` : 'Tüm oyunlar'}
                />
              </div>
            </div>
          </div>
        )}
      </Container>
      <Footer />
    </main>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: '600' }}>{value}</span>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{label}</div>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '50px', textAlign: 'center',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{text}</p>
    </div>
  )
}

function OrderCard({ order, format, showStatus, children }) {
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
    }}>
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
        </div>
        {details.note && (
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontStyle: 'italic' }}>
            “{details.note}”
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
