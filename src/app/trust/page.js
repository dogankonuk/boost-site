import { getTestimonials } from '@/lib/testimonials'
import Navbar from '@/components/Navbar'
import TrustHeroSection from '@/components/TrustHeroSection'
import FeaturesSection from '@/components/FeaturesSection'
import TestimonialsSection from '@/components/TestimonialsSection'
import HomeFAQSection from '@/components/HomeFAQSection'
import ClosingCTASection from '@/components/ClosingCTASection'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Is ShadowBoosting Safe? Account Safety & Guarantees',
  description: 'Vetted boosters, VPN-protected sessions, self-play options, and a money-back guarantee — here\'s exactly how we keep your account safe.',
  alternates: { canonical: '/trust' },
}

export default async function TrustPage() {
  const testimonials = await getTestimonials(8)

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <TrustHeroSection />
      <FeaturesSection />
      <TestimonialsSection testimonials={JSON.parse(JSON.stringify(testimonials))} />
      <HomeFAQSection />
      <ClosingCTASection />
      <Footer />
    </main>
  )
}
