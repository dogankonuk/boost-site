import StaticPage, { Section } from '@/components/StaticPage'

const FAQS = [
  {
    q: 'How does the boosting process work?',
    a: 'After you place an order, it enters our booster pool. One of our vetted boosters picks it up, and you\'ll get a notification and email as soon as that happens. You can track progress from your Dashboard at any time.',
  },
  {
    q: 'How long does an order take?',
    a: 'Most orders are delivered within 1–3 days, depending on the service and scope you selected. Larger orders (e.g. wide level ranges) can take longer — feel free to leave a note on your order with any timing needs.',
  },
  {
    q: 'Is my account safe?',
    a: 'Yes. Our boosters use VPN protection matching your region and follow strict account-safety practices. We never ask for more access than the service requires.',
  },
  {
    q: 'What if I\'m not happy with my order?',
    a: 'We offer a money-back guarantee — see our Refund Policy for details on how and when refunds apply.',
  },
  {
    q: 'How do I contact support?',
    a: 'Reach us any time at the address on our Contact page, or through your Dashboard notifications for order-specific updates.',
  },
  {
    q: 'Can I become a booster?',
    a: 'We\'re always looking for skilled, trustworthy boosters. Get in touch via our Contact page and our team will follow up.',
  },
]

export default function FAQPage() {
  return (
    <StaticPage title="Frequently Asked Questions">
      {FAQS.map((item, i) => (
        <Section key={i} title={item.q}>
          <p>{item.a}</p>
        </Section>
      ))}
    </StaticPage>
  )
}
