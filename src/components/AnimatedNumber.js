'use client'
import { useEffect, useRef } from 'react'
import { CountUp } from 'countup.js'

// Drives countup.js directly against a ref rather than going through
// react-countup's React wrapper component/hook, which didn't reliably
// trigger the animation in this project's setup.
export default function AnimatedNumber({ end, decimals = 0, duration = 1.2, prefix = '', suffix = '', separator = ',' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const countUp = new CountUp(ref.current, end, {
      decimalPlaces: decimals, duration, prefix, suffix, separator,
    })
    if (!countUp.error) countUp.start()
    return () => countUp.onDestroy?.()
  }, [end, decimals, duration, prefix, suffix, separator])

  return <span ref={ref} />
}
