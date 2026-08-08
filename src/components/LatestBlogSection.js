import Link from 'next/link'
import Reveal from './motion/Reveal'
import { ArticleIcon } from './BrandIcons'

export default function LatestBlogSection({ posts }) {
  if (!posts || posts.length === 0) return null

  return (
    <section className="container" style={{ paddingBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 className="h2" style={{ color: '#fff', margin: 0 }}>Latest from the Blog</h2>
        <Link href="/blog" style={{ fontSize: '13px', color: 'var(--gold)', textDecoration: 'none', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
          View All Posts →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {posts.map((post, i) => (
          <Reveal key={post.id} delay={i * 0.08}>
            <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '14px', overflow: 'hidden', height: '100%',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  aspectRatio: '16/9', width: '100%',
                  background: post.coverImage
                    ? `url(${post.coverImage}) center/cover`
                    : 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(147,51,234,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--violet)', flexShrink: 0,
                }}>
                  {!post.coverImage && <ArticleIcon size={32} />}
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '20px', alignSelf: 'flex-start',
                    background: 'rgba(245,197,24,0.1)', border: '1px solid var(--gold)',
                    color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', fontWeight: '700',
                  }}>{post.category}</span>
                  <h3 style={{
                    fontSize: '14px', color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '700',
                    margin: 0, lineHeight: '1.4',
                  }}>{post.title}</h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: 'auto', paddingTop: '4px' }}>
                    {post.author?.displayName || post.author?.username} · {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
