import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import GameServices from '@/components/GameServices'

export default async function GamePage({ params }) {
  const { slug } = await params

  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { basePrice: 'asc' },
      },
    },
  })

  if (!game) return notFound()

  const categories = ['Tümü', ...new Set(game.services.map(s => s.options?.category || 'Genel'))]

  return (
    <main>
      <Navbar />

      <div style={{
        position: 'relative',
        height: '320px',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}>
        {game.bannerImage && (
          <img
            src={game.bannerImage}
            alt={game.name}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', opacity: 0.4,
            }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 30%, #0a0a0a 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'flex-end',
        }}>
          <Container style={{ paddingBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <a href="/" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>Ana Sayfa</a>
              <span style={{ color: 'var(--text-dim)' }}>/</span>
              <span style={{ color: 'var(--gold)', fontSize: '13px' }}>{game.name}</span>
            </div>
            <h1 className="h1" style={{ color: '#fff', marginBottom: '10px' }}>{game.name}</h1>
            <span style={{
              background: 'var(--gold)', color: '#0a0a0a',
              borderRadius: '20px', padding: '4px 14px',
              fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '700',
            }}>{game.category}</span>
          </Container>
        </div>
      </div>

      <Container style={{ paddingTop: '32px', paddingBottom: '48px' }}>
        {game.description && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '24px', marginBottom: '32px',
          }}>
            <p className="body-default" style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
              {game.description}
            </p>
          </div>
        )}

        <GameServices services={game.services} gameName={game.name} />
      </Container>

      <Footer />
    </main>
  )
}