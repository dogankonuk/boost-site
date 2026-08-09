'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import { authFetch } from '@/lib/authFetch'
import ImageUpload from '@/components/ImageUpload'
import { AlertTriangleIcon } from '@/components/BrandIcons'
import { markdownToHtml } from '@/lib/markdown'
import { uploadToCloudinary } from '@/lib/cloudinary'

const CATEGORIES = ['Guide', 'Update', 'Playthrough', 'News']
const PAGE_SIZE = 10
const READ_WPM = 200

const emptyForm = { title: '', slug: '', excerpt: '', content: '', coverImage: '', category: 'Guide', gameId: '', publishedAt: '' }

function toDatetimeLocal(date) {
  if (!date) return ''
  const d = new Date(date)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function estimateReadTime(content) {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / READ_WPM))
}

function timeAgo(ts) {
  const diffMs = Date.now() - ts
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function draftKey(id) {
  return `creator-draft-${id || 'new'}`
}

function findDraft(id, currentForm) {
  try {
    const raw = localStorage.getItem(draftKey(id))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.form) return null
    if (JSON.stringify(parsed.form) === JSON.stringify(currentForm)) return null
    return parsed
  } catch {
    return null
  }
}

export default function CreatorPage() {
  const router = useRouter()
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [isCreator, setIsCreator] = useState(null) // null = loading, false = no access, true = access
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [postsError, setPostsError] = useState('')
  const [games, setGames] = useState([])
  const [view, setView] = useState('list')
  const [tab, setTab] = useState('posts')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'info' })
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [editorMode, setEditorMode] = useState('write')
  const [draftPrompt, setDraftPrompt] = useState(null)
  const [insertingImage, setInsertingImage] = useState(false)
  const [insertImageError, setInsertImageError] = useState('')
  const [postSearch, setPostSearch] = useState('')
  const [postStatusFilter, setPostStatusFilter] = useState('all')
  const [postSort, setPostSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [analytics, setAnalytics] = useState({ data: [], loading: false, error: '', loaded: false })
  const contentRef = useRef(null)
  const imageInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function initializeCreator() {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const readJson = async request => {
        try {
          const response = await request
          return response ? await response.json() : null
        } catch {
          return null
        }
      }

      const [profileData, gamesData, postsData] = await Promise.all([
        readJson(authFetch('/api/auth', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getProfile' }),
        })),
        readJson(fetch('/api/games')),
        readJson(authFetch('/api/blog')),
      ])

      if (cancelled) return

      const creator = !!(profileData?.success && profileData.data?.isContentCreator)
      setIsCreator(creator)
      if (gamesData?.success) setGames(gamesData.data)
      if (creator) {
        if (postsData?.success) setPosts(postsData.data)
        else setPostsError(postsData?.error || 'Could not load your posts.')
      }
      setLoadingPosts(false)
      setCheckedAuth(true)
    }

    initializeCreator()
    return () => { cancelled = true }
  }, [router])

  async function fetchPosts() {
    setLoadingPosts(true)
    setPostsError('')
    try {
      const res = await authFetch('/api/blog')
      if (res) {
        const d = await res.json()
        if (d.success) setPosts(d.data)
        else setPostsError(d.error || 'Could not load your posts.')
      }
    } catch {
      setPostsError('Could not connect to the server.')
    }
    setLoadingPosts(false)
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setEditorMode('write')
    setDraftPrompt(findDraft(null, emptyForm))
    setView('editor')
  }

  function startEdit(post) {
    setEditingId(post.id)
    const nextForm = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      category: post.category,
      gameId: post.gameId ? String(post.gameId) : '',
      publishedAt: toDatetimeLocal(post.publishedAt),
    }
    setForm(nextForm)
    setError('')
    setEditorMode('write')
    setDraftPrompt(findDraft(post.id, nextForm))
    setView('editor')
  }

  function restoreDraft() {
    if (!draftPrompt) return
    setForm(draftPrompt.form)
    setDraftPrompt(null)
  }

  function discardDraft() {
    try { localStorage.removeItem(draftKey(editingId)) } catch {}
    setDraftPrompt(null)
  }

  useEffect(() => {
    if (view !== 'editor') return
    const timer = setTimeout(() => {
      try { localStorage.setItem(draftKey(editingId), JSON.stringify({ savedAt: Date.now(), form })) } catch {}
    }, 800)
    return () => clearTimeout(timer)
  }, [form, view, editingId])

  function insertAtCursor(text) {
    const el = contentRef.current
    const start = el?.selectionStart ?? form.content.length
    const end = el?.selectionEnd ?? form.content.length
    setForm(f => ({ ...f, content: f.content.slice(0, start) + text + f.content.slice(end) }))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + text.length
      el.setSelectionRange(pos, pos)
    })
  }

  async function handleImageFile(file) {
    if (!file) return
    setInsertingImage(true)
    setInsertImageError('')
    try {
      const url = await uploadToCloudinary(file)
      insertAtCursor(`![](${url})`)
    } catch (err) {
      setInsertImageError(err.message || 'Upload failed. Please try again.')
    }
    setInsertingImage(false)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  async function save(publish) {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, isPublished: publish }
      if (!payload.publishedAt) delete payload.publishedAt
      const res = editingId
        ? await authFetch('/api/blog', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingId, ...payload }),
          })
        : await authFetch('/api/blog', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      if (res) {
        const d = await res.json()
        if (d.success) {
          try { localStorage.removeItem(draftKey(editingId)) } catch {}
          await fetchPosts()
          setView('list')
        } else {
          setError(d.error || 'Could not save the post')
        }
      }
    } catch {
      setError('Could not connect to the server')
    }
    setSaving(false)
  }

  async function fetchAnalytics() {
    setAnalytics(a => ({ ...a, loading: true, error: '' }))
    try {
      const res = await authFetch('/api/blog/analytics')
      if (res) {
        const d = await res.json()
        if (d.success) setAnalytics({ data: d.data, loading: false, error: '', loaded: true })
        else setAnalytics(a => ({ ...a, loading: false, error: d.error || 'Could not load analytics.' }))
      }
    } catch {
      setAnalytics(a => ({ ...a, loading: false, error: 'Could not connect to the server.' }))
    }
  }

  function selectTab(key) {
    setTab(key)
    if (key === 'analytics' && !analytics.loaded && !analytics.loading) fetchAnalytics()
  }

  async function togglePublish(post) {
    try {
      const res = await authFetch('/api/blog', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, isPublished: !post.isPublished }),
      })
      if (res) {
        const d = await res.json()
        if (d.success) fetchPosts()
        else setActionMsg({ text: d.error || 'Could not update this post. Please try again.', type: 'error' })
      }
    } catch {
      setActionMsg({ text: 'Could not connect to the server. Please try again.', type: 'error' })
    }
  }

  async function deletePost(postId) {
    setDeletingId(postId)
    try {
      const res = await authFetch(`/api/blog?id=${postId}`, { method: 'DELETE' })
      if (res) {
        const d = await res.json()
        if (d.success) {
          fetchPosts()
          setDeleteConfirmId(null)
        } else {
          setActionMsg({ text: d.error || 'Could not delete this post. Please try again.', type: 'error' })
        }
      }
    } catch {
      setActionMsg({ text: 'Could not connect to the server. Please try again.', type: 'error' })
    }
    setDeletingId(null)
  }

  const filteredPosts = useMemo(() => {
    const q = postSearch.trim().toLowerCase()
    let list = posts
    if (q) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.game?.name || '').toLowerCase().includes(q)
      )
    }
    if (postStatusFilter !== 'all') {
      list = list.filter(p => {
        const scheduled = p.isPublished && p.publishedAt && new Date(p.publishedAt) > new Date()
        if (postStatusFilter === 'scheduled') return scheduled
        if (postStatusFilter === 'published') return p.isPublished && !scheduled
        return !p.isPublished
      })
    }
    const sorted = [...list]
    if (postSort === 'views') sorted.sort((a, b) => (b.views || 0) - (a.views || 0))
    else if (postSort === 'oldest') sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    else sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return sorted
  }, [posts, postSearch, postStatusFilter, postSort])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE))
  const pagedPosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const topPosts = useMemo(() => [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5), [posts])

  if (!checkedAuth) return null

  const isScheduled = form.publishedAt && new Date(form.publishedAt) > new Date()

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container style={{ paddingTop: '40px', paddingBottom: '64px', flex: 1 }}>
        {isCreator === false ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <p className="body-large">You don&apos;t have content creator access yet.</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Contact an admin if you&apos;d like to write for the blog.</p>
          </div>
        ) : view === 'list' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
              <div>
                <h1 className="h2" style={{ color: '#fff', margin: 0 }}>Content Studio</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Write, publish and track your posts here.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard icon="📝" label="Posts" value={posts.length} />
                <StatCard icon="✅" label="Published" value={posts.filter(p => p.isPublished).length} />
                <StatCard icon="👁" label="Total Views" value={posts.reduce((sum, p) => sum + (p.views || 0), 0)} accent />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[{ key: 'posts', icon: '📝', label: 'Posts' }, { key: 'analytics', icon: '📈', label: 'Analytics' }].map(t => (
                  <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => selectTab(t.key)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 16px', borderRadius: '20px', fontSize: '13px',
                    fontFamily: 'var(--font-montserrat)', fontWeight: '600',
                    cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                    background: tab === t.key ? 'var(--gold)' : 'transparent',
                    color: tab === t.key ? '#0a0a0a' : 'var(--text-muted)',
                    borderColor: tab === t.key ? 'var(--gold)' : 'var(--border)',
                  }}>
                    <span aria-hidden="true">{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
              {tab === 'posts' && (
                <button type="button" className="btn-primary" onClick={startNew}>+ New Post</button>
              )}
            </div>

            {actionMsg.text && (
              <div role={actionMsg.type === 'error' ? 'alert' : 'status'} style={{
                background: actionMsg.type === 'error' ? '#2a1a1a' : 'var(--bg-card)',
                border: `1px solid ${actionMsg.type === 'error' ? '#4a2a2a' : 'var(--border)'}`,
                borderRadius: '8px', padding: '10px 16px',
                color: actionMsg.type === 'error' ? '#ff8a8a' : 'var(--gold)',
                fontSize: '13px', marginBottom: '16px',
              }}>{actionMsg.text}</div>
            )}

            {tab === 'analytics' ? (
              <AnalyticsTab analytics={analytics} onRetry={fetchAnalytics} topPosts={topPosts} onEditPost={post => { setTab('posts'); startEdit(post) }} />
            ) : (
            <>
            {posts.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', opacity: 0.5 }}>🔍</span>
                  <input
                    value={postSearch}
                    onChange={e => { setPostSearch(e.target.value); setPage(1) }}
                    placeholder="Search by title, category or game..."
                    style={{
                      width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: '8px', padding: '10px 14px 10px 36px', color: '#fff',
                      fontSize: '13px', outline: 'none',
                    }}
                  />
                </div>
                <select value={postStatusFilter} onChange={e => { setPostStatusFilter(e.target.value); setPage(1) }} style={{ ...inputStyle, width: 'auto' }}>
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
                <select value={postSort} onChange={e => { setPostSort(e.target.value); setPage(1) }} style={{ ...inputStyle, width: 'auto' }}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="views">Most viewed</option>
                </select>
              </div>
            )}

            {loadingPosts ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : postsError ? (
              <div role="alert" style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '16px',
                padding: '24px', color: '#ff8a8a',
              }}>
                <AlertTriangleIcon size={20} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-muted)' }}>{postsError}</p>
                  <button type="button" className="btn-secondary" onClick={fetchPosts} style={{ marginTop: '12px', padding: '8px 14px', fontSize: '12px' }}>
                    Try again
                  </button>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <p className="body-large">You haven&apos;t written anything yet.</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <p className="body-large">No posts match your filters.</p>
              </div>
            ) : (
              <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pagedPosts.map(post => {
                  const scheduled = post.isPublished && post.publishedAt && new Date(post.publishedAt) > new Date()
                  return (
                  <div key={post.id} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                  }}>
                    {post.coverImage ? (
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
                        backgroundImage: `url(${post.coverImage})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        border: '1px solid var(--border)',
                      }} />
                    ) : (
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '10px',
                        background: 'var(--bg-elevated)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', border: '1px solid var(--border)',
                      }}>📝</div>
                    )}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '14px', color: '#fff', fontWeight: '600', fontFamily: 'var(--font-montserrat)',
                        }}>{post.title}</span>
                        <span style={{
                          fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                          background: scheduled ? 'rgba(245,197,24,0.1)' : post.isPublished ? 'rgba(76,175,80,0.1)' : 'var(--bg-elevated)',
                          border: `1px solid ${scheduled ? 'var(--gold)' : post.isPublished ? '#4caf50' : 'var(--border)'}`,
                          color: scheduled ? 'var(--gold)' : post.isPublished ? '#4caf50' : 'var(--text-dim)',
                        }}>
                          {scheduled ? `Scheduled for ${new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : post.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {post.category}{post.game ? ` · ${post.game.name}` : ''} · 👁 {post.views} · {estimateReadTime(post.content)} min read
                      </div>
                    </div>
                    {deleteConfirmId === post.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Delete this post?</span>
                        <button type="button" onClick={() => deletePost(post.id)} disabled={deletingId === post.id}
                          style={{ ...smallBtnStyle, color: '#ff6666' }}>
                          {deletingId === post.id ? '...' : 'Yes, delete'}
                        </button>
                        <button type="button" onClick={() => setDeleteConfirmId(null)} style={smallBtnStyle}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button type="button" onClick={() => togglePublish(post)} style={smallBtnStyle}>
                          {post.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button type="button" onClick={() => startEdit(post)} style={smallBtnStyle}>Edit</button>
                        <button type="button" onClick={() => setDeleteConfirmId(post.id)} style={{ ...smallBtnStyle, color: '#ff6666' }}>Delete</button>
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                  <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={smallBtnStyle}>← Prev</button>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Page {page} of {totalPages}</span>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={smallBtnStyle}>Next →</button>
                </div>
              )}
              </>
            )}
            </>
            )}
          </>
        ) : (
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button type="button" aria-label="Back to posts" onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '20px' }}>←</button>
              <h1 className="h2" style={{ color: '#fff', margin: 0 }}>{editingId ? 'Edit Post' : 'New Post'}</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {draftPrompt && (
                <div role="status" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
                  padding: '12px 16px', borderRadius: '10px', fontSize: '13px',
                  background: '#2a2a1a', border: '1px solid #3a3a1a', color: '#ffcc44',
                }}>
                  <span>📝 You have an unsaved draft from {timeAgo(draftPrompt.savedAt)}.</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={restoreDraft} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>Restore</button>
                    <button type="button" onClick={discardDraft} style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>Discard</button>
                  </div>
                </div>
              )}

              <Field label="Title">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="How to level up fast in..." />
              </Field>
              <Field label={`URL slug${editingId ? '' : ' (optional)'}`}>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={inputStyle}
                  placeholder={editingId ? form.slug : 'Leave blank to generate from the title'} />
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '5px', lineHeight: '1.5' }}>
                  {editingId
                    ? 'Used in the post URL. Changing this breaks links to the current address.'
                    : 'Used in the post URL — lowercase, hyphenated.'}
                </p>
              </Field>
              <Field label="Excerpt (shown on the blog list)">
                <input value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} style={inputStyle} placeholder="A short summary..." />
              </Field>
              <div style={{ display: 'flex', gap: '14px' }}>
                <Field label="Category" style={{ flex: 1 }}>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Game (optional)" style={{ flex: 1 }}>
                  <select value={form.gameId} onChange={e => setForm(f => ({ ...f, gameId: e.target.value }))} style={inputStyle}>
                    <option value="">None</option>
                    {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </Field>
              </div>
              <ImageUpload label="Cover image (optional)" value={form.coverImage} onChange={v => setForm(f => ({ ...f, coverImage: v }))} />
              <Field label="Publish date & time (optional — leave empty to publish immediately)">
                <input type="datetime-local" value={form.publishedAt} onChange={e => setForm(f => ({ ...f, publishedAt: e.target.value }))} style={inputStyle} />
              </Field>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
                    Content (Markdown supported)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>≈ {estimateReadTime(form.content)} min read</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => setEditorMode('write')} style={editorTabStyle(editorMode === 'write')}>Write</button>
                      <button type="button" onClick={() => setEditorMode('preview')} style={editorTabStyle(editorMode === 'preview')}>Preview</button>
                    </div>
                  </div>
                </div>

                {editorMode === 'write' ? (
                  <>
                    <textarea
                      ref={contentRef}
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      rows={16}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                      placeholder="Write your post here..."
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => imageInputRef.current?.click()} disabled={insertingImage} style={smallBtnStyle}>
                        {insertingImage ? 'Uploading...' : '🖼 Insert Image'}
                      </button>
                      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => handleImageFile(e.target.files?.[0])} />
                      {insertImageError && <span role="alert" style={{ color: '#ff8a8a', fontSize: '11px' }}>{insertImageError}</span>}
                    </div>
                    <MarkdownCheatSheet />
                  </>
                ) : (
                  <div className="blog-content" style={{
                    minHeight: '300px', maxHeight: '460px', overflowY: 'auto', padding: '16px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px',
                    color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8',
                  }} dangerouslySetInnerHTML={{
                    __html: form.content.trim()
                      ? markdownToHtml(form.content).html
                      : '<p style="color:var(--text-dim)">Nothing to preview yet.</p>',
                  }} />
                )}
              </div>

              {error && (
                <div role="alert" style={{ background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#ff6666', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" className="btn-primary" onClick={() => save(true)} disabled={saving}>
                  {saving ? 'Saving...' : isScheduled ? 'Schedule' : 'Publish'}
                </button>
                <button type="button" onClick={() => save(false)} disabled={saving} style={smallBtnStyle}>
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>
      <Footer />
    </main>
  )
}

function editorTabStyle(active) {
  return {
    padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
    fontFamily: 'var(--font-montserrat)', cursor: 'pointer', border: '1px solid',
    background: active ? 'var(--gold)' : 'transparent',
    color: active ? '#0a0a0a' : 'var(--text-muted)',
    borderColor: active ? 'var(--gold)' : 'var(--border)',
  }
}

function ViewsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: 'var(--gold)', fontWeight: '700' }}>{payload[0].value.toLocaleString('en-US')} views</div>
    </div>
  )
}

function AnalyticsTab({ analytics, onRetry, topPosts, onEditPost }) {
  const chartData = analytics.data.map(d => ({
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: d.views,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
        <h3 className="h4" style={{ color: '#fff', marginBottom: '4px' }}>Views — Last 30 Days</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Across all of your posts.</p>

        {analytics.loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</p>
        ) : analytics.error ? (
          <div role="alert" style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '12px', padding: '18px',
            color: '#ff8a8a',
          }}>
            <AlertTriangleIcon size={18} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-muted)' }}>{analytics.error}</p>
              <button type="button" className="btn-secondary" onClick={onRetry} style={{ marginTop: '10px', padding: '8px 14px', fontSize: '12px' }}>
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} interval={4} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                <Tooltip content={<ViewsTooltip />} cursor={{ fill: 'rgba(245,197,24,0.08)' }} />
                <Bar dataKey="views" radius={[4, 4, 0, 0]} maxBarSize={20}>
                  {chartData.map(d => (
                    <Cell key={d.label} fill={d.views > 0 ? 'var(--gold)' : 'var(--bg-elevated)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
        <h3 className="h4" style={{ color: '#fff', marginBottom: '14px' }}>Top Posts</h3>
        {topPosts.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nothing published yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topPosts.map((post, i) => (
              <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', width: '16px', flexShrink: 0 }}>{i + 1}</span>
                <span style={{
                  flex: 1, fontSize: '13px', color: '#fff', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                }}>{post.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: '700', flexShrink: 0 }}>👁 {post.views}</span>
                <button type="button" onClick={() => onEditPost(post)} style={{ ...smallBtnStyle, flexShrink: 0 }}>Edit</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '10px 16px', minWidth: '110px',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
        background: accent ? 'rgba(245,197,24,0.1)' : 'var(--bg-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '17px', fontWeight: '700', color: accent ? 'var(--gold)' : '#fff', fontFamily: 'var(--font-montserrat)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  )
}

const CHEAT_SHEET_ITEMS = [
  { syntax: '## Heading / ### Subheading', note: 'Section headings also appear in the article\'s Table of Contents' },
  { syntax: '**bold** / *italic*', note: '' },
  { syntax: '[link text](/games/eft) or (https://...)', note: 'Relative site links or full URLs both work' },
  { syntax: '![alt text](https://image-url)', note: '' },
  { syntax: '- list item', note: 'One per line' },
  { syntax: '> a quote', note: '' },
  { syntax: '| Col A | Col B |\n|---|---|\n| val 1 | val 2 |', note: 'Markdown table' },
  { syntax: '@youtube(dQw4w9WgXcQ)', note: 'Embeds a YouTube video — accepts a full URL or just the video ID' },
  { syntax: ':::tip Optional Title\nYour tip text here\n:::', note: 'Highlighted callout box — also supports :::note and :::warning' },
]

function MarkdownCheatSheet() {
  return (
    <details style={{ marginTop: '8px' }}>
      <summary style={{ fontSize: '12px', color: 'var(--text-dim)', cursor: 'pointer' }}>
        Formatting cheat sheet
      </summary>
      <div style={{
        marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px',
      }}>
        {CHEAT_SHEET_ITEMS.map(item => (
          <div key={item.syntax}>
            <code style={{ fontSize: '12px', color: 'var(--gold)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{item.syntax}</code>
            {item.note && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{item.note}</div>}
          </div>
        ))}
      </div>
    </details>
  )
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'var(--font-inter)',
  outline: 'none',
}

const smallBtnStyle = {
  padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontWeight: '600',
}
