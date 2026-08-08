'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { sanitizeCartItems } from '@/lib/cartStorage'

const CartContext = createContext(null)
const STORAGE_KEY = 'sb_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage once on mount
  useEffect(() => {
    let cancelled = false

    async function hydrateCart() {
      await Promise.resolve()
      if (cancelled) return

      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) setItems(sanitizeCartItems(JSON.parse(raw)))
      } catch {
        // Invalid or unavailable storage should behave like an empty cart.
      }
      setHydrated(true)
    }

    hydrateCart()
    return () => { cancelled = true }
  }, [])

  // Persist on every change (but not before the initial load finishes,
  // or we'd overwrite the saved cart with an empty array)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // The in-memory cart remains usable when storage is unavailable.
    }
  }, [items, hydrated])

  // item: { serviceId, serviceName, gameName, gameSlug, imageUrl, priceLabel, options, selection, price, note }
  const addItem = useCallback((item) => {
    setItems(prev => [...prev, { ...item, cartId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }])
  }, [])

  const removeItem = useCallback((cartId) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const count = items.length
  // Prices in cart items are stored in USD (the base currency), same as everywhere else.
  const totalUSD = items.reduce((sum, i) => sum + (i.price || 0), 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, count, totalUSD, hydrated }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
