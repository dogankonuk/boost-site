'use client'
import { useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Container from '@/components/Container'
import FileUpload from '@/components/FileUpload'
import { authFetch } from '@/lib/authFetch'
import { trackEvent } from '@/lib/analytics'

const STATUS_LABELS = { pending: 'Under Review', approved: 'Approved', rejected: 'Not Approved' }
const STATUS_COLORS = {
  pending: { bg: '#2a2a1a', border: '#3a3a1a', color: '#ffcc44' },
  approved: { bg: '#1a2a1a', border: '#2a4a2a', color: '#4caf50' },
  rejected: { bg: '#2a1a1a', border: '#4a2a2a', color: '#ff6666' },
}

function subscribeToAuth(onChange) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function getAuthSnapshot() {
  return localStorage.getItem('token') || ''
}

function getServerAuthSnapshot() {
  return ''
}

function subscribeToHydration() {
  return () => {}
}

async function readJson(response) {
  return response ? response.json() : null
}

export default function ApplicationForm({ type, title, intro, extraFields, roleLabel }) {
  const token = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getServerAuthSnapshot)
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  const loggedIn = Boolean(token)
  const [loadResult, setLoadResult] = useState({ type: null, games: [], existingApp: null, alreadyHasRole: false })
  const [form, setForm] = useState({ discord: '', telegram: '', games: [], experience: '', screenshots: [], extra: {} })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function loadApplicationState() {
      try {
        const [gamesRes, appsRes, profileRes, boosterRes] = await Promise.all([
          fetch('/api/games'),
          authFetch('/api/applications'),
          type === 'content_creator'
            ? authFetch('/api/auth', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getProfile' }) })
            : Promise.resolve(null),
          type === 'booster' ? authFetch('/api/booster?type=me') : Promise.resolve(null),
        ])

        const [gamesData, appsData, profileData, boosterData] = await Promise.all([
          readJson(gamesRes),
          readJson(appsRes),
          readJson(profileRes),
          readJson(boosterRes),
        ])

        if (cancelled) return

        const existingApp = appsData?.success
          ? appsData.data.find(application => application.type === type) || null
          : null
        const alreadyHasRole = type === 'content_creator'
          ? Boolean(profileData?.success && profileData.data?.isContentCreator)
          : Boolean(boosterData?.success && boosterData.data?.status === 'active')

        setLoadResult({
          type,
          games: gamesData?.success ? gamesData.data : [],
          existingApp,
          alreadyHasRole,
        })
      } catch {
        if (!cancelled) setLoadResult({ type, games: [], existingApp: null, alreadyHasRole: false })
      }
    }

    loadApplicationState()
    return () => { cancelled = true }
  }, [token, type])

  const checkedAuth = hydrated && (!loggedIn || loadResult.type === type)
  const games = loadResult.type === type ? loadResult.games : []
  const existingApp = loadResult.type === type ? loadResult.existingApp : null
  const alreadyHasRole = loadResult.type === type && loadResult.alreadyHasRole

  function toggleGame(gameId) {
    setForm(f => ({
      ...f,
      games: f.games.includes(gameId) ? f.games.filter(id => id !== gameId) : [...f.games, gameId],
    }))
  }

  function setExtra(key, value) {
    setForm(f => ({ ...f, extra: { ...f.extra, [key]: value } }))
  }

  function validate() {
    const errors = {}
    if (!form.discord.trim()) errors.discord = 'Discord tag is required'
    if (form.games.length === 0) errors.games = 'Select at least one game'
    if (!form.experience.trim()) errors.experience = 'Please describe your experience'
    return errors
  }

  async function submit() {
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setError('')
    try {
      const res = await authFetch('/api/applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...form }),
      })
      if (res) {
        const d = await res.json()
        if (d.success) {
          setSubmitted(true)
          trackEvent('application_submitted', { application_type: type, games_selected: form.games.length })
        }
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
            <Link href="/login" className="btn-primary">Log In</Link>
          </div>
        ) : alreadyHasRole ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <p className="body-large" style={{ color: '#fff' }}>You’re already a {roleLabel}!</p>
          </div>
        ) : submitted || (existingApp && existingApp.status === 'pending') ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <p className="body-large" style={{ color: '#fff', marginBottom: '8px' }}>Application submitted</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>We’ll review it and get back to you. You can check back here for updates.</p>
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
              <Field label="Discord tag" required error={fieldErrors.discord}>
                <input
                  value={form.discord}
                  onChange={e => { setForm(f => ({ ...f, discord: e.target.value })); setFieldErrors(fe => ({ ...fe, discord: undefined })) }}
                  style={{ ...inputStyle, ...(fieldErrors.discord ? errorInputStyle : {}) }}
                  placeholder="username#0000"
                />
              </Field>
              <Field label="Telegram (optional)">
                <input value={form.telegram} onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} style={inputStyle} placeholder="@username" />
              </Field>

              <Field label="Which games do you want to work with?" required error={fieldErrors.games}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {games.map(g => {
                    const selected = form.games.includes(g.id)
                    return (
                      <button key={g.id} type="button" onClick={() => { toggleGame(g.id); setFieldErrors(fe => ({ ...fe, games: undefined })) }} style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '12px',
                        fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer',
                        background: selected ? 'var(--gold)' : 'transparent',
                        color: selected ? '#0a0a0a' : 'var(--text-muted)',
                        border: `1px solid ${selected ? 'var(--gold)' : (fieldErrors.games ? '#ff6666' : 'var(--border)')}`,
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

              <Field label="Tell us about your experience" required error={fieldErrors.experience}>
                <textarea
                  value={form.experience}
                  onChange={e => { setForm(f => ({ ...f, experience: e.target.value })); setFieldErrors(fe => ({ ...fe, experience: undefined })) }}
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', ...(fieldErrors.experience ? errorInputStyle : {}) }}
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

function Field({ label, required, error, children }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: '#ff6666' }}> *</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: '11px', color: '#ff6666', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}

const errorInputStyle = {
  border: '1px solid #ff6666',
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
