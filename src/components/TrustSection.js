export default function TrustSection() {
  return (
    <section className="container" style={{ paddingBottom: '48px' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '28px', color: 'var(--gold)', letterSpacing: '4px', marginBottom: '12px' }}>
          ★★★★★
        </div>
        <div className="h3" style={{ color: 'var(--gold)', marginBottom: '6px' }}>
          4.9 / 5 Trust Score
        </div>
        <div className="body-default" style={{ color: 'var(--text-muted)' }}>
          Trusted by 12,000+ players worldwide
        </div>
      </div>
    </section>
  )
}