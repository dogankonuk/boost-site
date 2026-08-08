'use client'

import { useEffect, useState } from 'react'

export default function AdaptiveTilt({ enabled, children, style, ...tiltProps }) {
  const [TiltComponent, setTiltComponent] = useState(null)

  useEffect(() => {
    if (!enabled || TiltComponent) return

    let active = true
    import('react-parallax-tilt').then(module => {
      if (active) setTiltComponent(() => module.default)
    }).catch(() => {})

    return () => { active = false }
  }, [enabled, TiltComponent])

  if (!enabled || !TiltComponent) {
    return <div style={style}>{children}</div>
  }

  return <TiltComponent style={style} {...tiltProps}>{children}</TiltComponent>
}
