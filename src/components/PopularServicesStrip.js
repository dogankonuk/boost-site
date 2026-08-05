'use client'
import Link from 'next/link'
import { useCurrency } from '@/context/CurrencyContext'
import Reveal from './motion/Reveal'

export default function PopularServicesStrip({ services }) {
  const { format } = useCurrency()
  if (!services || services.length === 0) return null

  return (
    <section style={{ padding: '0 0 48px' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <span style={{ fontSize: '20px' }}>🔥</span>
          <h2 className="h3" style={{ color: '#fff' }}>Popular This Week</h2>
        </div>

        <div className="themed-scrollbar" style={{
          display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px',
        }}>
          {services.map((service, i) => (
            <Reveal key={service.id} delay={i * 0.05} y={12} style={{ flexShrink: 0 }}>
            <Link href={`/order/${service.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                width: '220px', borderRadius: '14px', overflow: 'hidden',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                transition: 'border-color 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{
                  height: '110px', position: 'relative',
                  background: (service.imageUrl || service.game?.coverImage)
                    ? `url(${service.imageUrl || service.game.coverImage}) center/cover`
                    : 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(147,51,234,0.15))',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.75) 100%)' }} />
                  <span style={{
                    position: 'absolute', top: '8px', left: '8px',
                    fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '20px',
                    background: 'linear-gradient(90deg, var(--gold), #ffdd77)', color: '#0a0a0a',
                    fontFamily: 'var(--font-montserrat)',
                  }}>🔥 HOT</span>
                  {!(service.imageUrl || service.game?.coverImage) && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', opacity: 0.3 }}>🎮</div>
                  )}
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '3px' }}>{service.game?.name}</div>
                  <div style={{
                    fontSize: '13px', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-montserrat)',
                    marginBottom: '8px', lineHeight: '1.3',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{service.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>from</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
                    {format(service.basePrice)}
                  </div>
                </div>
              </div>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
