'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/authFetch'
import { trackEvent } from '@/lib/analytics'

export default function CouponInput({ serviceId, selection, applied, onApplied, onRemoved }) {
  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  async function apply() {
    if (!code.trim()) return
    setApplying(true)
    setError('')
    try {
      const res = await authFetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', code: code.trim(), serviceId, selection }),
      })
      if (!res) return
      const d = await res.json()
      if (d.success) {
        onApplied?.(d.data)
        toast.success(`Coupon applied: ${d.data.code}`)
        trackEvent('coupon_applied', { coupon: d.data.code, value: d.data.discountAmount })
      } else {
        setError(d.error || 'Invalid coupon code')
      }
    } catch {
      setError('Failed to connect to the server')
    }
    setApplying(false)
  }

  function remove() {
    setCode('')
    setError('')
    onRemoved?.()
  }

  if (applied) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        background: 'rgba(245,197,24,0.08)', border: '1px solid var(--gold)',
        borderRadius: '8px', padding: '9px 12px',
      }}>
        <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '600' }}>
          🏷️ {applied.code} applied
        </span>
        <button type="button" onClick={remove} style={{
          background: 'none', border: 'none', color: 'var(--text-dim)',
          fontSize: '12px', cursor: 'pointer', padding: 0,
        }}>Remove</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          aria-label="Coupon code"
          aria-describedby={error ? 'coupon-error' : undefined}
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && apply()}
          placeholder="Coupon code"
          style={{
            flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '13px',
            fontFamily: 'var(--font-inter)', outline: 'none', textTransform: 'uppercase',
          }}
        />
        <button type="button" onClick={apply} disabled={applying || !code.trim()} className="btn-secondary"
          style={{ minHeight: '44px', padding: '9px 16px', fontSize: '13px', opacity: (applying || !code.trim()) ? 0.6 : 1 }}>
          {applying ? '...' : 'Apply'}
        </button>
      </div>
      {error && <p id="coupon-error" role="alert" style={{ fontSize: '11px', color: '#ff6666', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}
