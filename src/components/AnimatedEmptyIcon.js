'use client'
import { motion, useReducedMotion } from 'framer-motion'

// A small self-contained "empty state" animation — no external asset needed,
// just a gently floating, glowing icon that matches the site's gold/dark theme.
export default function AnimatedEmptyIcon({ icon = '📦', size = 64 }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={shouldReduceMotion ? { y: 0 } : { y: [0, -10, 0] }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.16), transparent 70%)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4,
        margin: '0 auto 20px',
      }}
    >
      {icon}
    </motion.div>
  )
}
