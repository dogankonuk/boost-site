import StaticPage, { Section } from '@/components/StaticPage'

export const metadata = {
  title: 'Privacy Policy',
  description: 'How ShadowBoosting collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" subtitle="Last updated: 2026">
      <Section title="1. Information We Collect">
        <p>
          When you create an account or place an order, we collect the information you provide directly —
          your email address, username, password (stored as a secure hash, never in plain text), and any
          order details or notes you submit. If you sign in with Google or Discord, we receive your email
          address and basic profile information from that provider.
        </p>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>
          We use your information to create and manage your account, process and deliver your orders,
          communicate with you about order status, and send account-related emails (verification, password
          resets, order updates). We don't sell your personal information to third parties.
        </p>
      </Section>

      <Section title="3. Order & Messaging Data">
        <p>
          Messages you exchange with boosters through our in-app messaging system, and any account details
          you provide for a boosting order, are stored so the order can be completed and so a record exists
          if you need support. Only you, the assigned booster, and our support team can see this information.
        </p>
      </Section>

      <Section title="4. Cookies">
        <p>
          We use essential cookies and browser storage to keep you signed in and remember preferences like
          your selected currency. We don't use third-party advertising trackers.
        </p>
      </Section>

      <Section title="5. Third-Party Services">
        <p>
          We rely on trusted third parties to operate the service — including our hosting provider, database
          provider, email delivery provider, and (for boosters) Discord for order coordination. These providers
          only receive the information necessary to perform their function.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We retain account and order data for as long as your account is active, or as needed to resolve
          disputes and comply with legal obligations. You can request account deletion at any time via our
          Contact page.
        </p>
      </Section>

      <Section title="7. Your Rights">
        <p>
          You can access, correct, or request deletion of your personal information at any time. Reach out
          through our Contact page and we'll respond as soon as possible.
        </p>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>
          We may update this policy from time to time. Continued use of the service after changes take effect
          means you accept the updated policy.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Questions about this policy or your data? Reach out via our Contact page.
        </p>
      </Section>
    </StaticPage>
  )
}
