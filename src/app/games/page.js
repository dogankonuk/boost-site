import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import GamesGrid from '@/components/GamesGrid'

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

      <div style={{
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border)',
        padding: '40px 0 32px',
      }}>
        <Container>
          <h1 className="h1" style={{ color: '#fff', marginBottom: '8px' }}>All Games</h1>
          <p className="body-default" style={{ color: 'var(--text-muted)' }}>
            {games.length} games available for boosting services. Choose your game and boost with confidence!
          </p>
        </Container>
      </div>

      <Container style={{ paddingTop: '32px', paddingBottom: '48px', flex: 1 }}>
        <GamesGrid games={JSON.parse(JSON.stringify(games))} />
      </Container>

      <Footer />
    </main>
  )
}