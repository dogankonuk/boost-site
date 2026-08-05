import Reveal from './motion/Reveal'

export default function TrustSection() {
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
            ★★★★★
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', marginBottom: '4px' }}>
            4.9 / 5 Trust Score
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Trusted by 12,000+ players worldwide
          </div>
        </div>
      </Reveal>
    </section>
  )
}