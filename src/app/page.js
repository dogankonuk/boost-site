import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import GamesSlider from '@/components/GamesSlider'
import PopularServicesStrip from '@/components/PopularServicesStrip'
import FeaturesSection from '@/components/FeaturesSection'
import TrustSection from '@/components/TrustSection'
import LatestBlogSection from '@/components/LatestBlogSection'
import Footer from '@/components/Footer'

export default async function HomePage() {
  const [latestPosts, hotServices] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() } },
      include: {
        author: { select: { username: true, displayName: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    prisma.service.findMany({
      where: { isActive: true, isHot: true },
      include: { game: { select: { name: true, slug: true, coverImage: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <GamesSlider />
      <PopularServicesStrip services={JSON.parse(JSON.stringify(hotServices))} />
      <FeaturesSection />
      <TrustSection />
      <LatestBlogSection posts={JSON.parse(JSON.stringify(latestPosts))} />
      <Footer />
    </main>
  )
}
