'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setError('Your session has expired. Please sign in again.')
    }
  }, [])

  async function submit() {
    setLoading(true)
    setError('')

    if (tab === 'register' && !form.username) {
      setError('Username is required')
      setLoading(false)
      return
    }

    if (tab === 'register' && form.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    const body = tab === 'login'
      ? { action: 'login', email: form.email, password: form.password }
      : { action: 'register', email: form.email, username: form.username, password: form.password }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()

      if (d.success) {
        localStorage.setItem('token', d.data.token)
        localStorage.setItem('username', d.data.username)
        router.push('/dashboard')
      } else {
        setError(d.error || 'An error occurred')
      }
    } catch {
      setError('Failed to connect to the server')
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px',
    }}>
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', background: 'var(--gold)',
            borderRadius: '10px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', fontWeight: '800',
            color: '#0a0a0a', fontFamily: 'var(--font-montserrat)',
          }}>S</div>
          <span style={{
            fontFamily: 'var(--font-montserrat)', fontWeight: '700',
            fontSize: '18px', color: '#fff',
          }}>ShadowBoosting</span>
        </div>
      </Link>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px',
      }}>
        <div style={{ display: 'flex', marginBottom: '28px', borderBottom: '1px solid var(--border)' }}>
          {[
            { key: 'login', label: 'Login' },
            { key: 'register', label: 'Register' },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError('') }} style={{
              flex: 1, padding: '12px',
              background: 'transparent', border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              color: tab === t.key ? 'var(--gold)' : 'var(--text-muted)',
              fontFamily: 'var(--font-montserrat)', fontWeight: '600', fontSize: '14px',
              cursor: 'pointer', transition: 'color 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/oauth-complete' })}
            style={socialButtonStyle}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <GoogleIcon /> Continue with Google
          </button>
          <button
            type="button"
            onClick={() => signIn('discord', { callbackUrl: '/oauth-complete' })}
            style={socialButtonStyle}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <DiscordIcon /> Continue with Discord
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{
              fontSize: '12px', color: 'var(--text-muted)',
              fontFamily: 'var(--font-montserrat)', fontWeight: '600',
              display: 'block', marginBottom: '6px',
            }}>
              {tab === 'login' ? 'Email or Username' : 'Email'}
            </label>
            <input
              type="email"
              placeholder="example@mail.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {tab === 'register' && (
            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                placeholder="shadowplayer"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
              {tab === 'login' && (
                <Link href="/forgot-password" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              background: '#2a1a1a', border: '1px solid #4a2a2a',
              borderRadius: '8px', padding: '10px 14px',
              color: '#ff6666', fontSize: '13px',
            }}>{error}</div>
          )}

          <button
            className="btn-primary"
            onClick={submit}
            disabled={loading}
            style={{ width: '100%', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
          </button>
        </div>
      </div>

      <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '24px' }}>
        © 2024 ShadowBoosting.co — All rights reserved.
      </p>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '11px 14px',
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'var(--font-inter)',
  outline: 'none',
}

const labelStyle = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-montserrat)',
  fontWeight: '600',
  display: 'block',
  marginBottom: '6px',
}

const socialButtonStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '11px 14px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: '#fff',
  fontFamily: 'var(--font-montserrat)',
  fontWeight: '600',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'border-color 0.2s',
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.85 2.07-1.81 2.71v2.26h2.92c1.71-1.57 2.69-3.88 2.69-6.61z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.97H.96C.35 6.19 0 7.55 0 9s.35 2.81.96 4.03l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.3 18.3 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.26.08.08 0 0 0-.08-.04c-1.7.3-3.34.81-4.89 1.52a.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1 0-.13c.13-.09.25-.19.37-.28a.07.07 0 0 1 .08 0c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08 0c.12.1.24.19.37.28a.08.08 0 0 1 0 .13c-.6.35-1.23.64-1.88.89a.08.08 0 0 0-.04.11c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6.01-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z"/>
    </svg>
  )
}