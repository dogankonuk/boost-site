'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useReducedMotion } from 'framer-motion'
import { useCurrency } from '@/context/CurrencyContext'
import useFinePointer from '@/hooks/useFinePointer'
import Reveal from './motion/Reveal'
import AdaptiveTilt from './AdaptiveTilt'
import { FlameIcon, GamepadIcon } from './BrandIcons'

export default function PopularServicesStrip({ services }) {
  const { format } = useCurrency()
  const shouldReduceMotion = useReducedMotion()
  const tiltEnabled = useFinePointer() && !shouldReduceMotion
  if (!services || services.length === 0) return null

  return (
    <section style={{ padding: '0 0 48px' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <span style={{ color: 'var(--gold)', display: 'flex' }}><FlameIcon size={20} /></span>
          <h2 className="h3" style={{ color: '#fff' }}>Popular This Week</h2>
        </div>

        <div className="themed-scrollbar" style={{
          display: 'flex', gap: '14px', overflowX: 'auto', overflowY: 'hidden',
          paddingBottom: '8px', WebkitOverflowScrolling: 'touch',
        }}>
          {services.map((service, i) => (
            <Reveal key={service.id} delay={i * 0.05} y={12} style={{ flexShrink: 0 }}>
            <Link href={`/order/${service.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <AdaptiveTilt
                enabled={tiltEnabled}
                tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.04} transitionSpeed={1200}
                glareEnable glareMaxOpacity={0.2} glareColor="#f5c518" glarePosition="all"
                glareBorderRadius="14px" tiltReverse
                style={{ width: '220px' }}
              >
              <div style={{
                width: '220px', borderRadius: '14px', overflow: 'hidden',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div style={{
                  height: '110px', position: 'relative',
                  background: 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(147,51,234,0.15))',
                }}>
                  {(service.imageUrl || service.game?.coverImage) && (
                    <Image
                      src={service.imageUrl || service.game.coverImage}
                      alt={service.name}
                      fill
                      sizes="220px"
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.75) 100%)' }} />
                  <span style={{
                    position: 'absolute', top: '8px', left: '8px',
                    fontSize: '9px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
                    background: 'linear-gradient(90deg, var(--gold), var(--gold-soft))', color: '#0a0a0a',
                    fontFamily: 'var(--font-montserrat)',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}><FlameIcon size={10} /> HOT</span>
                  {!(service.imageUrl || service.game?.coverImage) && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', opacity: 0.3 }}><GamepadIcon size={28} /></div>
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
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)' }}>
                    {format(service.basePrice)}
                  </div>
                </div>
              </div>
              </AdaptiveTilt>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
