'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgotPassword', email }),
      })
      const d = await res.json()
      if (d.success) setSent(true)
      else setError(d.error || 'An error occurred')
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
          fontSize: '18px', color: '#fff', marginBottom: '8px',
        }}>Reset your password</h1>

        {sent ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            If an account exists for <strong style={{ color: '#fff' }}>{email}</strong>, we've sent a password reset link to it. Check your inbox.
          </p>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>
              Enter the email address linked to your account and we'll send you a link to reset your password.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                disabled={loading || !email}
                style={{ width: '100%', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Please wait...' : 'Send Reset Link'}
              </button>
            </div>
          </>
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
