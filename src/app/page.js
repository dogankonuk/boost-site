import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import GamesSlider from '@/components/GamesSlider'
import FeaturesSection from '@/components/FeaturesSection'
import TrustSection from '@/components/TrustSection'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <GamesSlider />
      <FeaturesSection />
      <TrustSection />
      <Footer />
    </main>
  )
}