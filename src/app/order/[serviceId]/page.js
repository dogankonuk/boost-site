import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import OrderForm from '@/components/OrderForm'

const getService = cache(async (serviceId) => {
  return prisma.service.findUnique({
    where: { id: parseInt(serviceId) },
    include: { game: true },
  })
})

export async function generateMetadata({ params }) {
  const { serviceId } = await params
  const service = await getService(serviceId)
  if (!service) return { title: 'Service Not Found' }

  const description = service.description
    || `${service.name} for ${service.game?.name}. Starting at $${service.basePrice}. Safe, fast, and guaranteed delivery.`

  return {
    title: `${service.name} — ${service.game?.name}`,
    description,
    openGraph: {
      title: `${service.name} — ${service.game?.name} | ShadowBoosting.co`,
      description,
      images: service.imageUrl || service.game?.bannerImage ? [service.imageUrl || service.game.bannerImage] : undefined,
    },
  }
}

export default async function OrderPage({ params }) {
  const { serviceId } = await params
  const service = await getService(serviceId)

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

        {/* Ürün görseli + rozetler + güven/süre kartı */}
        <div className="order-hero-row" style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <div style={{
            position: 'relative', flex: '1.4 1 320px', minHeight: '220px', borderRadius: '18px',
            overflow: 'hidden', border: '1px solid var(--border)',
            background: (service.imageUrl || service.game.coverImage)
              ? `url(${service.imageUrl || service.game.coverImage}) center/cover`
              : 'linear-gradient(135deg, rgba(245,197,24,0.12), rgba(147,51,234,0.12))',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.75) 0%, transparent 55%)' }} />
            {!(service.imageUrl || service.game.coverImage) && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.35 }}>🎮</div>
            )}
            <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Fast Delivery', '100% Safe & Secure'].map(tag => (
                <span key={tag} style={{
                  fontSize: '11px', fontWeight: '700', padding: '5px 12px', borderRadius: '20px',
                  background: 'linear-gradient(90deg, var(--gold), #ffdd77)', color: '#0a0a0a',
                  fontFamily: 'var(--font-montserrat)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', width: 'fit-content',
                }}>{tag}</span>
              ))}
            </div>
          </div>

          <div style={{
            flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '14px', padding: '18px 20px', flex: 1,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <div style={{ color: 'var(--gold)', fontSize: '15px', letterSpacing: '2px', marginBottom: '6px' }}>★★★★★</div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600', marginBottom: '2px' }}>4.9 / 5 Trust Score</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trusted by 12,000+ players worldwide</div>
            </div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '14px', padding: '16px 20px', display: 'flex', gap: '20px',
            }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>15–30 min</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Estimated Start Time</div>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>Flexible</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Completion Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Güven rozeti şeridi */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px',
        }}>
          {[
            { icon: '↩️', label: 'Easy Refunds' },
            { icon: '💬', label: '24/7 Support' },
            { icon: '🛡️', label: 'Guaranteed Safety' },
            { icon: '✅', label: 'Complete Satisfaction' },
          ].map(b => (
            <div key={b.label} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 14px', borderRadius: '20px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)', fontWeight: '600',
            }}>
              <span>{b.icon}</span>{b.label}
            </div>
          ))}
        </div>

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

            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '28px',
            }}>
              <h2 className="h3" style={{ color: '#fff', marginBottom: '16px' }}>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[
                  { q: 'How soon do we start?', a: 'A professional booster is typically ready to begin within 15–30 minutes of your purchase. Slight delays are possible during periods of unusually high demand.' },
                  { q: 'How long will it take?', a: 'Completion time depends on the scope you’ve selected. Most orders are finished within a few hours to a few days — you can always track live progress from your dashboard.' },
                  { q: 'Can I play my account myself during the boost?', a: 'Yes — choose the Self-play (Carry) delivery method to play alongside our booster team. No account sharing required.' },
                ].map(item => (
                  <div key={item.q}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)', marginBottom: '5px' }}>
                      {item.q}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                      {item.a}
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