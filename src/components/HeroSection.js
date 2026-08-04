'use client'
import Link from 'next/link'

export default function HeroSection() {
  function openGamesMenu(e) {
    e.stopPropagation()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.dispatchEvent(new Event('open-games-menu'))
  }

  return (
    <section className="container" style={{
      textAlign: 'center',
      paddingTop: '72px',
      paddingBottom: '48px',
    }}>
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
        Level up your game with our professional boost team. Safe, fast, and guaranteed.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '32px' }}>
        <Link href="/games" style={{ textDecoration: 'none' }}>
          <button className="btn-primary">Get Started</button>
        </Link>
        <button className="btn-secondary" onClick={openGamesMenu}>View Services</button>
      </div>
    </section>
  )
}
