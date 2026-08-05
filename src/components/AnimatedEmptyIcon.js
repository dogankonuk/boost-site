'use client'
import { motion } from 'framer-motion'

// A small self-contained "empty state" animation — no external asset needed,
// just a gently floating, glowing icon that matches the site's gold/dark theme.
export default function AnimatedEmptyIcon({ icon = '📦', size = 64 }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
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
