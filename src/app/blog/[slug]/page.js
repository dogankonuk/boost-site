import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import { markdownToHtml } from '@/lib/markdown'
import ViewTracker from '@/components/ViewTracker'
import { BlogCard } from '../page'

const getPost = cache(async (slug) => {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: { select: { username: true, displayName: true } },
      game: { select: { name: true, slug: true } },
    },
  })
})

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post || !post.isPublished) return { title: 'Post Not Found' }

  const description = post.excerpt || post.title

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: 'article',
    },
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post || !post.isPublished || post.publishedAt > new Date()) return notFound()

  const [morePosts, newestPosts] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() }, category: post.category, id: { not: post.id } },
      include: {
        author: { select: { username: true, displayName: true } },
        game: { select: { name: true, slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() }, id: { not: post.id } },
      select: { id: true, slug: true, title: true, coverImage: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    }),
  ])

  const { html, headings } = markdownToHtml(post.content)

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <ViewTracker slug={post.slug} />

      <Container style={{ paddingTop: '32px', paddingBottom: '64px', maxWidth: '1080px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href="/blog" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Blog</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{post.title}</span>
        </div>

        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, maxWidth: '720px' }}>
            <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '16px' }}>
              ← All articles
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(245,197,24,0.1)', border: '1px solid var(--gold)',
                color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', fontWeight: '700',
              }}>{post.category}</span>
              {post.game && (
                <Link href={`/games/${post.game.slug}`} style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'none' }}>
                  {post.game.name}
                </Link>
              )}
            </div>

            <h1 className="h2" style={{ color: '#fff', marginBottom: '10px' }}>{post.title}</h1>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '24px' }}>
              By {post.author?.displayName || post.author?.username} · {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>

            {post.coverImage && (
              <div style={{
                width: '100%', aspectRatio: '16/9', borderRadius: '14px', overflow: 'hidden',
                backgroundImage: `url(${post.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center',
                marginBottom: '28px', border: '1px solid var(--border)',
              }} />
            )}

            {headings.length > 0 && (
              <div className="toc-mobile-only" style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
                padding: '16px 18px', marginBottom: '28px',
              }}>
                <TocList headings={headings} />
              </div>
            )}

            <div
              className="blog-content"
              style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {morePosts.length > 0 && (
              <div style={{ marginTop: '56px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                  More in {post.category}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {morePosts.map(p => (
                    <BlogCard key={p.id} post={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="blog-sidebar-desktop-only" style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '84px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {headings.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
                <h4 style={{ fontSize: '13px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '700', margin: '0 0 12px' }}>
                  Table of Contents
                </h4>
                <TocList headings={headings} />
              </div>
            )}

            {newestPosts.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
                <h4 style={{ fontSize: '13px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '700', margin: '0 0 12px' }}>
                  Newest Posts
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {newestPosts.map(p => (
                    <Link key={p.id} href={`/blog/${p.slug}`} style={{ display: 'flex', gap: '10px', textDecoration: 'none' }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '8px', flexShrink: 0,
                        background: p.coverImage
                          ? `url(${p.coverImage}) center/cover`
                          : 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(147,51,234,0.15))',
                        border: '1px solid var(--border)',
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '12px', color: '#fff', fontWeight: '600', lineHeight: '1.4',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{p.title}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>
                          {new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </Container>

      <Footer />
    </main>
  )
}

function TocList({ headings }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {headings.map((h, idx) => (
        <li key={h.id} style={{ paddingLeft: h.level === 3 ? '14px' : 0 }}>
          <a href={`#${h.id}`} style={{
            fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', lineHeight: '1.5',
          }}>
            {idx + 1}. {h.text}
          </a>
        </li>
      ))}
    </ol>
  )
}
