'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useCurrency } from '@/context/CurrencyContext'
import { useCart } from '@/context/CartContext'
import { authFetch } from '@/lib/authFetch'
import { getLoyaltyTier } from '@/lib/loyalty'
import { celebrate } from '@/lib/celebrate'
import { calculatePrice, round2 } from '@/lib/pricing'
import { trackEvent } from '@/lib/analytics'
import CouponInput from './CouponInput'

const TRUST_ITEMS = [
  { icon: <BoltIcon />, text: 'Delivered in 1–3 days' },
  { icon: <ShieldIcon />, text: 'Account safety guaranteed' },
  { icon: <CoinIcon />, text: 'Money-back guarantee' },
  { icon: <GlobeIcon />, text: 'VPN protection' },
]

export default function OrderForm({ service }) {
  const router = useRouter()
  const { format } = useCurrency()
  const { addItem } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [tier, setTier] = useState(null)
  const [couponPreview, setCouponPreview] = useState(null)
  const [selection, setSelection] = useState({
    quantity: service.options?.minQty || 1,
    from: service.options?.min || 1,
    to: service.options?.min ? service.options.min + 1 : 2,
    choice: service.options?.choices?.[0]?.label || '',
  })

  const options = service.options
  const price = calculatePrice(options, service.basePrice, selection)
  const loyaltyDiscountAmount = tier?.discount ? round2(price * (tier.discount / 100)) : 0
  const couponDiscountAmount = couponPreview ? couponPreview.discountAmount : 0
  const couponWins = couponDiscountAmount > loyaltyDiscountAmount
  const bestDiscountAmount = Math.max(loyaltyDiscountAmount, couponDiscountAmount)
  const finalPrice = round2(Math.max(0, price - bestDiscountAmount))
  const discountPct = bestDiscountAmount > 0 && !couponWins ? tier?.discount || 0 : 0

  const selectionKey = JSON.stringify(selection)
  const skipCouponClear = useRef(true)
  useEffect(() => {
    if (skipCouponClear.current) { skipCouponClear.current = false; return }
    setCouponPreview(null)
  }, [selectionKey])

  useEffect(() => {
    const hasToken = !!localStorage.getItem('token')
    setLoggedIn(hasToken)
    const t = setTimeout(() => setMounted(true), 20)

    if (hasToken) {
      authFetch('/api/auth', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getProfile' }),
      }).then(res => res?.json()).then(d => {
        if (d?.success) setTier(d.data.loyaltyTier)
      }).catch(() => {})
    }
    return () => clearTimeout(t)
  }, [])

  async function handleOrder() {
    if (!loggedIn) { router.push('/login'); return }
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          details: { note, selection, calculatedPrice: finalPrice },
          couponCode: couponWins ? couponPreview.code : undefined,
        }),
      })
      if (!res) return
      const d = await res.json()
      if (d.success) {
        celebrate()
        toast.success('Order placed!')
        trackEvent('purchase', {
          transaction_id: d.data.orderNumber,
          value: finalPrice,
          currency: 'USD',
          items: [{ item_id: service.id, item_name: service.name, item_category: service.game?.name }],
          coupon: couponWins ? couponPreview.code : undefined,
        })
        router.push('/dashboard')
      } else {
        setError(d.error || 'An error occurred')
        toast.error(d.error || 'An error occurred')
      }
    } catch {
      setError('Failed to connect to the server')
      toast.error('Failed to connect to the server')
    }
    setLoading(false)
  }

  function getSelectionSummary() {
    if (!options || options.type === 'fixed') return null
    if (options.type === 'range') return `${selection.from} → ${selection.to} ${options.unitName}`
    if (options.type === 'quantity') return `${selection.quantity} × ${options.unitName}`
    if (options.type === 'options') return selection.choice
    return null
  }

  function handleAddToCart() {
    addItem({
      serviceId: service.id,
      serviceName: service.name,
      gameName: service.game?.name,
      gameSlug: service.game?.slug,
      imageUrl: service.imageUrl || service.game?.coverImage || null,
      selectionSummary: getSelectionSummary(),
      selection,
      note,
      price: finalPrice,
    })
    setAddedToCart(true)
    toast.success('Added to cart')
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const rangeMin = options?.min ?? 0
  const rangeMax = options?.max ?? 100
  const rangeSpan = Math.max(1, rangeMax - rangeMin)
  const rangeFromPct = ((selection.from - rangeMin) / rangeSpan) * 100
  const rangeToPct = ((selection.to - rangeMin) / rangeSpan) * 100

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '20px', overflow: 'hidden',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
    }}>
      {/* Price summary header */}
      <div style={{
        background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
        padding: '22px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px',
          fontFamily: 'var(--font-montserrat)', fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {options?.type === 'fixed' || !options ? 'Price' : 'Total price'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          {bestDiscountAmount > 0 && (
            <div style={{ fontSize: '18px', color: 'var(--text-dim)', textDecoration: 'line-through', lineHeight: 1 }}>
              {format(price)}
            </div>
          )}
          <div style={{ fontSize: '38px', fontWeight: '700', fontFamily: 'var(--font-montserrat)', color: 'var(--gold)', lineHeight: 1 }}>
            {format(finalPrice)}
          </div>
          {couponWins && (
            <span style={{
              fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px',
              background: 'rgba(245,197,24,0.15)', color: 'var(--gold)',
            }}>🏷️ {couponPreview.code}</span>
          )}
          {discountPct > 0 && (
            <span style={{
              fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px',
              background: `${tier.color}22`, color: tier.color,
            }}>{tier.icon} -{discountPct}% {tier.name}</span>
          )}
          {options?.type === 'range' && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {Math.max(0, selection.to - selection.from)} {options.unitName}
              {' · '}{format(price / Math.max(1, selection.to - selection.from))} each
            </div>
          )}
          {options?.type === 'quantity' && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {selection.quantity} × {format(price / Math.max(1, selection.quantity))}
            </div>
          )}
        </div>
        {options?.type === 'range' && (
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
            Level {selection.from} → Level {selection.to}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 24px 0' }}>
        <CouponInput
          serviceId={service.id}
          selection={selection}
          applied={couponPreview}
          onApplied={data => setCouponPreview(data)}
          onRemoved={() => setCouponPreview(null)}
        />
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {options?.type === 'quantity' && (
          <div>
            <SectionLabel>{options.unitName} amount</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StepperButton
                disabled={selection.quantity <= options.minQty}
                onClick={() => setSelection(s => ({ ...s, quantity: Math.max(options.minQty, s.quantity - 1) }))}
              >−</StepperButton>
              <input type="number" value={selection.quantity}
                min={options.minQty} max={options.maxQty}
                onChange={e => setSelection(s => ({ ...s, quantity: Math.min(options.maxQty, Math.max(options.minQty, parseInt(e.target.value) || options.minQty)) }))}
                style={{
                  flex: 1, textAlign: 'center', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', borderRadius: '8px', padding: '9px',
                  color: '#fff', fontSize: '16px', fontWeight: '700',
                  fontFamily: 'var(--font-montserrat)', outline: 'none',
                }} />
              <StepperButton
                disabled={selection.quantity >= options.maxQty}
                onClick={() => setSelection(s => ({ ...s, quantity: Math.min(options.maxQty, s.quantity + 1) }))}
              >+</StepperButton>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
              <span>Min {options.minQty}</span>
              <span>Max {options.maxQty}</span>
            </div>
          </div>
        )}

        {options?.type === 'range' && (
          <div>
            <SectionLabel>Select {options.unitName} range</SectionLabel>

            {/* Visual range track */}
            <div style={{ position: 'relative', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', border: '1px solid var(--border)', margin: '4px 0 16px' }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${rangeFromPct}%`, width: `${Math.max(0, rangeToPct - rangeFromPct)}%`,
                background: 'var(--gold)', borderRadius: '3px',
              }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>From</label>
                <select value={selection.from}
                  onChange={e => {
                    const from = parseInt(e.target.value)
                    setSelection(s => ({ ...s, from, to: Math.max(from + 1, s.to) }))
                  }}
                  style={selectStyle}>
                  {Array.from({ length: options.max - options.min }, (_, i) => options.min + i).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>To</label>
                <select value={selection.to}
                  onChange={e => setSelection(s => ({ ...s, to: parseInt(e.target.value) }))}
                  style={selectStyle}>
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
              &nbsp;·&nbsp; <span style={{ color: 'var(--gold)', fontWeight: '700' }}>{format(price)}</span> total
            </div>
          </div>
        )}

        {options?.type === 'options' && (
          <div>
            <SectionLabel>Select option</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {options.choices?.map((c, i) => {
                const selected = selection.choice === c.label
                return (
                  <button key={i} type="button"
                    onClick={() => setSelection(s => ({ ...s, choice: c.label }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                      background: selected ? 'rgba(245,197,24,0.08)' : 'var(--bg-elevated)',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}>
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--gold)' }} />}
                    </span>
                    <span style={{ fontSize: '14px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '600', flex: 1, textAlign: 'left' }}>{c.label}</span>
                    <span style={{ fontSize: '16px', color: 'var(--gold)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{format(c.price)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          padding: '14px', background: 'var(--bg-elevated)',
          borderRadius: '10px', border: '1px solid var(--border)',
        }}>
          {TRUST_ITEMS.map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                background: 'rgba(245,197,24,0.1)', color: 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{item.icon}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.3' }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div>
          <SectionLabel>Note (optional)</SectionLabel>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Any special instructions for your booster..."
            rows={3} style={{
              width: '100%', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: '8px',
              padding: '10px 14px', color: '#fff', fontSize: '13px',
              fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical',
            }} />
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px',
            padding: '10px 14px', color: '#ff6666', fontSize: '13px',
          }}>
            <WarningIcon /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={handleAddToCart} disabled={addedToCart}
            className="btn-secondary"
            style={{
              flex: 1, padding: '14px', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
            {addedToCart ? (
              <><CheckIcon /> Added</>
            ) : (
              <><CartAddIcon /> Add to Cart</>
            )}
          </button>
          <button className="btn-primary" onClick={handleOrder} disabled={loading}
            style={{
              flex: 1.4, padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            {loading ? (
              <>
                <Spinner /> Processing...
              </>
            ) : loggedIn ? (
              `${format(finalPrice)} — Buy Now`
            ) : (
              'Sign In to Purchase'
            )}
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', lineHeight: '1.6' }}>
          By placing an order you agree to our terms of service.
        </p>
      </div>
    </div>
  )
}

const selectStyle = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '14px', outline: 'none',
}

function SectionLabel({ children }) {
  return (
    <label style={{
      fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)',
      fontWeight: '700', display: 'block', marginBottom: '10px',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {children}
    </label>
  )
}

function StepperButton({ children, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} type="button" style={{
      width: '36px', height: '36px', background: 'var(--bg-elevated)',
      border: '1px solid var(--border)', borderRadius: '8px',
      color: disabled ? 'var(--text-dim)' : '#fff', fontSize: '18px',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--gold)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >{children}</button>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function BoltIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" strokeLinejoin="round" /></svg>
}
function ShieldIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3z" strokeLinejoin="round" /></svg>
}
function CoinIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 9h3.5a2 2 0 1 1 0 4H9m0-4v6m0-6H8m1 6h1m0 0h2.5a2 2 0 1 0 0-4" /></svg>
}
function GlobeIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-6-4-9s1.5-6.5 4-9z" /></svg>
}
function CartAddIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /><path d="M12 8v4m-2-2h4" /></svg>
}
function CheckIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function WarningIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M12 9v4m0 4h.01M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinejoin="round" /></svg>
}