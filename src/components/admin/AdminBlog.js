'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import AdminSkeleton from './AdminSkeleton'

export default function AdminBlog({ secret }) {
  const [view, setView] = useState('posts')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [msg, setMsg] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectNotes, setRejectNotes] = useState({})

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }), [secret])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=blogPosts', { headers })
      const d = await res.json()
      if (d.success) setPosts(d.data)
    } catch {}
    setLoading(false)
  }, [headers])

  useEffect(() => {
    let cancelled = false

    async function loadPosts() {
      await Promise.resolve()
      if (!cancelled) await fetchPosts()
    }

    loadPosts()
    return () => { cancelled = true }
  }, [fetchPosts])

  async function togglePublish(post) {
    // Publishing (from any state — draft, pending, rejected) also stamps the
    // post approved server-side, so this doubles as the "approve" action.
    await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'blogPost', id: post.id, data: { isPublished: !post.isPublished } }),
    })
    setMsg(post.isPublished ? `"${post.title}" yayından kaldırıldı` : `"${post.title}" yayınlandı`)
    fetchPosts()
    setTimeout(() => setMsg(''), 3000)
  }

  async function rejectPost(post) {
    await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'blogPost', id: post.id, data: { reviewStatus: 'rejected', reviewNote: rejectNotes[post.id]?.trim() || null, isPublished: false } }),
    })
    setMsg(`"${post.title}" için değişiklik istendi`)
    fetchPosts()
    setRejectingId(null)
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
    if (filter === 'pending') return posts.filter(p => !p.isPublished && p.reviewStatus === 'pending')
    if (filter === 'rejected') return posts.filter(p => !p.isPublished && p.reviewStatus === 'rejected')
    if (filter === 'draft') return posts.filter(p => !p.isPublished && p.reviewStatus === 'draft')
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
        <AdminSkeleton rows={5} />
      ) : (
        <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Blog Yazıları ({filtered.length})</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'published', label: 'Yayında' },
            { key: 'pending', label: 'Bekleyen' },
            { key: 'rejected', label: 'Reddedilen' },
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
            const badge = scheduled
              ? { label: `Zamanlandı: ${new Date(post.publishedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`, bg: 'rgba(245,197,24,0.1)', border: 'var(--gold)', color: 'var(--gold)' }
              : post.isPublished
                ? { label: 'Yayında', bg: 'rgba(76,175,80,0.1)', border: '#4caf50', color: '#4caf50' }
                : post.reviewStatus === 'pending'
                  ? { label: 'Onay Bekliyor', bg: 'rgba(245,197,24,0.1)', border: 'var(--gold)', color: 'var(--gold)' }
                  : post.reviewStatus === 'rejected'
                    ? { label: 'Reddedildi', bg: 'rgba(255,102,102,0.1)', border: '#ff6666', color: '#ff6666' }
                    : { label: 'Taslak', bg: 'var(--bg-elevated)', border: 'var(--border)', color: 'var(--text-dim)' }
            const rejecting = rejectingId === post.id
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
                    background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color,
                  }}>
                    {badge.label}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ✍️ {post.author?.username} · {post.category}{post.game ? ` · ${post.game.name}` : ''} · 👁 {post.views}
                </div>
                {post.reviewStatus === 'rejected' && post.reviewNote && (
                  <div style={{ fontSize: '11px', color: '#ff8a8a', marginTop: '4px' }}>✏️ {post.reviewNote}</div>
                )}
              </div>
              {rejecting ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px', flexShrink: 0 }}>
                  <input
                    value={rejectNotes[post.id] || ''}
                    onChange={e => setRejectNotes(prev => ({ ...prev, [post.id]: e.target.value }))}
                    placeholder="Neden (opsiyonel, yazara gösterilir)"
                    style={{
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px',
                      padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => rejectPost(post)} style={{
                      background: 'transparent', border: '1px solid #4a2a2a', borderRadius: '5px',
                      padding: '4px 10px', fontSize: '11px', color: '#ff6666', cursor: 'pointer',
                    }}>
                      Reddet
                    </button>
                    <button onClick={() => setRejectingId(null)} style={{
                      background: 'transparent', border: '1px solid var(--border)', borderRadius: '5px',
                      padding: '4px 10px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer',
                    }}>
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => togglePublish(post)} style={{
                    background: 'transparent', border: `1px solid ${post.isPublished ? '#4a2a2a' : 'var(--border)'}`,
                    borderRadius: '5px', padding: '4px 10px', fontSize: '11px',
                    color: post.isPublished ? '#ff6666' : 'var(--text-muted)', cursor: 'pointer',
                  }}>
                    {post.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                  </button>
                  {post.reviewStatus === 'pending' && (
                    <button onClick={() => setRejectingId(post.id)} style={{
                      background: 'transparent', border: '1px solid #4a2a2a', borderRadius: '5px',
                      padding: '4px 10px', fontSize: '11px', color: '#ff6666', cursor: 'pointer',
                    }}>
                      Reddet
                    </button>
                  )}
                  <button onClick={() => deletePost(post)} style={{
                    background: 'transparent', border: '1px solid #4a2a2a',
                    borderRadius: '5px', padding: '4px 10px', fontSize: '11px',
                    color: '#ff6666', cursor: 'pointer',
                  }}>
                    Sil
                  </button>
                </div>
              )}
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
    const controller = new AbortController()

    async function fetchCreators() {
      try {
        const res = await fetch('/api/admin?type=contentCreators', { headers, signal: controller.signal })
        const data = await res.json()
        if (!controller.signal.aborted && data.success) setCreators(data.data)
      } catch (error) {
        if (error.name !== 'AbortError') console.error(error)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchCreators()
    return () => controller.abort()
  }, [headers])

  if (loading) return <AdminSkeleton rows={5} />

  if (creators.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <p className="body-large">Henüz içerik üreticisi yok.</p>
        <p style={{ fontSize: '12px', marginTop: '6px' }}>Kullanıcılar sekmesinden birini &ldquo;Yazar Yap&rdquo; ile içerik üreticisi yapabilirsin.</p>
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
            fontSize: '14px', fontWeight: '700', color: 'var(--violet)',
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
