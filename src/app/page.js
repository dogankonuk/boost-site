import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import GamesSlider from '@/components/GamesSlider'
import FeaturesSection from '@/components/FeaturesSection'
import TrustSection from '@/components/TrustSection'
import LatestBlogSection from '@/components/LatestBlogSection'
import Footer from '@/components/Footer'

export default async function HomePage() {
  const latestPosts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    include: {
      author: { select: { username: true, displayName: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  })

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <GamesSlider />
      <FeaturesSection />
      <TrustSection />
      <LatestBlogSection posts={JSON.parse(JSON.stringify(latestPosts))} />
      <Footer />
    </main>
  )
}
