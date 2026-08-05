import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import GameServices from '@/components/GameServices'
import JsonLd from '@/components/JsonLd'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

const getGame = cache(async (slug) => {
  return prisma.game.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { basePrice: 'asc' },
      },
    },
  })
})

export async function generateMetadata({ params }) {
  const { slug } = await params
  const game = await getGame(slug)
  if (!game) return { title: 'Game Not Found' }

  const description = game.description
    || `Professional ${game.name} boosting services — ${game.category}. Safe, fast, and guaranteed delivery.`

  return {
    title: `${game.name} Boosting Services`,
    description,
    alternates: { canonical: `/games/${game.slug}` },
    openGraph: {
      title: `${game.name} Boosting Services — ShadowBoosting.co`,
      description,
      images: game.bannerImage || game.coverImage ? [game.bannerImage || game.coverImage] : undefined,
    },
  }
}

export default async function GamePage({ params }) {
  const { slug } = await params
  const game = await getGame(slug)

  if (!game) return notFound()

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Games', item: `${SITE_URL}/games` },
          { '@type': 'ListItem', position: 3, name: game.name, item: `${SITE_URL}/games/${game.slug}` },
        ],
      }} />
      <Navbar />

      {game.bannerImage && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundImage: `url(${game.bannerImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 0.14,
          pointerEvents: 'none',
        }} />
      )}

      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, var(--bg) 100%)',
      }}>
        <Container style={{ position: 'relative', paddingTop: '36px', paddingBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <a href="/" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>Home</a>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ color: 'var(--gold)', fontSize: '13px' }}>{game.name}</span>
          </div>
          <h1 className="h1" style={{ color: '#fff', marginBottom: '10px' }}>{game.name}</h1>
          <span style={{
            background: 'var(--gold)', color: '#0a0a0a',
            borderRadius: '20px', padding: '4px 14px',
            fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '700',
          }}>{game.category}</span>

          {game.description && (
            <p className="body-default" style={{
              color: 'var(--text-muted)', lineHeight: '1.8',
              marginTop: '16px', maxWidth: '760px',
            }}>
              {game.description}
            </p>
          )}
        </Container>
      </div>

      <Container style={{ paddingTop: '24px', paddingBottom: '48px', flex: 1 }}>
        <GameServices services={game.services} game={game} />
      </Container>

      <Footer />
    </main>
  )
}