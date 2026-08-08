import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import GamesGrid from '@/components/GamesGrid'
import PageHeader from '@/components/PageHeader'

export const metadata = {
  title: 'Browse All Game Boosting Services',
  description: 'Explore every supported ShadowBoosting game, compare available services, and choose the right option for your rank, level, quests, or other in-game goals.',
  alternates: { canonical: '/games' },
}

export default async function GamesPage() {
  const games = await prisma.game.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      services: {
        where: { isActive: true },
        select: { id: true }
      }
    }
  })

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <PageHeader
        eyebrow="Every Battlefield, Covered"
        title="All Games"
        subtitle={`${games.length} games available. Choose a game to explore its services, pricing, and delivery options.`}
        accent="gold"
      />

      <Container style={{ paddingTop: '32px', paddingBottom: '48px', flex: 1 }}>
        <GamesGrid games={JSON.parse(JSON.stringify(games))} />

        <section aria-labelledby="game-catalog-guide" style={{ marginTop: '52px' }}>
          <div style={{ maxWidth: '760px', marginBottom: '20px' }}>
            <h2 id="game-catalog-guide" className="h3" style={{ color: '#fff', marginBottom: '10px' }}>
              Find the right service for your game
            </h2>
            <p className="body-default" style={{ color: 'var(--text-muted)', lineHeight: '1.75' }}>
              Search the catalog by game name or genre, then sort it alphabetically or by the number of currently available services. Each game page groups its active services so you can compare their scope, starting prices, features, and configurable options without moving between unrelated titles.
              The catalog reflects active game and service records, so unavailable items do not appear here.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {[
              { title: 'Start with your game', text: 'Open the title you play to see only the services currently assigned to that game and filter them by service category.' },
              { title: 'Compare the format', text: 'Services may use fixed prices, selectable ranges, quantities, or package choices. The service page shows the active configuration before checkout.' },
              { title: 'Review every detail', text: 'Check the included features, delivery method, optional add-ons, current total, and order notes before adding a configured service to your cart.' },
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
            Before choosing, you can also review the <Link href="/faq" style={{ color: 'var(--gold)' }}>frequently asked questions</Link> and our <Link href="/trust" style={{ color: 'var(--gold)' }}>account safety and delivery practices</Link>.
          </p>
        </section>
      </Container>

      <Footer />
    </main>
  )
}
