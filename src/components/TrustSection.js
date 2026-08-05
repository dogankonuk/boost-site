'use client'
import AnimatedNumber from './AnimatedNumber'
import Reveal from './motion/Reveal'

export default function TrustSection({ stats }) {
  const { avgRating, ratedCount, completedCount } = stats || {}

  if (!avgRating || ratedCount === 0) {
    return (
      <section className="container" style={{ paddingBottom: '48px' }}>
        <Reveal>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              We're just getting started — check back soon for real player reviews.
            </div>
          </div>
        </Reveal>
      </section>
    )
  }

  const filledStars = Math.round(avgRating)

  return (
    <section className="container" style={{ paddingBottom: '48px' }}>
      <Reveal>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', color: 'var(--gold)', letterSpacing: '3px', marginBottom: '6px' }}>
            {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', marginBottom: '4px' }}>
            <AnimatedNumber end={avgRating} decimals={1} duration={1.5} /> / 5 Trust Score
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Based on {ratedCount} review{ratedCount === 1 ? '' : 's'}
            {completedCount > 0 && (
              <> · <AnimatedNumber end={completedCount} suffix="+" duration={1.8} /> orders completed</>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
