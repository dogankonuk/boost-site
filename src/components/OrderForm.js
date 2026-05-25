'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function calculatePrice(options, basePrice, selection) {
  if (!options || options.type === 'fixed') return basePrice
  if (options.type === 'quantity') {
    return Math.max(options.minQty, selection.quantity || options.minQty) * options.unitPrice
  }
  if (options.type === 'range') {
    const from = parseInt(selection.from || options.min)
    const to = parseInt(selection.to || options.min + 1)
    return Math.max(0, to - from) * options.pricePerUnit
  }
  if (options.type === 'options') {
    const choice = options.choices?.find(c => c.label === selection.choice)
    return choice ? choice.price : basePrice
  }
  return basePrice
}

export default function OrderForm({ service }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [selection, setSelection] = useState({
    quantity: service.options?.minQty || 1,
    from: service.options?.min || 1,
    to: service.options?.min ? service.options.min + 1 : 2,
    choice: service.options?.choices?.[0]?.label || '',
  })

  const options = service.options
  const price = calculatePrice(options, service.basePrice, selection)

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'))
  }, [])

  async function handleOrder() {
    if (!loggedIn) { router.push('/login'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          serviceId: service.id,
          details: { note, selection, calculatedPrice: price },
        }),
      })
      const d = await res.json()
      if (d.success) router.push('/dashboard')
      else setError(d.error || 'Bir hata oluştu')
    } catch { setError('Sunucuya bağlanılamadı') }
    setLoading(false)
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '20px', overflow: 'hidden',
    }}>
      <div style={{
        background: 'var(--bg-elevated)', padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
          {options?.type === 'fixed' || !options ? 'fiyat' : 'toplam fiyat'}
        </div>
        <div style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'var(--font-montserrat)', color: 'var(--gold)' }}>
          {price.toLocaleString('tr-TR')} ₺
        </div>
        {options?.type === 'range' && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {selection.from}. seviyeden {selection.to}. seviyeye — {Math.max(0, selection.to - selection.from)} {options.unitName}
          </div>
        )}
        {options?.type === 'quantity' && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {selection.quantity} × {options.unitPrice?.toLocaleString('tr-TR')} ₺
          </div>
        )}
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {options?.type === 'quantity' && (
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              {options.unitName} Miktarı
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setSelection(s => ({ ...s, quantity: Math.max(options.minQty, s.quantity - 1) }))}
                style={{ width: '36px', height: '36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <input type="number" value={selection.quantity}
                min={options.minQty} max={options.maxQty}
                onChange={e => setSelection(s => ({ ...s, quantity: Math.min(options.maxQty, Math.max(options.minQty, parseInt(e.target.value) || options.minQty)) }))}
                style={{ flex: 1, textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', color: '#fff', fontSize: '16px', fontWeight: '700', outline: 'none' }} />
              <button onClick={() => setSelection(s => ({ ...s, quantity: Math.min(options.maxQty, s.quantity + 1) }))}
                style={{ width: '36px', height: '36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              <span>Min: {options.minQty}</span>
              <span>Max: {options.maxQty}</span>
            </div>
          </div>
        )}

        {options?.type === 'range' && (
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)', fontWeight: '600', display: 'block', marginBottom: '12px' }}>
              {options.unitName} Aralığı Seç
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Başlangıç</label>
                <select value={selection.from}
                  onChange={e => {
                    const from = parseInt(e.target.value)
                    setSelection(s => ({ ...s, from, to: Math.max(from + 1, s.to) }))
                  }}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '14px', outline: 'none' }}>
                  {Array.from({ length: options.max - options.min }, (_, i) => options.min + i).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>Hedef</label>
                <select value={selection.to}
                  onChange={e => setSelection(s => ({ ...s, to: parseInt(e.target.value) }))}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '14px', outline: 'none' }}>
                  {Array.from({ length: options.max - selection.from }, (_, i) => selection.from + 1 + i).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: '10px',
              padding: '12px 16px', border: '1px solid var(--border)',
              fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center',
            }}>
              <span style={{ color: 'var(--gold)', fontWeight: '700' }}>{Math.max(0, selection.to - selection.from)}</span> {options.unitName} boost
              &nbsp;·&nbsp; birim başına <span style={{ color: 'var(--gold)', fontWeight: '700' }}>{options.pricePerUnit?.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        )}

        {options?.type === 'options' && (
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Seçenek
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {options.choices?.map((c, i) => (
                <button key={i} type="button"
                  onClick={() => setSelection(s => ({ ...s, choice: c.label }))}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${selection.choice === c.label ? 'var(--gold)' : 'var(--border)'}`,
                    background: selection.choice === c.label ? 'rgba(245,197,24,0.1)' : 'var(--bg-elevated)',
                  }}>
                  <span style={{ fontSize: '14px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>{c.label}</span>
                  <span style={{ fontSize: '16px', color: 'var(--gold)', fontWeight: '800', fontFamily: 'var(--font-montserrat)' }}>{c.price?.toLocaleString('tr-TR')} ₺</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          padding: '14px', background: 'var(--bg-elevated)',
          borderRadius: '10px', border: '1px solid var(--border)',
        }}>
          {[
            { icon: '⚡', text: '1–3 gün içinde teslim' },
            { icon: '🛡', text: 'Hesap güvenliği garantili' },
            { icon: '💰', text: 'Para iade garantisi' },
            { icon: '🌐', text: 'VPN koruması' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>{item.icon}</span>{item.text}
            </div>
          ))}
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
            Not (opsiyonel)
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Booster'a iletmek istediğiniz özel notlar..."
            rows={3} style={{
              width: '100%', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: '8px',
              padding: '10px 14px', color: '#fff', fontSize: '13px',
              fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical',
            }} />
        </div>

        {error && (
          <div style={{ background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#ff6666', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <button className="btn-primary" onClick={handleOrder} disabled={loading}
          style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'İşleniyor...' : loggedIn ? `${price.toLocaleString('tr-TR')} ₺ — Hemen Satın Al` : 'Giriş Yap ve Satın Al'}
        </button>

        <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', lineHeight: '1.6' }}>
          Sipariş vererek hizmet şartlarımızı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  )
}