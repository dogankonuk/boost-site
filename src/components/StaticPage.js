import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'

export default function StaticPage({ title, subtitle, children }) {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container style={{ paddingTop: '48px', paddingBottom: '72px', maxWidth: '760px' }}>
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
