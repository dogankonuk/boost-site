'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrderForm({ service }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

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
          details: { note },
        }),
      })
      const d = await res.json()
      if (d.success) {
        router.push('/dashboard')
      } else {
        setError(d.error || 'Bir hata oluştu')
      }
    } catch {
      setError('Sunucuya bağlanılamadı')
    }
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
          başlangıç fiyatı
        </div>
        <div style={{
          fontSize: '36px', fontWeight: '800',
          fontFamily: 'var(--font-montserrat)', color: 'var(--gold)',
        }}>
          {service.basePrice.toLocaleString('tr-TR')} ₺
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <div key={item.text} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '13px', color: 'var(--text-muted)',
            }}>
              <span>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        <div>
          <label style={{
            fontSize: '12px', color: 'var(--text-muted)',
            fontFamily: 'var(--font-montserrat)', fontWeight: '600',
            display: 'block', marginBottom: '6px',
          }}>Not (opsiyonel)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Booster'a iletmek istediğiniz özel notlar..."
            rows={3}
            style={{
              width: '100%', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: '8px',
              padding: '10px 14px', color: '#fff', fontSize: '13px',
              fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical',
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#2a1a1a', border: '1px solid #4a2a2a',
            borderRadius: '8px', padding: '10px 14px',
            color: '#ff6666', fontSize: '13px',
          }}>{error}</div>
        )}

        <button
          className="btn-primary"
          onClick={handleOrder}
          disabled={loading}
          style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'İşleniyor...' : loggedIn ? 'Hemen Satın Al' : 'Giriş Yap ve Satın Al'}
        </button>

        <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', lineHeight: '1.6' }}>
          Sipariş vererek hizmet şartlarımızı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  )
}