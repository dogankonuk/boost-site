export default function TrustSection() {
  return (
    <section style={{ padding: '0 32px 48px' ,
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
     }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '28px', color: 'var(--gold)', letterSpacing: '4px', marginBottom: '12px' }}>
          ★★★★★
        </div>
        <div className="h3" style={{ color: 'var(--gold)', marginBottom: '6px' }}>
          4.9 / 5 Thrust Score
        </div>
        <div className="body-default" style={{ color: 'var(--text-muted)' }}>
          12.000+ oyuncu tarafından güveniliyor
        </div>
      </div>
    </section>
  )
}