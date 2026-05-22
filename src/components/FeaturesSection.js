'use client'
const features = [
  {
    icon: '⚡',
    title: 'Hız',
    desc: 'İşlemleriniz ortalama 1–3 dakika içinde tamamlanır. Yoğun saatlerde bile siparişler otomatik ve kesintisiz işlenir.',
  },
  {
    icon: '🛡',
    title: 'Güvenlik',
    desc: 'Tüm işlemlerimiz gelişmiş koruma sistemleriyle izlenir. Verileriniz şifrelenir ve üçüncü taraflarla asla paylaşılmaz.',
  },
  {
    icon: '🌐',
    title: 'VPN',
    desc: 'Her oyun için bölgeye özel en uygun bağlantı çözümlerini sunuyoruz. İhtiyaç duyduğunuzda özel VPN yönlendirmesi yapılır.',
  },
  {
    icon: '💰',
    title: 'İade Garantisi',
    desc: 'Siparişinizde bir sorun olursa koşulsuz destek sağlanır. Yanlış veya eksik teslimlerde tam para iadesi yapılır.',
  },
]

export default function FeaturesSection() {
  return (
    <section style={{
        padding: '0 0 48px' ,
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        paddingLeft: '48px',
        paddingRight: '48px',
     }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
      }}>
        {features.map(f => (
          <div key={f.title} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>{f.icon}</div>
            <h3 className="h4" style={{ color: '#fff', marginBottom: '8px' }}>{f.title}</h3>
            <p className="body-small" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}