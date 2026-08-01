'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { authFetch } from '@/lib/authFetch'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, clearCart, totalUSD, hydrated } = useCart()
  const { format } = useCurrency()
  const [loggedIn, setLoggedIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'))
  }, [])

  async function handleCheckout() {
    if (!loggedIn) { router.push('/login'); return }
    setCheckingOut(true)
    setError('')

    const failed = []

    for (const item of items) {
      try {
        const res = await authFetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: item.serviceId,
            details: { note: item.note, selection: item.selection, calculatedPrice: item.price },
          }),
        })
        if (!res) return
        const d = await res.json()
        if (d.success) {
          removeItem(item.cartId)
        } else {
          failed.push(item.serviceName)
        }
      } catch {
        failed.push(item.serviceName)
      }
    }

    setCheckingOut(false)

    if (failed.length === 0) {
      router.push('/dashboard')
    } else {
      setError(`Could not place order for: ${failed.join(', ')}. The rest were ordered successfully.`)
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
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>🛒</div>
            <p className="body-large" style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Your cart is empty.
            </p>
            <Link href="/games" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">Browse Services</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map(item => (
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
                    }}>🎮</div>
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

                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
                      {format(item.price)}
                    </div>
                    <button onClick={() => removeItem(item.cartId)} style={{
                      background: 'none', border: 'none', color: 'var(--text-dim)',
                      fontSize: '12px', cursor: 'pointer', padding: 0,
                      transition: 'color 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ff6666'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
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
                <div style={{ fontSize: '30px', fontWeight: '800', fontFamily: 'var(--font-montserrat)', color: 'var(--gold)' }}>
                  {format(totalUSD)}
                </div>
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {error && (
                  <div style={{ background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#ff6666', fontSize: '12px', lineHeight: '1.5' }}>
                    {error}
                  </div>
                )}
                <button className="btn-primary" onClick={handleCheckout} disabled={checkingOut}
                  style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: checkingOut ? 0.7 : 1 }}>
                  {checkingOut ? 'Placing orders...' : loggedIn ? 'Checkout' : 'Sign In to Checkout'}
                </button>
                <button onClick={clearCart} className="btn-secondary" style={{ width: '100%', padding: '12px', fontSize: '13px' }}>
                  Clear Cart
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
