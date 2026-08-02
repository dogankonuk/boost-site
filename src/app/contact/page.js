import StaticPage, { Section } from '@/components/StaticPage'

export const metadata = {
  title: 'Contact Us',
  description: 'Have a question about an order or your account? Get in touch with our support team.',
}

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us" subtitle="Have a question about an order or your account? Reach out below.">
      <Section title="Email">
        <p>
          <a href="mailto:destek@shadowboosting.co" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
            destek@shadowboosting.co
          </a>
        </p>
        <p style={{ marginTop: '8px' }}>We typically respond within 24 hours.</p>
      </Section>

      <Section title="Before you write in">
        <p>
          If your question is about a specific order, please include your order number (found on your{' '}
          Dashboard) so we can help you faster.
        </p>
      </Section>
    </StaticPage>
  )
}
