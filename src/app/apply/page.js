import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'

export const metadata = {
  title: 'Work with us',
  description: 'Apply to become a booster or content creator at ShadowBoosting.',
}

const ROLES = [
  {
    href: '/apply/booster',
    icon: '🛠',
    title: 'Booster',
    desc: 'Complete orders for customers across our supported games. Flexible hours, get paid for what you\'re already good at.',
  },
  {
    href: '/apply/content-creator',
    icon: '📝',
    title: 'Content Creator',
    desc: 'Write guides, updates, and playthroughs for our blog. Share your knowledge and reach thousands of players.',
  },
]

export default function ApplyPage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <PageHeader
        eyebrow="Join the Roster"
        title="Work with us"
        subtitle="Are you good at what you do? Turn it into an opportunity."
        accent="gold"
      />

      <Container style={{ paddingTop: '36px', paddingBottom: '64px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '640px' }}>
          {ROLES.map(role => (
            <Link key={role.href} href={role.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
                padding: '28px', height: '100%', transition: 'border-color 0.15s',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '14px' }}>{role.icon}</div>
                <h3 style={{ fontSize: '17px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '700', marginBottom: '8px' }}>
                  {role.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                  {role.desc}
                </p>
                <span style={{ fontSize: '13px', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
                  Apply now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>

      <Footer />
    </main>
  )
}
