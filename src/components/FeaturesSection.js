import Reveal from './motion/Reveal'

const features = [
  {
    icon: '⚡',
    title: 'Speed',
    desc: 'Orders are completed within 1–3 hours on average. Even during peak hours, orders are processed automatically and seamlessly.',
  },
  {
    icon: '🛡',
    title: 'Security',
    desc: 'All operations are monitored with advanced protection systems. Your data is encrypted and never shared with third parties.',
  },
  {
    icon: '🌐',
    title: 'VPN',
    desc: 'We provide the most suitable region-specific connection for every game. Custom VPN routing available upon request.',
  },
  {
    icon: '💰',
    title: 'Money-Back Guarantee',
    desc: 'If there is an issue with your order, unconditional support is provided. Full refund for incorrect or incomplete deliveries.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="container" style={{
      paddingBottom: '48px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
      }}>
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <div className="hover-gold-border" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 className="h4" style={{ color: '#fff', marginBottom: '8px' }}>{f.title}</h3>
              <p className="body-small" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}