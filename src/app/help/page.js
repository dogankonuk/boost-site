import Link from 'next/link'
import StaticPage, { Section } from '@/components/StaticPage'

export const metadata = {
  title: 'Help Center',
  description: "Find answers about orders, delivery, account safety, and more — or get in touch with our support team.",
  alternates: { canonical: '/help' },
}

export default function HelpPage() {
  return (
    <StaticPage title="Help Center" path="/help" subtitle="Find answers or reach out — we're here to help.">
      <Section title="Getting Started">
        <p>
          Browse <Link href="/games" style={{ color: 'var(--gold)' }}>Games</Link> to find the service you need,
          pick your options, and check out. Once you're logged in, every order you place shows up on your{' '}
          <Link href="/dashboard" style={{ color: 'var(--gold)' }}>Dashboard</Link>.
        </p>
      </Section>

      <Section title="Tracking an Order">
        <p>
          Open your Dashboard to see live status for every order — pending, assigned, in progress, or completed.
          You'll also get an email and an in-app notification (bell icon) every time your order's status changes.
        </p>
      </Section>

      <Section title="Account & Security">
        <p>
          Manage your profile, billing details, and password from Dashboard → Account Settings. If you haven't
          verified your email yet, you'll see a reminder there with a button to resend the verification link.
        </p>
      </Section>

      <Section title="Common Questions">
        <p>
          Check our <Link href="/faq" style={{ color: 'var(--gold)' }}>FAQ</Link> for quick answers about
          delivery times, refunds, and account safety.
        </p>
      </Section>

      <Section title="Still need help?">
        <p>
          Visit our <Link href="/contact" style={{ color: 'var(--gold)' }}>Contact Us</Link> page and we'll get
          back to you as soon as possible.
        </p>
      </Section>
    </StaticPage>
  )
}
