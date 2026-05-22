'use client'
import Link from 'next/link'

const links = [
  { label: 'Help Center', href: '/help' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'Terms of Service', href: '/terms' },
]

export default function Footer() {
  return (
    <footer style={{
      background: '#0f0f0f',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '28px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-montserrat)',
            fontWeight: '700', fontSize: '15px',
            color: 'var(--gold)',
          }}>ShadowBoosting.co</div>
          <div className="caption" style={{ marginTop: '4px' }}>
            Forge Your Power in the Shadows!
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['VISA', 'Mastercard', 'Papara', 'Google Pay'].map(p => (
            <span key={p} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: '600',
              fontFamily: 'var(--font-montserrat)',
            }}>{p}</span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {links.map(l => (
            <Link key={l.label} href={l.href} className="caption" style={{
              color: 'var(--text-dim)',
              transition: 'color 0.2s',
              textDecoration: 'none',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--gold)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}
            >{l.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  )
}