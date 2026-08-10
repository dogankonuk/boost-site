import StaticPage, { Section } from '@/components/StaticPage'
import ContactForm from '@/components/ContactForm'

export const metadata = {
  title: 'Contact Us',
  description: 'Have a question about an order or your account? Get in touch with our support team.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us" path="/contact" subtitle="Have a question about an order or your account? Reach out below.">
      <Section title="Send us a message">
        <p style={{ marginBottom: '16px' }}>
          If your question is about a specific order, include your order number (found on your Dashboard) so we can help you faster.
        </p>
        <ContactForm />
      </Section>

      <Section title="Email">
        <p>
          <a href="mailto:support@shadowboosting.co" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
            support@shadowboosting.co
          </a>
        </p>
        <p style={{ marginTop: '8px' }}>We typically respond within 24 hours.</p>
      </Section>
    </StaticPage>
  )
}
