import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import JsonLd from '@/components/JsonLd'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export default function StaticPage({ title, subtitle, path, children }) {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {path && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: title, item: `${SITE_URL}${path}` },
          ],
        }} />
      )}
      <Navbar />
      <Container style={{ paddingTop: '48px', paddingBottom: '72px', maxWidth: '760px' }}>
        {path && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-dim)' }}>
            <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-muted)' }}>{title}</span>
          </div>
        )}
        <h1 className="h2" style={{ color: '#fff', marginBottom: subtitle ? '8px' : '32px' }}>{title}</h1>
        {subtitle && (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>{subtitle}</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {children}
        </div>
      </Container>
      <Footer />
    </main>
  )
}

export function Section({ title, children }) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-montserrat)', fontWeight: '700', fontSize: '16px',
        color: 'var(--gold)', marginBottom: '10px',
      }}>{title}</h2>
      <div style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8' }}>
        {children}
      </div>
    </div>
  )
}
