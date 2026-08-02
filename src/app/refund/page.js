import StaticPage, { Section } from '@/components/StaticPage'

export default function RefundPolicyPage() {
  return (
    <StaticPage title="Refund Policy" subtitle="Last updated: 2026">
      <Section title="Money-Back Guarantee">
        <p>
          If your order has not yet been started by a booster (status: "Pending"), you're eligible for a full
          refund — just contact us with your order number.
        </p>
      </Section>

      <Section title="Orders In Progress">
        <p>
          Once a booster has begun working on your order ("Assigned" or "In Progress"), we'll review refund
          requests on a case-by-case basis. Partial refunds may be offered depending on how much work has
          already been completed.
        </p>
      </Section>

      <Section title="Completed Orders">
        <p>
          Refunds are not offered for orders marked "Completed" and delivered as described. If something wasn't
          delivered as agreed, contact us within 7 days of completion and we'll make it right.
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
