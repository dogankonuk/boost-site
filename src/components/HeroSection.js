export default function HeroSection() {
  return (
    <section style={{
      textAlign: 'center',
      padding: '72px 48px 48px',
      maxWidth: '1100px',
      margin: '0 auto',
      width: '100%',
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
        <button className="btn-primary">Get Started</button>
        <button className="btn-secondary">View Services</button>
      </div>
    </section>
  )
}