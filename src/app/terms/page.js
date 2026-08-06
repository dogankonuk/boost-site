import StaticPage, { Section } from '@/components/StaticPage'

export const metadata = {
  title: 'Terms of Service',
  description: 'The terms and conditions governing your use of ShadowBoosting.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service" path="/terms" subtitle="Last updated: 2026">
      <Section title="1. The Service">
        <p>
          ShadowBoosting connects customers with independent boosters who provide game account boosting and
          related services. By placing an order, you agree to these terms.
        </p>
      </Section>

      <Section title="2. Account Responsibility">
        <p>
          You're responsible for the accuracy of the account details and instructions you provide for your
          order. Where a booster needs access to your account, you remain responsible for that account and
          should follow any safety guidance we or your booster provide.
        </p>
      </Section>

      <Section title="3. Orders & Delivery">
        <p>
          Estimated delivery times shown on the site are estimates, not guarantees — actual completion time can
          vary based on order scope and booster availability. You can track order status at any time from your
          Dashboard.
        </p>
      </Section>

      <Section title="4. Refunds">
        <p>
          Refund eligibility is described in our Refund Policy, which forms part of these terms.
        </p>
      </Section>

      <Section title="5. Prohibited Use">
        <p>
          You may not use the service to violate the terms of service of any third-party game or platform in a
          way that knowingly puts your account at unrecoverable risk, or to conduct any illegal activity.
        </p>
      </Section>

      <Section title="6. Limitation of Liability">
        <p>
          We provide the service on an "as is" basis. To the maximum extent permitted by law, we are not liable
          for indirect or consequential damages arising from use of the service, including actions taken by the
          platform or game the order relates to.
        </p>
      </Section>

      <Section title="7. Changes to These Terms">
        <p>
          We may update these terms from time to time. Continued use of the service after changes take effect
          means you accept the updated terms.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          Questions about these terms? Reach out via our Contact page.
        </p>
      </Section>
    </StaticPage>
  )
}
