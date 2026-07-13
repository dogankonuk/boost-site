'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const CurrencyContext = createContext(null)

export const CURRENCY_SYMBOLS = { TRY: '₺', USD: '$', EUR: '€' }
const LOCALES = { TRY: 'tr-TR', USD: 'en-US', EUR: 'de-DE' }
const CACHE_KEY = 'sb_exchange_rates_v2'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('USD')
  // rates are USD -> currency multipliers, e.g. rates.TRY * priceInUSD = priceInTRY
  const [rates, setRates] = useState({ TRY: null, EUR: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sb_currency') : null
    if (saved && CURRENCY_SYMBOLS[saved]) setCurrencyState(saved)

    async function loadRates() {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.fetchedAt < CACHE_TTL && parsed.rates?.TRY && parsed.rates?.EUR) {
            setRates(parsed.rates)
            setLoading(false)
            return
          }
        }
        const res = await fetch('/api/exchange-rate')
        const d = await res.json()
        if (d.success) {
          setRates(d.rates)
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: d.rates, fetchedAt: Date.now() }))
        }
      } catch {
        // Silently fall back — convert() will just return TRY amounts if rates never load
      }
      setLoading(false)
    }
    loadRates()
  }, [])

  const setCurrency = useCallback((c) => {
    setCurrencyState(c)
    if (typeof window !== 'undefined') localStorage.setItem('sb_currency', c)
  }, [])

  // Converts an amount stored in USD into the currently selected display currency
  const convert = useCallback((amountUSD) => {
    if (amountUSD === null || amountUSD === undefined) return amountUSD
    if (currency === 'USD') return amountUSD
    const rate = rates[currency]
    if (!rate) return amountUSD // rates not loaded yet — better to show USD than crash
    return amountUSD * rate
  }, [currency, rates])

  // Converts + formats with the right symbol/locale/decimals in one go
  const format = useCallback((amountUSD) => {
    if (amountUSD === null || amountUSD === undefined) return ''
    const converted = convert(amountUSD)
    const symbol = CURRENCY_SYMBOLS[currency]
    const locale = LOCALES[currency]
    const decimals = currency === 'TRY' ? 0 : 2
    const formatted = converted.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return currency === 'TRY' ? `${formatted} ${symbol}` : `${symbol}${formatted}`
  }, [convert, currency])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, rates, loading }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider')
  return ctx
}
