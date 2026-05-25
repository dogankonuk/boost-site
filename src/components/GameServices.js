'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function GameServices({ services, game }) {
  const categories = ['Tümü', ...new Set(services.map(s => s.serviceCategory || 'Genel'))]
  const [active, setActive] = useState('Tümü')

  const filtered = active === 'Tümü'
    ? services
    : services.filter(s => (s.serviceCategory || 'Genel') === active)

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActive(cat)} style={{
            padding: '8px 18px', borderRadius: '24px',
            fontFamily: 'var(--font-montserrat)', fontWeight: '600', fontSize: '13px',
            cursor: 'pointer', border: '1px solid',
            background: active === cat ? 'var(--gold)' : 'transparent',
            color: active === cat ? '#0a0a0a' : 'var(--text-muted)',
            borderColor: active === cat ? 'var(--gold)' : 'var(--border)',
            transition: 'all 0.2s',
          }}>{cat}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <p className="body-large">Bu kategoride hizmet bulunamadı.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {filtered.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  )
}

function ServiceCard({ service }) {
  const features = service.features || []
  const options = service.options

  function getPriceLabel() {
    if (!options || options.type === 'fixed') return `${service.basePrice.toLocaleString('tr-TR')} ₺`
    if (options.type === 'quantity') return `${options.unitPrice?.toLocaleString('tr-TR')} ₺ / ${options.unitName}`
    if (options.type === 'range') return `${options.pricePerUnit?.toLocaleString('tr-TR')} ₺ / ${options.unitName}`
    if (options.type === 'options') {
      const min = Math.min(...(options.choices?.map(c => c.price) || [service.basePrice]))
      return `${min.toLocaleString('tr-TR')} ₺'den başlayan`
    }
    return `${service.basePrice.toLocaleString('tr-TR')} ₺`
  }

  function getPriceSubLabel() {
    if (!options || options.type === 'fixed') return 'sabit fiyat'
    if (options.type === 'quantity') return `min ${options.minQty} — max ${options.maxQty}`
    if (options.type === 'range') return `${options.min} → ${options.max} ${options.unitName}`
    if (options.type === 'options') return `${options.choices?.length} seçenek`
    return 'başlangıç fiyatı'
  }

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
            <img src={service.imageUrl} alt={service.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            <span style={{ fontSize: '28px', opacity: 0.3 }}>⚡</span>
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
              {features.slice(0, 3).map((f, i) => (
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>
              {getPriceSubLabel()}
            </div>
            <div style={{
              fontSize: '20px', fontWeight: '800',
              fontFamily: 'var(--font-montserrat)', color: 'var(--gold)',
            }}>
              {getPriceLabel()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}