import Container from '@/components/Container'

// Shared "zone" banner for listing pages — the accent color doubles as
// wayfinding (gold = commerce/games, violet = content/blog) rather than
// pure decoration, and the diagonal hairline texture echoes the blog
// cover art so both areas read as the same visual system.
export default function PageHeader({ eyebrow, title, subtitle, accent = 'gold', right }) {
  const accentColor = accent === 'violet' ? 'var(--violet)' : 'var(--gold)'
  const glow = accent === 'violet' ? 'rgba(147,51,234,0.18)' : 'rgba(245,197,24,0.16)'

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)',
      background: 'var(--bg-elevated)', padding: '44px 0 34px',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 520px 320px at 10% 0%, ${glow}, transparent 65%)`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
        backgroundImage: `repeating-linear-gradient(115deg, ${accentColor} 0px, ${accentColor} 1px, transparent 1px, transparent 46px)`,
      }} />

      <Container style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            {eyebrow && (
              <div style={{
                fontFamily: 'var(--font-montserrat)', fontSize: '11px', fontWeight: '700',
                letterSpacing: '0.12em', textTransform: 'uppercase', color: accentColor, marginBottom: '8px',
              }}>
                {eyebrow}
              </div>
            )}
            <h1 className="h1" style={{ color: '#fff', marginBottom: subtitle ? '8px' : 0 }}>{title}</h1>
            {subtitle && (
              <p className="body-default" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
            )}
          </div>
          {right}
        </div>
      </Container>
    </div>
  )
}
