'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function TrustHeroSection() {
  return (
    <section className="container" style={{
      textAlign: 'center',
      paddingTop: '72px',
      paddingBottom: '32px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div style={{
          fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)',
          fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px',
        }}>
          The #1 question we get
        </div>
        <h1 className="hero-title">
          Will this get my<br />account banned?
        </h1>
        <p className="body-large" style={{
          color: 'var(--text-muted)',
          marginTop: '20px',
          maxWidth: '520px',
          margin: '20px auto 0',
        }}>
          No — if it's done right. Here's exactly how we keep every order safe, from the booster we assign to the moment it's delivered.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
          <Link href="/games" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">Browse Boosts</button>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
