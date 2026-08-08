'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useReducedMotion } from 'framer-motion'

const EmberParticlesCanvas = dynamic(() => import('./EmberParticlesCanvas'), {
  ssr: false,
  loading: () => null,
})

const AMBIENT_EFFECTS_QUERY = '(min-width: 769px) and (hover: hover) and (pointer: fine)'

export default function EmberParticles() {
  const shouldReduceMotion = useReducedMotion()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (shouldReduceMotion) return

    const mediaQuery = window.matchMedia(AMBIENT_EFFECTS_QUERY)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    let idleId
    let timeoutId

    function connectionAllowsEffects() {
      return !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType)
    }

    function scheduleEnable() {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => setEnabled(true), { timeout: 1800 })
      } else {
        timeoutId = window.setTimeout(() => setEnabled(true), 700)
      }
    }

    function cancelScheduledEnable() {
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      idleId = undefined
      timeoutId = undefined
    }

    function handleCapabilityChange() {
      cancelScheduledEnable()
      if (mediaQuery.matches && connectionAllowsEffects()) scheduleEnable()
      else setEnabled(false)
    }

    if (mediaQuery.matches && connectionAllowsEffects()) scheduleEnable()
    mediaQuery.addEventListener('change', handleCapabilityChange)
    connection?.addEventListener?.('change', handleCapabilityChange)

    return () => {
      mediaQuery.removeEventListener('change', handleCapabilityChange)
      connection?.removeEventListener?.('change', handleCapabilityChange)
      cancelScheduledEnable()
    }
  }, [shouldReduceMotion])

  return enabled && !shouldReduceMotion ? <EmberParticlesCanvas /> : null
}
