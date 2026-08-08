import Reveal from './motion/Reveal'

// Same line-art language as the order page's trust icons (24x24, stroke-only,
// currentColor) — reusing the shield and refund-arrow shapes verbatim so the
// two pages read as one visual system instead of two unrelated icon sets.
function BoltIcon() {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2 3 14h7l-1 8 10-12h-7z" strokeLinejoin="round" /></svg>
}
function ShieldIcon() {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3z" strokeLinejoin="round" /></svg>
}
function GlobeIcon() {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.5 4 5.8 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.8-4-9s1.5-6.5 4-9z" /></svg>
}
function GuaranteeIcon() {
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" /><path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

const features = [
  {
    icon: <BoltIcon />,
    title: 'Speed',
    desc: 'Orders are completed within 1–3 hours on average. Even during peak hours, orders are processed automatically and seamlessly.',
  },
  {
    icon: <ShieldIcon />,
    title: 'Security',
    desc: 'All operations are monitored with advanced protection systems. Your data is encrypted and never shared with third parties.',
  },
  {
    icon: <GlobeIcon />,
    title: 'VPN',
    desc: 'We provide the most suitable region-specific connection for every game. Custom VPN routing available upon request.',
  },
  {
    icon: <GuaranteeIcon />,
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
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', marginBottom: '14px',
                background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
              }}>{f.icon}</div>
              <h3 className="h4" style={{ color: '#fff', marginBottom: '8px' }}>{f.title}</h3>
              <p className="body-small" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
