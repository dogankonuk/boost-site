'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCurrency } from '@/context/CurrencyContext'

const ICON_RULES = [
  { keywords: ['level', 'leveling', 'xp', 'prestige'], icon: '📈' },
  { keywords: ['win', 'wins', 'rank', 'ranked', 'rating', 'elo', 'mmr', 'league', 'division'], icon: '🏆' },
  { keywords: ['point', 'hype', 'currency', 'gold', 'coin', 'farm', 'farming', 'kill'], icon: '💰' },
  { keywords: ['pass', 'battlepass', 'season'], icon: '👑' },
  { keywords: ['gear', 'item', 'weapon', 'loot', 'build'], icon: '💎' },
  { keywords: ['quest', 'mission', 'dungeon', 'raid', 'campaign', 'story'], icon: '🏰' },
  { keywords: ['pvp', 'arena', 'duel', 'wipe'], icon: '🥷' },
  { keywords: ['achievement', 'trophy', 'title'], icon: '🏅' },
  { keywords: ['coach', 'coaching', 'lesson', 'training', 'review'], icon: '🎯' },
  { keywords: ['account', 'unlock', 'placement'], icon: '🎮' },
]

export function getServiceIcon(service) {
  const haystack = `${service.name || ''} ${service.serviceCategory || ''}`.toLowerCase()
  const rule = ICON_RULES.find(r => r.keywords.some(k => haystack.includes(k)))
  return rule?.icon || '⚡'
}

export default function GameServices({ services, game }) {
  const manualCategories = Array.isArray(game?.serviceCategories) ? game.serviceCategories : []
  const derivedCategories = [...new Set(services.map(s => s.serviceCategory || 'Genel'))]
  const categories = manualCategories.length > 0
    ? [...manualCategories.filter(c => derivedCategories.includes(c)), ...derivedCategories.filter(c => !manualCategories.includes(c))]
    : derivedCategories

  const [active, setActive] = useState('All')

  const filtered = active === 'All'
    ? services
    : services.filter(s => (s.serviceCategory || 'Genel') === active)

  return (
    <div className="game-services-grid">
      <aside style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '18px', position: 'sticky', top: '80px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--border)',
        }}>
          {game?.coverImage ? (
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
              border: '1px solid var(--border)', overflow: 'hidden', position: 'relative',
            }}>
              <Image
                src={game.coverImage}
                alt=""
                fill
                sizes="28px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          ) : (
            <span style={{ fontSize: '18px' }}>🎮</span>
          )}
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>
            {game?.name}
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <CategoryItem label="All Services" active={active === 'All'} onClick={() => setActive('All')} />
          {categories.map(cat => (
            <CategoryItem key={cat} label={cat} active={active === cat} onClick={() => setActive(cat)} />
          ))}
        </nav>
      </aside>

      <div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <p className="body-large">No services available for this category yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 270px))',
            gap: '16px',
          }}>
            {filtered.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryItem({ label, active, onClick }) {
  return (
    <button onClick={onClick} type="button" style={{
      display: 'flex', alignItems: 'center', gap: '9px',
      padding: '9px 10px', borderRadius: '8px', border: 'none', textAlign: 'left', width: '100%',
      background: active ? 'rgba(245,197,24,0.1)' : 'transparent',
      color: active ? 'var(--gold)' : 'var(--text-muted)',
      fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: active ? '600' : '400',
      cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      <span style={{ fontSize: '7px', color: active ? 'var(--gold)' : 'var(--text-dim)', flexShrink: 0 }}>●</span>
      {label}
    </button>
  )
}

function ServiceCard({ service }) {
  const { format } = useCurrency()
  const features = service.features || []
  const options = service.options

  function getPriceInfo() {
    if (!options || options.type === 'fixed') {
      return { showFrom: false, amount: service.basePrice, suffix: null }
    }
    if (options.type === 'quantity') {
      return { showFrom: true, amount: options.unitPrice, suffix: `/ ${options.unitName}` }
    }
    if (options.type === 'range') {
      return { showFrom: true, amount: options.pricePerUnit, suffix: `/ ${options.unitName}` }
    }
    if (options.type === 'options') {
      const min = Math.min(...(options.choices?.map(c => c.price) || [service.basePrice]))
      return { showFrom: true, amount: min, suffix: null }
    }
    return { showFrom: false, amount: service.basePrice, suffix: null }
  }

  const price = getPriceInfo()

  return (
    <Link href={`/order/${service.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.15s',
        height: '100%', display: 'flex', flexDirection: 'column',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--gold)'
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {service.imageUrl ? (
          <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
            <Image
              src={service.imageUrl}
              alt={service.name}
              fill
              sizes="(max-width: 640px) calc(100vw - 32px), 270px"
              style={{ objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, var(--bg-card) 100%)',
            }} />
            {service.isHot && (
              <span style={{
                position: 'absolute', top: '10px', left: '10px',
                background: '#ff4444', color: '#fff',
                fontSize: '10px', fontWeight: '700',
                padding: '2px 8px', borderRadius: '4px',
                fontFamily: 'var(--font-montserrat)',
              }}>HOT</span>
            )}
          </div>
        ) : (
          <div style={{
            height: '80px',
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: '1px solid var(--border)', position: 'relative',
          }}>
            <span style={{ fontSize: '28px', opacity: 0.3 }}>{getServiceIcon(service)}</span>
            {service.isHot && (
              <span style={{
                position: 'absolute', top: '8px', left: '8px',
                background: '#ff4444', color: '#fff',
                fontSize: '10px', fontWeight: '700',
                padding: '2px 8px', borderRadius: '4px',
                fontFamily: 'var(--font-montserrat)',
              }}>HOT</span>
            )}
          </div>
        )}

        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 className="h4" style={{ color: '#fff' }}>{service.name}</h3>

          {features.length > 0 && (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {features.slice(0, 2).map((f, i) => (
                <li key={i} style={{
                  fontSize: '12px', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ color: 'var(--gold)', fontSize: '10px' }}>◆</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 'auto' }}>
            {price.showFrom && (
              <div style={{
                fontSize: '10px', color: 'var(--text-dim)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px',
                fontFamily: 'var(--font-montserrat)', fontWeight: '700',
              }}>From</div>
            )}
            <div style={{
              fontSize: '20px', fontWeight: '700',
              fontFamily: 'var(--font-montserrat)', color: 'var(--gold)',
            }}>
              {format(price.amount)}
              {price.suffix && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', fontFamily: 'var(--font-inter)' }}>
                  {' '}{price.suffix}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
