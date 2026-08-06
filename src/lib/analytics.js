'use client'

// Thin wrapper around GA4's dataLayer. Safe to call unconditionally —
// no-ops until NEXT_PUBLIC_GA_MEASUREMENT_ID is set and gtag.js has loaded
// (see the conditional script in layout.js), so this never breaks local dev.
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
