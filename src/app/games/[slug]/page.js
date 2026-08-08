import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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

  const serviceCount = game.services.length
  const serviceLabel = `${serviceCount} available ${serviceCount === 1 ? 'service' : 'services'}`
  const description = truncateMetaDescription(
    `Explore ${game.name} boosting services for ${game.category || 'players'}. Compare ${serviceLabel}, pricing, delivery methods, and service details before choosing your boost.`
  )

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

  const serviceCategories = [...new Set(game.services.map(service => service.serviceCategory).filter(Boolean))]
  const serviceCountLabel = `${game.services.length} ${game.services.length === 1 ? 'service' : 'services'}`

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
            <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>Home</Link>
            <span style={{ color: 'var(--text-dim)' }}>/</span>
            <span style={{ color: 'var(--gold)', fontSize: '13px' }}>{game.name}</span>
          </div>
          <h1 className="h1" style={{ color: '#fff', marginBottom: '10px' }}>{game.name}</h1>
          <span style={{
            background: 'var(--gold)', color: '#0a0a0a',
            borderRadius: '20px', padding: '4px 14px',
            fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '700',
          }}>{game.category}</span>

          <p className="body-default" style={{
            color: 'var(--text-muted)', lineHeight: '1.8',
            marginTop: '16px', maxWidth: '760px',
          }}>
            {game.description || `Compare the available ${game.name} services, configure the option that matches your goal, and review pricing and delivery details before ordering.`}
          </p>
        </Container>
      </div>

      <Container style={{ paddingTop: '24px', paddingBottom: '48px', flex: 1 }}>
        <div style={{ marginBottom: '22px', maxWidth: '760px' }}>
          <div style={{
            color: 'var(--gold)', fontSize: '11px', fontFamily: 'var(--font-montserrat)',
            fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px',
          }}>
            {serviceCountLabel} available
          </div>
          <h2 className="h3" style={{ color: '#fff', marginBottom: '8px' }}>Choose your {game.name} service</h2>
          <p className="body-default" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            Review each service&apos;s scope, starting price, included features, and configurable options to find the closest match for your in-game goal.
          </p>
        </div>

        <GameServices services={game.services} game={game} />

        <section aria-labelledby="game-service-guide" style={{ marginTop: '48px' }}>
          <div style={{ maxWidth: '760px', marginBottom: '20px' }}>
            <h2 id="game-service-guide" className="h3" style={{ color: '#fff', marginBottom: '10px' }}>
              How to choose your {game.name} boost
            </h2>
            <p className="body-default" style={{ color: 'var(--text-muted)', lineHeight: '1.75' }}>
              Start with the result you want, then compare the available service types and configuration fields. This page currently lists {serviceCountLabel}
              {serviceCategories.length > 0 ? ` across ${serviceCategories.join(', ')}` : ''}. Open any service to see its current price, delivery method, included features, optional add-ons, and estimated start information before adding it to your cart.
              Use the category filters above to narrow the list by service type.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {[
              { title: 'Compare the scope', text: 'Check what the service includes and whether its selectable range, quantity, or package matches your target.' },
              { title: 'Review delivery options', text: 'The service page explains the available delivery method and shows any configurable add-ons before checkout.' },
              { title: 'Track the next steps', text: 'After an order is created, its status and available progress details appear in your account dashboard.' },
            ].map(item => (
              <div key={item.title} style={{
                padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px',
              }}>
                <h3 className="h4" style={{ color: '#fff', marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.65', margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.7', marginTop: '18px' }}>
            Need more context first? Read about <Link href="/trust" style={{ color: 'var(--gold)' }}>account safety and delivery practices</Link> or visit the <Link href="/faq" style={{ color: 'var(--gold)' }}>frequently asked questions</Link>.
          </p>
        </section>
      </Container>

      <Footer />
    </main>
  )
}

function truncateMetaDescription(text, maxLength = 160) {
  if (text.length <= maxLength) return text
  const shortened = text.slice(0, maxLength - 1)
  const lastSpace = shortened.lastIndexOf(' ')
  return `${shortened.slice(0, lastSpace).replace(/[,.;:!?-]+$/, '')}.`
}
