import StaticPage, { Section } from '@/components/StaticPage'

export const metadata = {
  title: 'Refund Policy',
  description: 'Learn when and how you can request a refund for an order on ShadowBoosting.',
  alternates: { canonical: '/refund' },
}

export default function RefundPolicyPage() {
  return (
    <StaticPage title="Refund Policy" path="/refund" subtitle="Last updated: 2026">
      <Section title="Money-Back Guarantee">
        <p>
          If your order has not yet been started by a booster (status: &ldquo;Pending&rdquo;), you&apos;re eligible for a full
          refund — just contact us with your order number.
        </p>
      </Section>

      <Section title="Orders In Progress">
        <p>
          Once a booster has begun working on your order (&ldquo;Assigned&rdquo; or &ldquo;In Progress&rdquo;), we&apos;ll review refund
          requests on a case-by-case basis. Partial refunds may be offered depending on how much work has
          already been completed.
        </p>
      </Section>

      <Section title="Completed Orders">
        <p>
          Refunds are not offered for orders marked &ldquo;Completed&rdquo; and delivered as described. If something wasn&apos;t
          delivered as agreed, contact us within 7 days of completion and we&apos;ll make it right.
        </p>
      </Section>

      <Section title="How to Request a Refund">
        <p>
          Reach out through our Contact page with your order number and the reason for your request. We aim to
          resolve refund requests within a few business days.
        </p>
      </Section>
    </StaticPage>
  )
}
