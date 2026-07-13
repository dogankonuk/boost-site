'use client'
import Link from 'next/link'
import { useCurrency } from '@/context/CurrencyContext'

export default function ServiceCard({ service }) {
  const { format } = useCurrency()
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'border-color 0.2s, transform 0.15s',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 className="h4" style={{ color: '#fff', flex: 1 }}>{service.name}</h3>
        <span style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-montserrat)',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          marginLeft: '12px',
        }}>{service.priceType === 'fixed' ? 'Fixed Price' : 'Variable Price'}</span>
      </div>

      <div style={{
        fontSize: '28px',
        fontWeight: '800',
        fontFamily: 'var(--font-montserrat)',
        color: 'var(--gold)',
      }}>
        {format(service.basePrice)}
      </div>

      <Link href={`/order/${service.id}`} style={{ textDecoration: 'none' }}>
        <button className="btn-primary" style={{ width: '100%' }}>
          Buy Now
        </button>
      </Link>
    </div>
  )
}