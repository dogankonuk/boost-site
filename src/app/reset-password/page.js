'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetPassword', token, newPassword: password }),
      })
      const d = await res.json()
      if (d.success) {
        setDone(true)
        setTimeout(() => router.push('/login'), 2000)
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
            justifyContent: 'center', fontSize: '20px', fontWeight: '700',
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
        <h1 style={{
          fontFamily: 'var(--font-montserrat)', fontWeight: '700',
          fontSize: '18px', color: '#fff', marginBottom: '20px',
        }}>Choose a new password</h1>

        {!token ? (
          <p style={{ color: '#ff6666', fontSize: '14px' }}>This link is invalid. Please request a new password reset.</p>
        ) : done ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Your password has been updated. Redirecting to login...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? 'Please wait...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>

      <Link href="/login" style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '20px', textDecoration: 'none' }}>
        ← Back to login
      </Link>
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
