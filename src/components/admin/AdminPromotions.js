'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import AdminSkeleton from './AdminSkeleton'

const emptyCoupon = { code: '', type: 'percent', value: '', minSpend: '', maxUses: '', perUserLimit: '1', gameId: '', expiresAt: '' }
const emptyCampaign = { name: '', discountPct: '', gameId: '', startsAt: '', endsAt: '' }

export default function AdminPromotions({ secret }) {
  const [coupons, setCoupons] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [couponForm, setCouponForm] = useState(emptyCoupon)
  const [campaignForm, setCampaignForm] = useState(emptyCampaign)
  const [msg, setMsg] = useState(null)
  const [fetchError, setFetchError] = useState('')
  const [confirmDeleteCoupon, setConfirmDeleteCoupon] = useState(null)
  const [confirmDeleteCampaign, setConfirmDeleteCampaign] = useState(null)
  const [couponListRef] = useAutoAnimate()
  const [campaignListRef] = useAutoAnimate()

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }), [secret])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const [cRes, kRes] = await Promise.all([
        fetch('/api/coupons', { headers }),
        fetch('/api/campaigns', { headers }),
      ])
      const cd = await cRes.json()
      const kd = await kRes.json()
      if (cd.success) setCoupons(cd.data)
      if (kd.success) setCampaigns(kd.data)
      if (!cd.success || !kd.success) setFetchError(cd.error || kd.error || 'Veriler yüklenemedi')
    } catch (e) {
      console.error(e)
      setFetchError('Veriler yüklenemedi')
    }
    setLoading(false)
  }, [headers])

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games')
      const data = await res.json()
      if (data.success) setGames(data.data)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPromotions() {
      await Promise.resolve()
      if (cancelled) return
      await Promise.all([fetchAll(), fetchGames()])
    }

    loadPromotions()
    return () => { cancelled = true }
  }, [fetchAll, fetchGames])

  function flash(text, type = 'success') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  async function createCoupon() {
    if (!couponForm.code.trim() || !couponForm.value) {
      flash('Kod ve değer zorunlu', 'error')
      return
    }
    try {
      const res = await fetch('/api/coupons', { method: 'POST', headers, body: JSON.stringify({ action: 'create', ...couponForm }) })
      const d = await res.json()
      if (d.success) {
        setShowCouponForm(false)
        setCouponForm(emptyCoupon)
        flash(`${d.data.code} oluşturuldu`)
        fetchAll()
      } else {
        flash(d.error || 'Bir hata oluştu', 'error')
      }
    } catch (e) {
      console.error(e)
      flash('Kupon oluşturulamadı', 'error')
    }
  }

  async function toggleCoupon(c) {
    try {
      const res = await fetch('/api/coupons', { method: 'POST', headers, body: JSON.stringify({ action: 'update', id: c.id, isActive: !c.isActive }) })
      const d = await res.json()
      if (!d.success) { flash(d.error || 'Durum güncellenemedi', 'error'); return }
      fetchAll()
    } catch (e) {
      console.error(e)
      flash('Durum güncellenemedi', 'error')
    }
  }

  async function deleteCoupon(c) {
    try {
      const res = await fetch('/api/coupons', { method: 'POST', headers, body: JSON.stringify({ action: 'delete', id: c.id }) })
      const d = await res.json()
      if (!d.success) { flash(d.error || 'Kupon silinemedi', 'error'); setConfirmDeleteCoupon(null); return }
      flash(`${c.code} silindi`)
      fetchAll()
    } catch (e) {
      console.error(e)
      flash('Kupon silinemedi', 'error')
    }
    setConfirmDeleteCoupon(null)
  }

  async function createCampaign() {
    if (!campaignForm.name.trim() || !campaignForm.discountPct || !campaignForm.startsAt || !campaignForm.endsAt) {
      flash('Ad, indirim yüzdesi, başlangıç ve bitiş tarihi zorunlu', 'error')
      return
    }
    try {
      const res = await fetch('/api/campaigns', { method: 'POST', headers, body: JSON.stringify({ action: 'create', ...campaignForm }) })
      const d = await res.json()
      if (d.success) {
        setShowCampaignForm(false)
        setCampaignForm(emptyCampaign)
        flash(`${d.data.name} oluşturuldu`)
        fetchAll()
      } else {
        flash(d.error || 'Bir hata oluştu', 'error')
      }
    } catch (e) {
      console.error(e)
      flash('Kampanya oluşturulamadı', 'error')
    }
  }

  async function toggleCampaign(c) {
    try {
      const res = await fetch('/api/campaigns', { method: 'POST', headers, body: JSON.stringify({ action: 'update', id: c.id, isActive: !c.isActive }) })
      const d = await res.json()
      if (!d.success) { flash(d.error || 'Durum güncellenemedi', 'error'); return }
      fetchAll()
    } catch (e) {
      console.error(e)
      flash('Durum güncellenemedi', 'error')
    }
  }

  async function deleteCampaign(c) {
    try {
      const res = await fetch('/api/campaigns', { method: 'POST', headers, body: JSON.stringify({ action: 'delete', id: c.id }) })
      const d = await res.json()
      if (!d.success) { flash(d.error || 'Kampanya silinemedi', 'error'); setConfirmDeleteCampaign(null); return }
      flash(`${c.name} silindi`)
      fetchAll()
    } catch (e) {
      console.error(e)
      flash('Kampanya silinemedi', 'error')
    }
    setConfirmDeleteCampaign(null)
  }

  function isCampaignLive(c) {
    const now = new Date()
    return c.isActive && new Date(c.startsAt) <= now && now <= new Date(c.endsAt)
  }

  if (loading) return <AdminSkeleton rows={5} />

  return (
    <div>
      {msg && (
        <div onClick={() => setMsg(null)} role={msg.type === 'error' ? 'alert' : 'status'} style={{
          background: msg.type === 'error' ? '#2a1a1a' : '#1a2a1a',
          border: `1px solid ${msg.type === 'error' ? '#4a2a2a' : '#2a4a2a'}`, borderRadius: '8px',
          padding: '10px 16px', color: msg.type === 'error' ? '#ff6666' : '#4caf50', fontSize: '13px', marginBottom: '16px', cursor: 'pointer',
        }}>{msg.text} ✕</div>
      )}

      {fetchError && (
        <div role="alert" style={{
          background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px',
          padding: '10px 16px', color: '#ff6666', fontSize: '13px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        }}>
          <span>{fetchError}</span>
          <button type="button" className="btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }} onClick={fetchAll}>Tekrar Dene</button>
        </div>
      )}

      {/* Kuponlar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Kupon Kodları ({coupons.length})</h2>
        <button type="button" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setShowCouponForm(v => !v)}>
          {showCouponForm ? 'Vazgeç' : '+ Yeni Kupon'}
        </button>
      </div>

      {showCouponForm && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
            <Field label="Kod *" placeholder="WELCOME10" value={couponForm.code} onChange={v => setCouponForm(f => ({ ...f, code: v.toUpperCase() }))} />
            <div>
              <label style={labelStyle}>Tür</label>
              <select value={couponForm.type} onChange={e => setCouponForm(f => ({ ...f, type: e.target.value }))} style={selectStyle}>
                <option value="percent">Yüzde (%)</option>
                <option value="fixed">Sabit tutar ($)</option>
              </select>
            </div>
            <Field label={couponForm.type === 'percent' ? 'Değer (%) *' : 'Değer ($) *'} type="number" value={couponForm.value} onChange={v => setCouponForm(f => ({ ...f, value: v }))} />
            <Field label="Min. Harcama ($)" type="number" placeholder="opsiyonel" value={couponForm.minSpend} onChange={v => setCouponForm(f => ({ ...f, minSpend: v }))} />
            <Field label="Maks. Kullanım" type="number" placeholder="sınırsız" value={couponForm.maxUses} onChange={v => setCouponForm(f => ({ ...f, maxUses: v }))} />
            <Field label="Kullanıcı Başına Limit" type="number" placeholder="1" value={couponForm.perUserLimit} onChange={v => setCouponForm(f => ({ ...f, perUserLimit: v }))} />
            <div>
              <label style={labelStyle}>Oyun</label>
              <select value={couponForm.gameId} onChange={e => setCouponForm(f => ({ ...f, gameId: e.target.value }))} style={selectStyle}>
                <option value="">Tüm oyunlar</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <Field label="Son Kullanma Tarihi" type="date" value={couponForm.expiresAt} onChange={v => setCouponForm(f => ({ ...f, expiresAt: v }))} />
          </div>
          <button type="button" className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={createCoupon}>Oluştur</button>
        </div>
      )}

      <div style={{ overflowX: 'auto', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['KOD', 'İNDİRİM', 'KULLANIM', 'OYUN', 'DURUM', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-montserrat)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody ref={couponListRef}>
            {coupons.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '16px 8px', color: 'var(--text-dim)', fontSize: '13px' }}>Henüz kupon yok.</td></tr>
            ) : coupons.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '700' }}>{c.code}</td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: 'var(--gold)' }}>
                  {c.type === 'percent' ? `%${c.value}` : `$${c.value}`}
                  {c.expiresAt && <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}> · {new Date(c.expiresAt).toLocaleDateString('tr-TR')} son</span>}
                </td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.usedCount} / {c.maxUses ?? '∞'}</td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.game?.name || 'Tüm oyunlar'}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: '600',
                    background: c.isActive ? 'rgba(76,175,80,0.15)' : 'rgba(255,100,100,0.1)',
                    color: c.isActive ? '#4caf50' : '#ff6666',
                  }}>{c.isActive ? 'Aktif' : 'Pasif'}</span>
                </td>
                <td style={{ padding: '10px 8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {confirmDeleteCoupon === c.id ? (
                    <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#ff6666' }}>Emin misin?</span>
                      <button type="button" onClick={() => deleteCoupon(c)} style={{ ...smallBtnStyle, color: '#ff6666' }}>Evet, Sil</button>
                      <button type="button" onClick={() => setConfirmDeleteCoupon(null)} style={smallBtnStyle}>İptal</button>
                    </span>
                  ) : (
                    <>
                      <button type="button" aria-pressed={c.isActive} onClick={() => toggleCoupon(c)} style={smallBtnStyle}>{c.isActive ? 'Pasife Al' : 'Aktif Et'}</button>
                      <button type="button" onClick={() => setConfirmDeleteCoupon(c.id)} style={{ ...smallBtnStyle, color: '#ff6666' }}>Sil</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kampanyalar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Kampanyalar ({campaigns.length})</h2>
        <button type="button" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setShowCampaignForm(v => !v)}>
          {showCampaignForm ? 'Vazgeç' : '+ Yeni Kampanya'}
        </button>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '16px' }}>
        Aktif bir kampanya, o kapsamdaki siparişlerde otomatik olarak (kod girmeden) uygulanır — sadakat indirimiyle çakışırsa daha avantajlı olan tek indirim geçerli olur.
      </p>

      {showCampaignForm && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
            <Field label="Kampanya Adı *" placeholder="Yaz İndirimi" value={campaignForm.name} onChange={v => setCampaignForm(f => ({ ...f, name: v }))} />
            <Field label="İndirim (%) *" type="number" value={campaignForm.discountPct} onChange={v => setCampaignForm(f => ({ ...f, discountPct: v }))} />
            <div>
              <label style={labelStyle}>Oyun</label>
              <select value={campaignForm.gameId} onChange={e => setCampaignForm(f => ({ ...f, gameId: e.target.value }))} style={selectStyle}>
                <option value="">Tüm oyunlar (site geneli)</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <Field label="Başlangıç *" type="date" value={campaignForm.startsAt} onChange={v => setCampaignForm(f => ({ ...f, startsAt: v }))} />
            <Field label="Bitiş *" type="date" value={campaignForm.endsAt} onChange={v => setCampaignForm(f => ({ ...f, endsAt: v }))} />
          </div>
          <button type="button" className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={createCampaign}>Oluştur</button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['AD', 'İNDİRİM', 'OYUN', 'TARİH ARALIĞI', 'DURUM', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-montserrat)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody ref={campaignListRef}>
            {campaigns.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '16px 8px', color: 'var(--text-dim)', fontSize: '13px' }}>Henüz kampanya yok.</td></tr>
            ) : campaigns.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '700' }}>{c.name}</td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: 'var(--gold)' }}>%{c.discountPct}</td>
                <td style={{ padding: '10px 8px', fontSize: '13px', color: 'var(--text-muted)' }}>{c.game?.name || 'Site geneli'}</td>
                <td style={{ padding: '10px 8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(c.startsAt).toLocaleDateString('tr-TR')} → {new Date(c.endsAt).toLocaleDateString('tr-TR')}
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 9px', borderRadius: '20px', fontWeight: '600',
                    background: isCampaignLive(c) ? 'rgba(76,175,80,0.15)' : 'rgba(255,100,100,0.1)',
                    color: isCampaignLive(c) ? '#4caf50' : '#ff6666',
                  }}>{isCampaignLive(c) ? 'Yayında' : c.isActive ? 'Pasif tarih dışı' : 'Pasif'}</span>
                </td>
                <td style={{ padding: '10px 8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {confirmDeleteCampaign === c.id ? (
                    <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#ff6666' }}>Emin misin?</span>
                      <button type="button" onClick={() => deleteCampaign(c)} style={{ ...smallBtnStyle, color: '#ff6666' }}>Evet, Sil</button>
                      <button type="button" onClick={() => setConfirmDeleteCampaign(null)} style={smallBtnStyle}>İptal</button>
                    </span>
                  ) : (
                    <>
                      <button type="button" aria-pressed={c.isActive} onClick={() => toggleCampaign(c)} style={smallBtnStyle}>{c.isActive ? 'Pasife Al' : 'Aktif Et'}</button>
                      <button type="button" onClick={() => setConfirmDeleteCampaign(c.id)} style={{ ...smallBtnStyle, color: '#ff6666' }}>Sil</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const labelStyle = { fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }
const selectStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }
const smallBtnStyle = { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }} />
    </div>
  )
}
