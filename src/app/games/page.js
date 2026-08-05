import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import GamesGrid from '@/components/GamesGrid'
import PageHeader from '@/components/PageHeader'

export const metadata = {
  title: 'All Games',
  description: 'Browse all supported games and find professional boosting services. Safe, fast, and guaranteed delivery.',
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
        subtitle={`${games.length} games available for boosting services. Choose your game and boost with confidence!`}
        accent="gold"
      />

      <Container style={{ paddingTop: '32px', paddingBottom: '48px', flex: 1 }}>
        <GamesGrid games={JSON.parse(JSON.stringify(games))} />
      </Container>

      <Footer />
    </main>
  )
}