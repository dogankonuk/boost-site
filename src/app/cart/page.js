'use client'
import { useState, useSyncExternalStore } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import { GamepadIcon } from '@/components/BrandIcons'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { authFetch } from '@/lib/authFetch'
import { celebrate } from '@/lib/celebrate'
import { trackEvent } from '@/lib/analytics'
import { buildCheckoutError } from '@/lib/cartCheckout'
import { round2 } from '@/lib/pricing'
import AnimatedEmptyIcon from '@/components/AnimatedEmptyIcon'

function discountBadge(source, label, couponCode) {
  if (source === 'campaign') return { bg: 'rgba(147,51,234,0.15)', color: 'var(--violet)', label: `🔥 ${label || 'Campaign'}` }
  if (source === 'loyalty') return { bg: 'rgba(245,197,24,0.15)', color: 'var(--gold)', label: `⭐ ${label || 'Loyalty'}` }
  return { bg: 'rgba(245,197,24,0.15)', color: 'var(--gold)', label: `🏷️ ${couponCode || 'Coupon'}` }
}

function subscribeToAuth(onChange) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function getAuthSnapshot() {
  return Boolean(localStorage.getItem('token'))
}

function getServerAuthSnapshot() {
  return false
}

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, clearCart, totalUSD, hydrated } = useCart()
  const { format } = useCurrency()
  const loggedIn = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getServerAuthSnapshot)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponPreview, setCouponPreview] = useState(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [listRef] = useAutoAnimate()

  // Folds the coupon preview (if it beats an item's already-baked-in
  // loyalty/campaign discount) into what that item would actually cost.
  function itemDisplay(item) {
    const couponResult = couponPreview?.perItem?.[item.cartId]
    const existingDiscount = item.discountAmount || 0
    if (couponResult?.ok && couponResult.discountAmount > existingDiscount) {
      const original = item.originalPrice ?? item.price
      return {
        price: round2(Math.max(0, original - couponResult.discountAmount)),
        originalPrice: original,
        discountAmount: couponResult.discountAmount,
        discountSource: 'coupon',
      }
    }
    return { price: item.price, originalPrice: item.originalPrice, discountAmount: existingDiscount, discountSource: item.discountSource, discountLabel: item.discountLabel }
  }

  const displayTotal = items.reduce((sum, item) => sum + itemDisplay(item).price, 0)
  const originalTotal = items.reduce((sum, item) => sum + (item.originalPrice ?? item.price), 0)
  const totalSavings = round2(Math.max(0, originalTotal - displayTotal))

  async function applyCoupon() {
    const code = couponCode.trim()
    if (!code) return
    setApplyingCoupon(true)
    setCouponError('')
    try {
      const results = await Promise.all(items.map(async item => {
        try {
          const res = await authFetch('/api/coupons', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'validate', code, serviceId: item.serviceId, selection: item.selection }),
          })
          if (!res) return { cartId: item.cartId, ok: false, error: 'Could not connect to the server.' }
          const d = await res.json()
          return d.success
            ? { cartId: item.cartId, ok: true, discountAmount: d.data.discountAmount }
            : { cartId: item.cartId, ok: false, error: d.error }
        } catch {
          return { cartId: item.cartId, ok: false, error: 'Could not connect to the server.' }
        }
      }))
      const eligible = results.filter(r => r.ok)
      if (eligible.length === 0) {
        setCouponError(results[0]?.error || 'This coupon is not valid for anything in your cart.')
        setCouponPreview(null)
      } else {
        setCouponPreview({ code, perItem: Object.fromEntries(results.map(r => [r.cartId, r])) })
        toast.success(`Coupon applied: ${code}`)
      }
    } catch {
      setCouponError('Could not connect to the server.')
    }
    setApplyingCoupon(false)
  }

  function removeCoupon() {
    setCouponCode('')
    setCouponPreview(null)
    setCouponError('')
  }

  async function handleCheckout() {
    if (!loggedIn) { router.push('/login'); return }
    setCheckingOut(true)
    setError('')
    trackEvent('begin_checkout', {
      value: totalUSD,
      currency: 'USD',
      items: items.map(i => ({ item_id: i.serviceId, item_name: i.serviceName, item_category: i.gameName })),
      coupon: couponPreview?.code || undefined,
    })

    const failed = []
    let placedCount = 0

    for (const item of items) {
      // Only send the coupon for items it was actually validated against —
      // sending it for an ineligible one (e.g. wrong game) would fail that
      // order outright instead of just skipping the discount for it.
      const itemCoupon = couponPreview?.perItem?.[item.cartId]?.ok ? couponPreview.code : undefined
      try {
        const res = await authFetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: item.serviceId,
            details: { note: item.note, selection: item.selection, selectedAddons: item.selectedAddons, calculatedPrice: item.price },
            couponCode: itemCoupon,
          }),
        })
        if (!res) return
        const d = await res.json()
        if (d.success) {
          placedCount += 1
          trackEvent('purchase', {
            transaction_id: d.data.orderNumber,
            value: d.data.price,
            currency: 'USD',
            items: [{ item_id: item.serviceId, item_name: item.serviceName, item_category: item.gameName }],
            coupon: itemCoupon,
          })
          removeItem(item.cartId)
        } else {
          failed.push({ name: item.serviceName, reason: d.error || 'The order could not be created.' })
        }
      } catch {
        failed.push({ name: item.serviceName, reason: 'Could not connect to the server.' })
      }
    }

    setCheckingOut(false)

    if (failed.length === 0) {
      celebrate()
      toast.success('Order placed!')
      router.push('/dashboard')
    } else {
      const msg = buildCheckoutError(failed, placedCount)
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <Container style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <h1 className="h2" style={{ color: '#fff', marginBottom: '24px' }}>Cart</h1>

        {!hydrated ? null : items.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '60px', textAlign: 'center',
          }}>
            <AnimatedEmptyIcon icon="🛒" />
            <p className="body-large" style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Your cart is empty.
            </p>
            <Link href="/games" className="btn-primary">Browse Services</Link>
          </div>
        ) : (
          <div className="content-sidebar-grid" style={{ '--sidebar-width': '340px', '--sidebar-gap': '24px' }}>
            <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map(item => {
                const display = itemDisplay(item)
                const badge = display.discountAmount > 0 ? discountBadge(display.discountSource, display.discountLabel, couponPreview?.code) : null
                const discountPct = display.discountAmount > 0 ? Math.round((display.discountAmount / display.originalPrice) * 100) : 0
                return (
                <div key={item.cartId} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                  {item.imageUrl ? (
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '10px', flexShrink: 0,
                      backgroundImage: `url(${item.imageUrl})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      border: '1px solid var(--border)',
                    }} />
                  ) : (
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '10px',
                      background: 'var(--bg-elevated)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', border: '1px solid var(--border)',
                    }}><GamepadIcon size={30} /></div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>
                      {item.serviceName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.gameName}
                      {item.selectionSummary && ` · ${item.selectionSummary}`}
                    </div>
                    {item.note && (
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', fontStyle: 'italic' }}>
                        “{item.note}”
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {display.discountAmount > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                        {format(display.originalPrice)}
                      </div>
                    )}
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
                      {format(display.price)}
                    </div>
                    {badge && (
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                        whiteSpace: 'nowrap',
                        background: badge.bg, color: badge.color,
                      }}>{badge.label} -{discountPct}%</span>
                    )}
                    <button type="button" aria-label={`Remove ${item.serviceName} from cart`}
                      onClick={() => { removeItem(item.cartId); toast('Removed from cart', { icon: '🗑️' }) }} style={{
                      background: 'none', border: 'none', color: 'var(--text-dim)',
                      fontSize: '12px', cursor: 'pointer', padding: '8px 6px', minHeight: '36px',
                      transition: 'color 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ff6666'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                )
              })}
            </div>

            <div style={{
              position: 'sticky', top: '80px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', overflow: 'hidden',
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px',
                  fontFamily: 'var(--font-montserrat)', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  Order Summary
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                </div>
                {totalSavings > 0 && (
                  <div style={{ fontSize: '15px', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                    {format(originalTotal)}
                  </div>
                )}
                <div style={{ fontSize: '30px', fontWeight: '700', fontFamily: 'var(--font-montserrat)', color: 'var(--gold)' }}>
                  {format(displayTotal)}
                </div>
                <div style={{ fontSize: '11px', color: totalSavings > 0 ? 'var(--gold)' : 'var(--text-dim)', marginTop: '3px', fontWeight: totalSavings > 0 ? '700' : '400' }}>
                  {totalSavings > 0 ? `You save ${format(totalSavings)}` : 'No discounts applied'}
                </div>
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {couponPreview ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                    background: 'rgba(245,197,24,0.08)', border: '1px solid var(--gold)',
                    borderRadius: '8px', padding: '9px 12px',
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '600' }}>
                      🏷️ {couponPreview.code} applied
                    </span>
                    <button type="button" onClick={removeCoupon} style={{
                      background: 'none', border: 'none', color: 'var(--text-dim)',
                      fontSize: '12px', cursor: 'pointer', padding: 0,
                    }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="cart-coupon-code" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Coupon code (optional)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="cart-coupon-code"
                        aria-describedby="cart-coupon-help"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        placeholder="e.g. WELCOME10"
                        style={{
                          flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                          borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '13px',
                          fontFamily: 'var(--font-inter)', outline: 'none', textTransform: 'uppercase',
                        }}
                      />
                      <button type="button" onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()} className="btn-secondary"
                        style={{ minHeight: '40px', padding: '9px 16px', fontSize: '13px', flexShrink: 0, opacity: (applyingCoupon || !couponCode.trim()) ? 0.6 : 1 }}>
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    <p id="cart-coupon-help" style={{
                      fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.5', marginTop: '6px',
                    }}>
                      Applies to whichever cart items it&apos;s eligible for — each still gets whichever discount is best for it.
                    </p>
                    {couponError && (
                      <p role="alert" style={{ fontSize: '11px', color: '#ff6666', marginTop: '5px' }}>{couponError}</p>
                    )}
                  </div>
                )}
                {error && (
                  <div role="alert" style={{ background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#ff6666', fontSize: '12px', lineHeight: '1.5' }}>
                    {error}
                  </div>
                )}
                <button className="btn-primary" onClick={handleCheckout} disabled={checkingOut}
                  style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: checkingOut ? 0.7 : 1 }}>
                  {checkingOut ? 'Placing orders...' : loggedIn ? 'Checkout' : 'Sign In to Checkout'}
                </button>
                <button type="button" onClick={() => {
                  if (!confirmClear) { setConfirmClear(true); return }
                  clearCart()
                  setConfirmClear(false)
                  toast('Cart cleared')
                }} className="btn-secondary" style={{
                  width: '100%', padding: '12px', fontSize: '13px',
                  color: confirmClear ? '#ff8a8a' : undefined,
                  borderColor: confirmClear ? '#7a3030' : undefined,
                }}>
                  {confirmClear ? 'Confirm Clear Cart' : 'Clear Cart'}
                </button>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', lineHeight: '1.6' }}>
                  Each item becomes a separate order once you check out.
                </p>
              </div>
            </div>
          </div>
        )}
      </Container>

      <Footer />
    </main>
  )
}
