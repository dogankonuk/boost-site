import Reveal from './motion/Reveal'

export default function TestimonialsSection({ testimonials = [] }) {
  if (testimonials.length === 0) return null

  return (
    <section className="container" style={{ paddingBottom: '48px' }}>
      <Reveal>
        <h2 className="h3" style={{ color: '#fff', marginBottom: '18px' }}>What Players Are Saying</h2>
      </Reveal>

      <div className="themed-scrollbar" style={{
        display: 'flex', gap: '14px', overflowX: 'auto', overflowY: 'hidden',
        paddingBottom: '10px', WebkitOverflowScrolling: 'touch',
      }}>
        {testimonials.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.05}>
            <TestimonialCard t={t} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function TestimonialCard({ t }) {
  const date = t.date
    ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '20px', width: '300px', flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: '700', color: '#0a0a0a', fontFamily: 'var(--font-montserrat)',
        }}>
          {t.author[0].toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>
            {t.author}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            {t.gameName} · {t.serviceName}
          </div>
        </div>
      </div>

      <div style={{ color: 'var(--gold)', fontSize: '12px', letterSpacing: '2px' }}>
        {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
      </div>

      <p style={{
        fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0,
        display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {t.review}
      </p>

      {date && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: 'auto' }}>{date}</div>}
    </div>
  )
}
