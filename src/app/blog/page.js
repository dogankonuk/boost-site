import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'

export const metadata = {
  title: 'Game Boosting Guides, Tips & News',
  description: 'Read practical game guides, boosting explainers, platform updates, and detailed playthroughs for supported titles from the ShadowBoosting content team.',
  alternates: {
    canonical: '/blog',
    types: { 'application/rss+xml': '/blog/rss.xml' },
  },
}

const CATEGORIES = ['Guide', 'Update', 'Playthrough', 'News']

export default async function BlogPage({ searchParams }) {
  const params = await searchParams
  const category = params?.category
  const gameSlug = params?.game

  const posts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      publishedAt: { lte: new Date() },
      ...(category ? { category } : {}),
      ...(gameSlug ? { game: { slug: gameSlug } } : {}),
    },
    include: {
      author: { select: { username: true, displayName: true } },
      game: { select: { name: true, slug: true } },
    },
    orderBy: { publishedAt: 'desc' },
  })

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <PageHeader
        eyebrow="Notes From the Shadows"
        title="Game Guides & News"
        subtitle="Guides, updates, and playthroughs from our team and content creators."
        accent="violet"
        right={
          <a href="/blog/rss.xml" style={{
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-dim)',
            textDecoration: 'none', border: '1px solid var(--border)', borderRadius: '20px', padding: '6px 12px',
          }}>
            📡 RSS
          </a>
        }
      />

      <Container style={{ paddingTop: '28px', paddingBottom: '48px', flex: 1 }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <FilterLink label="All" href="/blog" active={!category} />
          {CATEGORIES.map(c => (
            <FilterLink key={c} label={c} href={`/blog?category=${c}`} active={category === c} />
          ))}
        </div>

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <p className="body-large">No posts here yet — check back soon.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {posts.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </Container>

      <Footer />
    </main>
  )
}

function FilterLink({ label, href, active }) {
  return (
    <Link href={href} style={{
      padding: '7px 14px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none',
      fontFamily: 'var(--font-montserrat)', fontWeight: '600',
      background: active ? 'rgba(245,197,24,0.12)' : 'var(--bg-elevated)',
      border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
      color: active ? 'var(--gold)' : 'var(--text-muted)',
    }}>
      {label}
    </Link>
  )
}

export function BlogCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '14px', overflow: 'hidden', height: '100%',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.15s',
      }}>
        <div style={{
          aspectRatio: '16/9', width: '100%',
          background: post.coverImage
            ? `url(${post.coverImage}) center/cover`
            : 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(147,51,234,0.15))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', flexShrink: 0,
        }}>
          {!post.coverImage && '📝'}
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
              background: 'rgba(245,197,24,0.1)', border: '1px solid var(--gold)',
              color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', fontWeight: '700',
            }}>{post.category}</span>
            {post.game && (
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{post.game.name}</span>
            )}
          </div>
          <h2 style={{
            fontSize: '15px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '700',
            margin: 0, lineHeight: '1.4',
          }}>{post.title}</h2>
          {post.excerpt && (
            <p style={{
              fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{post.excerpt}</p>
          )}
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: 'auto', paddingTop: '4px' }}>
            {post.author?.displayName || post.author?.username} · {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
    </Link>
  )
}
