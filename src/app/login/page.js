'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

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