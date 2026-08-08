'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useCurrency } from '@/context/CurrencyContext'
import { useCart } from '@/context/CartContext'
import { authFetch } from '@/lib/authFetch'
import { getLoyaltyTier } from '@/lib/loyalty'
import { celebrate } from '@/lib/celebrate'
import { calculatePrice, calculateAddonsCost, resolveAddonsSnapshot, round2 } from '@/lib/pricing'
import { trackEvent } from '@/lib/analytics'
import CouponInput from './CouponInput'

function defaultSelectedAddons(addons) {
  const result = {}
  for (const group of addons || []) {
    if (group.type === 'multiselect') {
      result[group.key] = []
    } else if (group.choices?.length) {
      result[group.key] = group.choices[0].value
    }
  }
  return result
}

function clampNumber(value, min, max, fallback = min, step = 1, stepBase = min) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  const safeStep = Math.max(1, Number(step) || 1)
  const snapped = stepBase + Math.round((parsed - stepBase) / safeStep) * safeStep
  return Math.min(max, Math.max(min, Math.round(snapped)))
}

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
    quantity: service.options?.minQty ?? 1,
    from: service.options?.min ?? 1,
    to: service.options?.min !== undefined
      ? Number(service.options.min) + Math.max(1, Number(service.options.step) || 1)
      : 2,
    choice: service.options?.choices?.[0]?.label || '',
  })
  const [selectedAddons, setSelectedAddons] = useState(() => defaultSelectedAddons(service.addons))

  const options = service.options
  const servicePrice = calculatePrice(options, service.basePrice, selection)
  const addonsCost = calculateAddonsCost(service.addons, selectedAddons, servicePrice)
  const price = round2(servicePrice + addonsCost)
  const loyaltyDiscountAmount = tier?.discount ? round2(price * (tier.discount / 100)) : 0
  const couponDiscountAmount = couponPreview ? couponPreview.discountAmount : 0
  const couponWins = couponDiscountAmount > loyaltyDiscountAmount
  const bestDiscountAmount = Math.max(loyaltyDiscountAmount, couponDiscountAmount)
  const finalPrice = round2(Math.max(0, price - bestDiscountAmount))
  const discountPct = bestDiscountAmount > 0 && !couponWins ? tier?.discount || 0 : 0

  const selectionKey = JSON.stringify(selection) + JSON.stringify(selectedAddons)
  const skipCouponClear = useRef(true)
  useEffect(() => {
    if (skipCouponClear.current) { skipCouponClear.current = false; return }
    setCouponPreview(null)
  }, [selectionKey])

  useEffect(() => {
    const hasToken = !!localStorage.getItem('token')
    const t = setTimeout(() => {
      setLoggedIn(hasToken)
      setMounted(true)
    }, 20)

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
          details: { note, selection, selectedAddons, calculatedPrice: finalPrice },
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
    const parts = []
    if (options && options.type !== 'fixed') {
      if (options.type === 'range') parts.push(`${selection.from} → ${selection.to} ${options.unitName}`)
      else if (options.type === 'quantity') parts.push(`${selection.quantity} × ${options.unitName}`)
      else if (options.type === 'options') parts.push(selection.choice)
    }
    const snapshot = resolveAddonsSnapshot(service.addons, selectedAddons, servicePrice)
    if (snapshot) {
      for (const group of Object.values(snapshot)) {
        parts.push(group.values.map(v => v.label).join(', '))
      }
    }
    return parts.length > 0 ? parts.join(' · ') : null
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
      selectedAddons,
      note,
      price: finalPrice,
    })
    setAddedToCart(true)
    toast.success('Added to cart')
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '20px', overflow: 'hidden',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
    }}>
      {/* Price summary header */}
      <div className="order-form-header" style={{
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
        <div aria-live="polite" aria-atomic="true" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          {bestDiscountAmount > 0 && (
            <div style={{ fontSize: '18px', color: 'var(--text-dim)', textDecoration: 'line-through', lineHeight: 1 }}>
              {format(price)}
            </div>
          )}
          <div className="order-form-price" style={{ fontSize: '38px', fontWeight: '700', fontFamily: 'var(--font-montserrat)', color: 'var(--gold)', lineHeight: 1 }}>
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

      <div className="order-form-coupon" style={{ padding: '16px 24px 0' }}>
        <CouponInput
          serviceId={service.id}
          selection={selection}
          applied={couponPreview}
          onApplied={data => setCouponPreview(data)}
          onRemoved={() => setCouponPreview(null)}
        />
      </div>

      <div className="order-form-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {options?.type === 'quantity' && (
          <QuantitySlider
            options={options}
            value={selection.quantity}
            onChange={quantity => setSelection(s => ({ ...s, quantity }))}
          />
        )}

        {options?.type === 'range' && (
          <div>
            <DualRangeSlider
              options={options}
              from={selection.from}
              to={selection.to}
              onChange={(from, to) => setSelection(s => ({ ...s, from, to }))}
            />

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

        {(service.addons || []).map(group => (
          <div key={group.key}>
            <SectionLabel>{group.label}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.choices?.map((c, i) => {
                const current = selectedAddons[group.key]
                const selected = group.type === 'multiselect'
                  ? Array.isArray(current) && current.includes(c.value)
                  : current === c.value
                const priceLabel = c.priceDelta
                  ? `+${c.priceType === 'percent' ? `${c.priceDelta}%` : format(c.priceDelta)}`
                  : 'Free'
                return (
                  <button key={i} type="button"
                    onClick={() => setSelectedAddons(s => {
                      if (group.type === 'multiselect') {
                        const list = Array.isArray(s[group.key]) ? s[group.key] : []
                        const next = list.includes(c.value) ? list.filter(v => v !== c.value) : [...list, c.value]
                        return { ...s, [group.key]: next }
                      }
                      return { ...s, [group.key]: c.value }
                    })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                      background: selected ? 'rgba(245,197,24,0.08)' : 'var(--bg-elevated)',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}>
                    <span style={{
                      width: '18px', height: '18px', flexShrink: 0,
                      borderRadius: group.type === 'multiselect' ? '5px' : '50%',
                      border: `2px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && (
                        <span style={{
                          width: '9px', height: '9px', background: 'var(--gold)',
                          borderRadius: group.type === 'multiselect' ? '2px' : '50%',
                        }} />
                      )}
                    </span>
                    <span style={{ fontSize: '14px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '600', flex: 1, textAlign: 'left' }}>
                      {c.label}
                      {c.desc && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400', fontFamily: 'var(--font-inter)', marginTop: '2px' }}>{c.desc}</div>}
                    </span>
                    <span style={{ fontSize: '13px', color: c.priceDelta ? 'var(--gold)' : 'var(--text-dim)', fontWeight: '700', fontFamily: 'var(--font-montserrat)', flexShrink: 0 }}>{priceLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Trust badges */}
        <div className="order-form-trust-grid" style={{
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
          <SectionLabel htmlFor="order-note">Note (optional)</SectionLabel>
          <textarea id="order-note" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Any special instructions for your booster..."
            rows={3} style={{
              width: '100%', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: '8px',
              padding: '10px 14px', color: '#fff', fontSize: '13px',
              fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical',
            }} />
        </div>

        {error && (
          <div role="alert" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px',
            padding: '10px 14px', color: '#ff6666', fontSize: '13px',
          }}>
            <WarningIcon /> {error}
          </div>
        )}

        <div className="order-form-actions" style={{ display: 'flex', gap: '10px' }}>
          {loggedIn ? (
            <>
              <button type="button" onClick={handleAddToCart} disabled={addedToCart}
                className="btn-secondary"
                style={{
                  flex: 1, minHeight: '48px', padding: '14px', fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                {addedToCart ? <><CheckIcon /> Added</> : <><CartAddIcon /> Add to Cart</>}
              </button>
              <button className="btn-primary" onClick={handleOrder} disabled={loading}
                style={{
                  flex: 1.4, minHeight: '48px', padding: '14px', fontSize: '15px', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                {loading ? <><Spinner /> Processing...</> : `${format(finalPrice)} — Buy Now`}
              </button>
            </>
          ) : (
            <button type="button" onClick={handleAddToCart} disabled={addedToCart}
              className="btn-primary"
              style={{
                width: '100%', minHeight: '48px', padding: '14px', fontSize: '15px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
              {addedToCart
                ? <><CheckIcon /> Added to Cart</>
                : <><CartAddIcon /> {format(finalPrice)} — Add to Cart</>}
            </button>
          )}
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', lineHeight: '1.6' }}>
          {loggedIn
            ? 'By placing an order you agree to our terms of service.'
            : 'Review your selections in the cart before checkout.'}
        </p>
      </div>
    </div>
  )
}

function SectionLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{
      fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)',
      fontWeight: '700', display: 'block', marginBottom: '10px',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {children}
    </label>
  )
}

function SliderTrack({ min, max, start = min, end, children }) {
  const span = Math.max(1, max - min)
  const startPct = ((start - min) / span) * 100
  const endPct = ((end - min) / span) * 100
  const filledRatio = Math.max(0, endPct - startPct) / 100

  return (
    <div style={{ position: 'relative', height: '28px', margin: '8px 0 2px' }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '12px', height: '5px',
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px',
      }} />
      <div style={{
        position: 'absolute', top: '12px', height: '5px',
        left: `calc(10px + (100% - 20px) * ${startPct / 100})`,
        width: `calc((100% - 20px) * ${filledRatio})`,
        background: 'linear-gradient(90deg, var(--gold), var(--gold-soft))', borderRadius: '20px',
      }} />
      {children}
    </div>
  )
}

function SliderNumberInput({ id, value, min, max, step = 1, stepBase = min, onChange, style }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = String(value)
    }
  }, [value])

  function commit(raw) {
    const next = clampNumber(raw, min, max, value, step, stepBase)
    if (inputRef.current) inputRef.current.value = String(next)
    onChange(next)
  }

  return (
    <input
      id={id}
      className="order-number-input"
      type="number"
      inputMode="numeric"
      defaultValue={value}
      ref={inputRef}
      min={min}
      max={max}
      step={step}
      onChange={event => {
        const raw = event.target.value
        if (raw === '') return
        const parsed = Number(raw)
        if (Number.isFinite(parsed) && parsed >= min && parsed <= max) {
          onChange(clampNumber(parsed, min, max, value, step, stepBase))
        }
      }}
      onBlur={event => commit(event.currentTarget.value)}
      onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur() }}
      style={style}
    />
  )
}

function QuantitySlider({ options, value, onChange }) {
  const min = Number(options.minQty) || 1
  const max = Math.max(min, Number(options.maxQty) || min)
  const step = Math.max(1, Number(options.step) || 1)
  const safeValue = clampNumber(value, min, max, min, step, min)
  const update = raw => onChange(clampNumber(raw, min, max, safeValue, step, min))

  return (
    <div>
      <SectionLabel htmlFor="order-quantity">Choose amount</SectionLabel>
      <label htmlFor="order-quantity" style={{
        display: 'block', color: 'var(--text-dim)', fontSize: '11px',
        fontWeight: '600', fontFamily: 'var(--font-montserrat)', marginBottom: '5px',
      }}>
        {options.unitName || 'Units'}
      </label>
      <SliderNumberInput
        id="order-quantity"
        value={safeValue}
        min={min}
        max={max}
        step={step}
        stepBase={min}
        onChange={update}
        style={{
          width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '11px 13px', color: '#fff', fontSize: '17px',
          fontWeight: '700', fontFamily: 'var(--font-montserrat)', outline: 'none',
        }}
      />
      <SliderTrack min={min} max={max} end={safeValue}>
        <input
          className="order-range-input"
          type="range"
          aria-label={`${options.unitName || 'Unit'} amount`}
          min={min}
          max={max}
          step="any"
          value={safeValue}
          onChange={e => update(e.target.value)}
        />
      </SliderTrack>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '11px' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

function DualRangeSlider({ options, from, to, onChange }) {
  const min = Number(options.min) || 0
  const max = Math.max(min + 1, Number(options.max) || min + 1)
  const step = Math.min(max - min, Math.max(1, Number(options.step) || 1))
  const safeFrom = clampNumber(from, min, max - step, min, step, min)
  const safeTo = clampNumber(to, safeFrom + step, max, safeFrom + step, step, min)

  function updateFrom(raw) {
    onChange(clampNumber(raw, min, safeTo - step, safeFrom, step, min), safeTo)
  }

  function updateTo(raw) {
    onChange(safeFrom, clampNumber(raw, safeFrom + step, max, safeTo, step, min))
  }

  return (
    <div>
      <SectionLabel>Select {options.unitName || 'value'} range</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label htmlFor="order-range-from" style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>
            Current {options.unitName || 'value'}
          </label>
          <SliderNumberInput
            id="order-range-from"
            min={min}
            max={safeTo - step}
            step={step}
            stepBase={min}
            value={safeFrom}
            onChange={updateFrom}
            style={sliderNumberInputStyle}
          />
        </div>
        <div>
          <label htmlFor="order-range-to" style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>
            Target {options.unitName || 'value'}
          </label>
          <SliderNumberInput
            id="order-range-to"
            min={safeFrom + step}
            max={max}
            step={step}
            stepBase={min}
            value={safeTo}
            onChange={updateTo}
            style={sliderNumberInputStyle}
          />
        </div>
      </div>
      <SliderTrack min={min} max={max} start={safeFrom} end={safeTo}>
        <input
          className="order-range-input"
          type="range"
          aria-label={`Current ${options.unitName || 'value'}`}
          min={min}
          max={max}
          step="any"
          value={safeFrom}
          onChange={e => updateFrom(e.target.value)}
          style={{ zIndex: safeFrom > max - 3 ? 4 : 3 }}
        />
        <input
          className="order-range-input"
          type="range"
          aria-label={`Target ${options.unitName || 'value'}`}
          min={min}
          max={max}
          step="any"
          value={safeTo}
          onChange={e => updateTo(e.target.value)}
          style={{ zIndex: 3 }}
        />
      </SliderTrack>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '11px' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

const sliderNumberInputStyle = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: '10px', padding: '11px 13px', color: '#fff', fontSize: '16px',
  fontWeight: '700', fontFamily: 'var(--font-montserrat)', outline: 'none',
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
