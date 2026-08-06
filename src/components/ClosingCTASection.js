import Link from 'next/link'
import Reveal from './motion/Reveal'

// A visitor who scrolls all the way through games, features, blog,
// testimonials, FAQ, and trust score has no CTA left except scrolling back
// to the hero. This repeats the primary action at the point of maximum
// built trust, right before the footer.
export default function ClosingCTASection() {
  return (
    <section className="container" style={{ paddingBottom: '56px' }}>
      <Reveal>
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,197,24,0.08), rgba(147,51,234,0.08))',
          border: '1px solid var(--border)', borderRadius: '20px',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <h2 className="h3" style={{ color: '#fff', marginBottom: '10px' }}>Ready to level up?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', maxWidth: '420px', margin: '0 auto 24px' }}>
            Pick your game and get a vetted booster on your order within 15–30 minutes.
          </p>
          <Link href="/games" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ padding: '12px 32px' }}>Browse Boosts</button>
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
