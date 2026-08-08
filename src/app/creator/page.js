'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import { authFetch } from '@/lib/authFetch'
import ImageUpload from '@/components/ImageUpload'

const CATEGORIES = ['Guide', 'Update', 'Playthrough', 'News']

const emptyForm = { title: '', excerpt: '', content: '', coverImage: '', category: 'Guide', gameId: '', publishedAt: '' }

function toDatetimeLocal(date) {
  if (!date) return ''
  const d = new Date(date)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CreatorPage() {
  const router = useRouter()
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [isCreator, setIsCreator] = useState(null) // null = loading, false = no access, true = access
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [games, setGames] = useState([])
  const [view, setView] = useState('list')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      if (creator && postsData?.success) setPosts(postsData.data)
      setLoadingPosts(false)
      setCheckedAuth(true)
    }

    initializeCreator()
    return () => { cancelled = true }
  }, [router])

  async function fetchPosts() {
    setLoadingPosts(true)
    try {
      const res = await authFetch('/api/blog')
      if (res) {
        const d = await res.json()
        if (d.success) setPosts(d.data)
      }
    } catch {}
    setLoadingPosts(false)
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setView('editor')
  }

  function startEdit(post) {
    setEditingId(post.id)
    setForm({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      category: post.category,
      gameId: post.gameId ? String(post.gameId) : '',
      publishedAt: toDatetimeLocal(post.publishedAt),
    })
    setError('')
    setView('editor')
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

  async function togglePublish(post) {
    try {
      const res = await authFetch('/api/blog', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, isPublished: !post.isPublished }),
      })
      if (res) {
        const d = await res.json()
        if (d.success) fetchPosts()
      }
    } catch {}
  }

  async function deletePost(post) {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return
    try {
      const res = await authFetch(`/api/blog?id=${post.id}`, { method: 'DELETE' })
      if (res) {
        const d = await res.json()
        if (d.success) fetchPosts()
      }
    } catch {}
  }

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <h1 className="h2" style={{ color: '#fff', margin: 0 }}>Content Studio</h1>
              <button className="btn-primary" onClick={startNew}>+ New Post</button>
            </div>

            {loadingPosts ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <p className="body-large">You haven&apos;t written anything yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {posts.map(post => {
                  const scheduled = post.isPublished && post.publishedAt && new Date(post.publishedAt) > new Date()
                  return (
                  <div key={post.id} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                  }}>
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
                        {post.category}{post.game ? ` · ${post.game.name}` : ''} · 👁 {post.views}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => togglePublish(post)} style={smallBtnStyle}>
                        {post.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => startEdit(post)} style={smallBtnStyle}>Edit</button>
                      <button onClick={() => deletePost(post)} style={{ ...smallBtnStyle, color: '#ff6666' }}>Delete</button>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '20px' }}>←</button>
              <h1 className="h2" style={{ color: '#fff', margin: 0 }}>{editingId ? 'Edit Post' : 'New Post'}</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Title">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="How to level up fast in..." />
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
              <Field label="Content (Markdown supported)">
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={16}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                  placeholder="Write your post here..."
                />
                <MarkdownCheatSheet />
              </Field>

              {error && (
                <div style={{ background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#ff6666', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button className="btn-primary" onClick={() => save(true)} disabled={saving}>
                  {saving ? 'Saving...' : isScheduled ? 'Schedule' : 'Publish'}
                </button>
                <button onClick={() => save(false)} disabled={saving} style={smallBtnStyle}>
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
