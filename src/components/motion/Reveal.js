'use client'
import { motion, useReducedMotion } from 'framer-motion'

export default function Reveal({ children, delay = 0, y = 24, className, style }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      style={style}
      initial={shouldReduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
