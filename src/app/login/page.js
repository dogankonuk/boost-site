'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'

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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setError('Your session has expired. Please sign in again.')
    }
    if (searchParams.get('ref')) {
      setTab('register')
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

    if (tab === 'register' && !agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      setLoading(false)
      return
    }

    const body = tab === 'login'
      ? { action: 'login', email: form.email, password: form.password }
      : { action: 'register', email: form.email, username: form.username, password: form.password, agreedToTerms, referralCode: searchParams.get('ref') || undefined }

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
        toast.success(tab === 'login' ? `Welcome back, ${d.data.username}!` : 'Account created!')
        router.push('/dashboard')
      } else {
        setError(d.error || 'An error occurred')
        toast.error(d.error || 'An error occurred')
      }
    } catch {
      setError('Failed to connect to the server')
      toast.error('Failed to connect to the server')
    }

    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left — brand panel */}
      <div className="auth-visual" style={{
        flex: '1 1 46%', position: 'relative', overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center', padding: '60px',
        background: `
          radial-gradient(ellipse 700px 600px at 15% 10%, rgba(245, 197, 24, 0.16), transparent 60%),
          radial-gradient(ellipse 800px 700px at 90% 90%, rgba(147, 51, 234, 0.20), transparent 60%),
          #060606
        `,
        borderRight: '1px solid var(--border)',
      }}>
        {/* decorative rings */}
        <div className="auth-ring-spin" style={{
          position: 'absolute', top: '50%', left: '50%', width: '900px', height: '900px',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none',
        }}>
          {[900, 700, 520, 360].map((size, i) => (
            <div key={size} style={{
              position: 'absolute', top: '50%', left: '50%', width: `${size}px`, height: `${size}px`,
              transform: 'translate(-50%, -50%)', borderRadius: '50%',
              border: `1px solid rgba(245, 197, 24, ${0.14 - i * 0.02})`,
            }} />
          ))}
        </div>

        {/* huge faint watermark */}
        <div style={{
          position: 'absolute', bottom: '-80px', right: '-40px',
          fontSize: '420px', fontWeight: '800', fontFamily: 'var(--font-montserrat)',
          color: 'rgba(245, 197, 24, 0.04)', lineHeight: 1, pointerEvents: 'none',
        }}>S</div>

        <div style={{ position: 'relative', maxWidth: '440px' }}>
          <h1 style={{
            fontFamily: 'var(--font-montserrat)', fontWeight: '800', fontSize: '46px',
            lineHeight: '1.15', color: '#fff', margin: '0 0 20px',
          }}>
            Forge Your<br />Power in the <span style={{ color: 'var(--gold)' }}>Shadows</span>
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '48px' }}>
            Join thousands of players who trust ShadowBoosting to level up their game — safe, fast, and guaranteed.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '20px 24px', display: 'inline-block',
          }}>
            <div style={{ fontSize: '18px', color: 'var(--gold)', letterSpacing: '3px', marginBottom: '8px' }}>★★★★★</div>
            <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: '700', fontSize: '15px', color: 'var(--gold)', marginBottom: '2px' }}>
              4.9 / 5 Trust Score
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Trusted by 12,000+ players worldwide
            </div>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div style={{
        flex: '1 1 54%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '32px',
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

        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{
            display: 'flex', marginBottom: '28px', padding: '4px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px',
          }}>
            {[
              { key: 'login', label: 'Login' },
              { key: 'register', label: 'Register' },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setError('') }} style={{
                flex: 1, padding: '9px', borderRadius: '7px',
                background: tab === t.key ? 'var(--gold)' : 'transparent',
                border: 'none',
                color: tab === t.key ? '#0a0a0a' : 'var(--text-muted)',
                fontFamily: 'var(--font-montserrat)', fontWeight: '600', fontSize: '13px',
                cursor: 'pointer', transition: 'background 0.2s, color 0.2s',
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

          <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '-8px', marginBottom: '20px', lineHeight: '1.5' }}>
            By continuing, you agree to our{' '}
            <Link href="/terms" target="_blank" style={{ color: 'var(--text-muted)' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" target="_blank" style={{ color: 'var(--text-muted)' }}>Privacy Policy</Link>.
          </p>

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

            {tab === 'register' && (
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer',
                fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5',
              }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0, cursor: 'pointer' }}
                />
                <span>
                  I have read and agree to the{' '}
                  <Link href="/terms" target="_blank" style={{ color: 'var(--gold)' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" style={{ color: 'var(--gold)' }}>Privacy Policy</Link>.
                </span>
              </label>
            )}

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
              disabled={loading || (tab === 'register' && !agreedToTerms)}
              style={{ width: '100%', marginTop: '4px', opacity: (loading || (tab === 'register' && !agreedToTerms)) ? 0.6 : 1 }}
            >
              {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
            </button>
          </div>

          <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '28px', textAlign: 'center' }}>
            © 2024 ShadowBoosting.co — All rights reserved.
          </p>
        </div>
      </div>
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
