'use client'
import { useEffect } from 'react'

// Renders nothing — just pings the view-count endpoint once when the page
// actually mounts in a browser, which prefetching doesn't trigger.
export default function ViewTracker({ slug }) {
  useEffect(() => {
    fetch('/api/blog/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {})
  }, [slug])

  return null
}
