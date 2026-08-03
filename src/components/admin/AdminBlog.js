'use client'
import { useState, useEffect, useMemo } from 'react'

export default function AdminBlog({ secret }) {
  const [view, setView] = useState('posts')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState('')

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=blogPosts', { headers })
      const d = await res.json()
      if (d.success) setPosts(d.data)
    } catch {}
    setLoading(false)
  }

  async function togglePublish(post) {
    await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'blogPost', id: post.id, data: { isPublished: !post.isPublished } }),
    })
    setMsg(post.isPublished ? `"${post.title}" yayından kaldırıldı` : `"${post.title}" yayınlandı`)
    fetchPosts()
    setTimeout(() => setMsg(''), 3000)
  }

  async function deletePost(post) {
    if (!confirm(`"${post.title}" silinsin mi? Bu işlem geri alınamaz.`)) return
    await fetch(`/api/admin?type=blogPost&id=${post.id}`, { method: 'DELETE', headers })
    setMsg(`"${post.title}" silindi`)
    fetchPosts()
    setTimeout(() => setMsg(''), 3000)
  }

  const filtered = useMemo(() => {
    if (filter === 'published') return posts.filter(p => p.isPublished)
    if (filter === 'draft') return posts.filter(p => !p.isPublished)
    return posts
  }, [posts, filter])

  return (
    <div>
      {msg && (
        <div onClick={() => setMsg('')} style={{
          background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: '8px',
          padding: '10px 16px', color: '#4caf50', fontSize: '13px', marginBottom: '16px', cursor: 'pointer',
        }}>{msg} ✕</div>
      )}

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        {[{ key: 'posts', label: 'Yazılar' }, { key: 'authors', label: 'Yazarlar' }].map(t => (
          <button key={t.key} onClick={() => setView(t.key)} style={{
            padding: '10px 18px', background: 'transparent', border: 'none',
            borderBottom: view === t.key ? '2px solid var(--gold)' : '2px solid transparent',
            color: view === t.key ? 'var(--gold)' : 'var(--text-muted)',
            fontFamily: 'var(--font-montserrat)', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {view === 'authors' ? (
        <AdminBlogAuthors headers={headers} />
      ) : loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
      ) : (
        <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Blog Yazıları ({filtered.length})</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'published', label: 'Yayında' },
            { key: 'draft', label: 'Taslak' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
              fontFamily: 'var(--font-montserrat)', fontWeight: '600',
              cursor: 'pointer', border: '1px solid',
              background: filter === f.key ? 'var(--gold)' : 'transparent',
              color: filter === f.key ? '#0a0a0a' : 'var(--text-muted)',
              borderColor: filter === f.key ? 'var(--gold)' : 'var(--border)',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <p className="body-large">Yazı bulunamadı.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(post => {
            const scheduled = post.isPublished && post.publishedAt && new Date(post.publishedAt) > new Date()
            return (
            <div key={post.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', color: '#fff', fontWeight: '600', fontFamily: 'var(--font-montserrat)' }}>{post.title}</span>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                    background: scheduled ? 'rgba(245,197,24,0.1)' : post.isPublished ? 'rgba(76,175,80,0.1)' : 'var(--bg-elevated)',
                    border: `1px solid ${scheduled ? 'var(--gold)' : post.isPublished ? '#4caf50' : 'var(--border)'}`,
                    color: scheduled ? 'var(--gold)' : post.isPublished ? '#4caf50' : 'var(--text-dim)',
                  }}>
                    {scheduled ? `Zamanlandı: ${new Date(post.publishedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : post.isPublished ? 'Yayında' : 'Taslak'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ✍️ {post.author?.username} · {post.category}{post.game ? ` · ${post.game.name}` : ''} · 👁 {post.views}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => togglePublish(post)} style={{
                  background: 'transparent', border: `1px solid ${post.isPublished ? '#4a2a2a' : 'var(--border)'}`,
                  borderRadius: '5px', padding: '4px 10px', fontSize: '11px',
                  color: post.isPublished ? '#ff6666' : 'var(--text-muted)', cursor: 'pointer',
                }}>
                  {post.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                </button>
                <button onClick={() => deletePost(post)} style={{
                  background: 'transparent', border: '1px solid #4a2a2a',
                  borderRadius: '5px', padding: '4px 10px', fontSize: '11px',
                  color: '#ff6666', cursor: 'pointer',
                }}>
                  Sil
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}
        </>
      )}
    </div>
  )
}

function AdminBlogAuthors({ headers }) {
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin?type=contentCreators', { headers })
      .then(res => res.json())
      .then(d => { if (d.success) setCreators(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>

  if (creators.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <p className="body-large">Henüz içerik üreticisi yok.</p>
        <p style={{ fontSize: '12px', marginTop: '6px' }}>Kullanıcılar sekmesinden birini "Yazar Yap" ile içerik üreticisi yapabilirsin.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {creators.map(c => (
        <div key={c.id} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '800', color: 'var(--violet)',
            fontFamily: 'var(--font-montserrat)', flexShrink: 0,
          }}>{c.username[0]?.toUpperCase()}</div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>{c.username}</span>
              <span style={{
                fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                background: c.isActive ? '#1a2a1a' : '#2a1a1a',
                border: `1px solid ${c.isActive ? '#2a4a2a' : '#4a2a2a'}`,
                color: c.isActive ? '#4caf50' : '#ff6666',
              }}>{c.isActive ? 'Aktif' : 'Pasif'}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {c.games.length > 0 ? c.games.join(', ') : 'Henüz oyun belirtilmemiş'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '18px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Stat label="Toplam Yazı" value={c.totalPosts} />
            <Stat label="Yayında" value={c.publishedCount} />
            <Stat label="Taslak" value={c.draftCount} />
            <Stat label="Görüntülenme" value={c.totalViews} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: 'var(--gold)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{label}</div>
    </div>
  )
}
