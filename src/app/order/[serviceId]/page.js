import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import OrderForm from '@/components/OrderForm'

export default async function OrderPage({ params }) {
  const { serviceId } = await params

  const service = await prisma.service.findUnique({
    where: { id: parseInt(serviceId) },
    include: { game: true },
  })

  if (!service) return notFound()

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <div style={{
        position: 'relative',
        height: '180px',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}>
        {service.game.bannerImage && (
          <img src={service.game.bannerImage} alt={service.game.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 20%, #0a0a0a 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'flex-end',
        }}>
          <Container style={{ paddingBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <a href="/" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>Home</a>
              <span style={{ color: 'var(--text-dim)' }}>/</span>
              <a href={`/games/${service.game.slug}`} style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
                {service.game.name}
              </a>
              <span style={{ color: 'var(--text-dim)' }}>/</span>
              <span style={{ color: 'var(--gold)', fontSize: '13px' }}>{service.name}</span>
            </div>
            <h1 className="h2" style={{ color: '#fff' }}>{service.name}</h1>
          </Container>
        </div>
      </div>

      <Container style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div className="content-sidebar-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {service.description && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '28px',
              }}>
                <h2 className="h3" style={{ color: '#fff', marginBottom: '16px' }}>
                  {service.game.name} — {service.name}
                </h2>
                <p className="body-default" style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
                  {service.description}
                </p>
              </div>
            )}

            {service.features && service.features.length > 0 && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '28px',
              }}>
                <h2 className="h3" style={{ color: '#fff', marginBottom: '16px' }}>
                  What will you get?
                </h2>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {service.features.map((f, i) => (
                    <li key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6',
                    }}>
                      <span style={{ color: 'var(--gold)', marginTop: '2px', flexShrink: 0 }}>◆</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '28px',
            }}>
              <h2 className="h3" style={{ color: '#fff', marginBottom: '16px' }}>Delivery Method</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: '🎮', title: 'Piloted', desc: 'A booster will log into your account to complete the service.' },
                  { icon: '🤝', title: 'Self-play (Carry)', desc: 'You play alongside our booster team. No account sharing required.' },
                  { icon: '🛡', title: 'VPN Protection', desc: 'Every operation is performed with region-specific VPN protection.' },
                ].map(item => (
                  <div key={item.title} style={{
                    display: 'flex', gap: '14px', alignItems: 'flex-start',
                    padding: '14px', background: 'var(--bg-elevated)',
                    borderRadius: '10px', border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{
                        fontSize: '14px', fontWeight: '600', color: '#fff',
                        fontFamily: 'var(--font-montserrat)', marginBottom: '3px',
                      }}>{item.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ position: 'sticky', top: '80px' }}>
            <OrderForm service={JSON.parse(JSON.stringify(service))} />
          </div>
        </div>
      </Container>

      <Footer />
    </main>
  )
}