'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import FileUpload from '@/components/FileUpload'
import { authFetch } from '@/lib/authFetch'

const STATUS_LABELS = { pending: 'Under Review', approved: 'Approved', rejected: 'Not Approved' }
const STATUS_COLORS = {
  pending: { bg: '#2a2a1a', border: '#3a3a1a', color: '#ffcc44' },
  approved: { bg: '#1a2a1a', border: '#2a4a2a', color: '#4caf50' },
  rejected: { bg: '#2a1a1a', border: '#4a2a2a', color: '#ff6666' },
}

export default function ApplicationForm({ type, title, intro, extraFields, roleLabel }) {
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [existingApp, setExistingApp] = useState(null)
  const [alreadyHasRole, setAlreadyHasRole] = useState(false)
  const [games, setGames] = useState([])
  const [form, setForm] = useState({ discord: '', telegram: '', games: [], experience: '', screenshots: [], extra: {} })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setLoggedIn(!!token)
    fetch('/api/games').then(r => r.json()).then(d => { if (d.success) setGames(d.data) }).catch(() => {})
    if (token) checkStatus()
    else setCheckedAuth(true)
  }, [])

  async function checkStatus() {
    try {
      const [appsRes, profileRes] = await Promise.all([
        authFetch('/api/applications'),
        authFetch('/api/auth', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getProfile' }) }),
      ])
      if (appsRes) {
        const d = await appsRes.json()
        if (d.success) {
          const mine = d.data.filter(a => a.type === type)
          if (mine.length > 0) setExistingApp(mine[0])
        }
      }
      if (type === 'content_creator' && profileRes) {
        const pd = await profileRes.json()
        if (pd.success && pd.data?.isContentCreator) setAlreadyHasRole(true)
      }
      if (type === 'booster') {
        const boosterRes = await authFetch('/api/booster?type=me')
        if (boosterRes) {
          const bd = await boosterRes.json()
          if (bd.success && bd.data) setAlreadyHasRole(true)
        }
      }
    } catch {}
    setCheckedAuth(true)
  }

  function toggleGame(gameId) {
    setForm(f => ({
      ...f,
      games: f.games.includes(gameId) ? f.games.filter(id => id !== gameId) : [...f.games, gameId],
    }))
  }

  function setExtra(key, value) {
    setForm(f => ({ ...f, extra: { ...f.extra, [key]: value } }))
  }

  async function submit() {
    if (!form.experience.trim()) {
      setError('Please describe your experience')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await authFetch('/api/applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...form }),
      })
      if (res) {
        const d = await res.json()
        if (d.success) setSubmitted(true)
        else setError(d.error || 'Could not submit your application')
      }
    } catch {
      setError('Could not connect to the server')
    }
    setSubmitting(false)
  }

  if (!checkedAuth) return null

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container style={{ paddingTop: '40px', paddingBottom: '64px', maxWidth: '640px', flex: 1 }}>
        <Link href="/apply" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Work with us</Link>
        <h1 className="h2" style={{ color: '#fff', margin: '14px 0 8px' }}>{title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>{intro}</p>

        {!loggedIn ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <p className="body-large" style={{ color: '#fff', marginBottom: '12px' }}>Please log in first</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>You need an account to submit an application.</p>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">Log In</button>
            </Link>
          </div>
        ) : alreadyHasRole ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <p className="body-large" style={{ color: '#fff' }}>You're already a {roleLabel}!</p>
          </div>
        ) : submitted || (existingApp && existingApp.status === 'pending') ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <p className="body-large" style={{ color: '#fff', marginBottom: '8px' }}>Application submitted</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>We'll review it and get back to you. You can check back here for updates.</p>
          </div>
        ) : (
          <>
            {existingApp && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px',
                padding: '10px 14px', borderRadius: '8px',
                background: STATUS_COLORS[existingApp.status].bg,
                border: `1px solid ${STATUS_COLORS[existingApp.status].border}`,
              }}>
                <span style={{ fontSize: '12px', color: STATUS_COLORS[existingApp.status].color, fontWeight: '600' }}>
                  Previous application: {STATUS_LABELS[existingApp.status]}
                </span>
                {existingApp.reviewNote && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>— {existingApp.reviewNote}</span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Discord tag">
                <input value={form.discord} onChange={e => setForm(f => ({ ...f, discord: e.target.value }))} style={inputStyle} placeholder="username#0000" />
              </Field>
              <Field label="Telegram (optional)">
                <input value={form.telegram} onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} style={inputStyle} placeholder="@username" />
              </Field>

              <Field label="Which games do you want to work with?">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {games.map(g => {
                    const selected = form.games.includes(g.id)
                    return (
                      <button key={g.id} type="button" onClick={() => toggleGame(g.id)} style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                        fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer',
                        border: '1px solid', background: selected ? 'var(--gold)' : 'transparent',
                        color: selected ? '#0a0a0a' : 'var(--text-muted)',
                        borderColor: selected ? 'var(--gold)' : 'var(--border)',
                      }}>{g.name}</button>
                    )
                  })}
                </div>
              </Field>

              {extraFields.map(f => (
                <Field key={f.key} label={f.label}>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={form.extra[f.key] || ''}
                      onChange={e => setExtra(f.key, e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder={f.placeholder}
                    />
                  ) : f.type === 'radio' ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {f.options.map(opt => {
                        const selected = form.extra[f.key] === opt
                        return (
                          <button key={opt} type="button" onClick={() => setExtra(f.key, opt)} style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                            fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer',
                            border: '1px solid', background: selected ? 'var(--gold)' : 'transparent',
                            color: selected ? '#0a0a0a' : 'var(--text-muted)',
                            borderColor: selected ? 'var(--gold)' : 'var(--border)',
                          }}>{opt}</button>
                        )
                      })}
                    </div>
                  ) : (
                    <input value={form.extra[f.key] || ''} onChange={e => setExtra(f.key, e.target.value)} style={inputStyle} placeholder={f.placeholder} />
                  )}
                </Field>
              ))}

              <Field label="Tell us about your experience">
                <textarea
                  value={form.experience}
                  onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Your background, past experience, achievements..."
                />
              </Field>

              <FileUpload
                label="Screenshots (optional — proof of experience, past work, etc.)"
                value={form.screenshots}
                onChange={urls => setForm(f => ({ ...f, screenshots: urls }))}
                maxFiles={5}
              />

              {error && (
                <div style={{ background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#ff6666', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <button className="btn-primary" onClick={submit} disabled={submitting} style={{ marginTop: '4px' }}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </>
        )}
      </Container>
      <Footer />
    </main>
  )
}

function Field({ label, children }) {
  return (
    <div>
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
