'use client'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import EmberParticles from './EmberParticles'

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion()

  function openGamesMenu(e) {
    e.stopPropagation()
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' })
    window.dispatchEvent(new Event('open-games-menu'))
  }

  return (
    <section className="container hero-section">
      <EmberParticles />
      <motion.div
        className="hero-content"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <p className="hero-eyebrow">Game boosting, made clear</p>
        <h1 className="hero-title" style={{ textTransform: 'uppercase' }}>
          Your best support<br />
          <span style={{ color: 'var(--gold)' }}>behind the shadows</span>
        </h1>
        <p className="body-large" style={{
          color: 'var(--text-muted)',
          marginTop: '20px',
          maxWidth: '480px',
          margin: '20px auto 0',
        }}>
          Vetted boosters, VPN-protected sessions, and live order tracking — so your account stays exactly as safe as it should.
        </p>
        <div className="hero-actions">
          <Link href="/games" className="btn-primary">Browse Boosts</Link>
          <button className="btn-secondary" onClick={openGamesMenu}>Browse Games</button>
        </div>
        <ul className="hero-assurances" aria-label="Service highlights">
          <li>Live order tracking</li>
          <li>VPN-protected sessions</li>
          <li>Flexible service options</li>
        </ul>
      </motion.div>
    </section>
  )
}
