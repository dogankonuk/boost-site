import { prisma } from '@/lib/prisma'
import { getTestimonials } from '@/lib/testimonials'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import GamesSlider from '@/components/GamesSlider'
import ShadowRouteSection from '@/components/ShadowRouteSection'
import PopularServicesStrip from '@/components/PopularServicesStrip'
import FeaturesSection from '@/components/FeaturesSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import LatestBlogSection from '@/components/LatestBlogSection'
import HomeFAQSection from '@/components/HomeFAQSection'
import ClosingCTASection from '@/components/ClosingCTASection'
import Footer from '@/components/Footer'

export default async function HomePage() {
  let latestPosts = []
  let hotServices = []
  let testimonials = []
  let routeGames = []

  try {
    const homepageData = await Promise.all([
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
      getTestimonials(8),
      prisma.game.findMany({
        where: { isActive: true, services: { some: { isActive: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          services: {
            where: { isActive: true },
            orderBy: [{ isHot: 'desc' }, { name: 'asc' }],
            select: {
              id: true,
              name: true,
              basePrice: true,
              serviceCategory: true,
              discoveryGoals: true,
            },
          },
        },
      }),
    ])
    latestPosts = homepageData[0]
    hotServices = homepageData[1]
    testimonials = homepageData[2]
    routeGames = homepageData[3]
  } catch (error) {
    console.warn(
      '[homepage] Database-backed sections could not be loaded.',
      error instanceof Error ? error.message : error
    )
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <GamesSlider />
      <ShadowRouteSection games={JSON.parse(JSON.stringify(routeGames))} />
      <PopularServicesStrip services={JSON.parse(JSON.stringify(hotServices))} />
      <FeaturesSection />
      <LatestBlogSection posts={JSON.parse(JSON.stringify(latestPosts))} />
      <TestimonialsSection testimonials={JSON.parse(JSON.stringify(testimonials))} />
      <HomeFAQSection />
      <ClosingCTASection />
      <Footer />
    </main>
  )
}
