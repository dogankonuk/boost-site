'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('This link is invalid.'); return }

    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verifyEmail', token }),
    })
      .then(res => res.json())
      .then(d => {
        if (d.success) setStatus('success')
        else { setStatus('error'); setError(d.error || 'An error occurred') }
      })
      .catch(() => { setStatus('error'); setError('Failed to connect to the server') })
  }, [token])

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
        borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', textAlign: 'center',
      }}>
        {status === 'loading' && (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Verifying your email...</p>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            <h1 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: '700', fontSize: '18px', color: '#fff', marginBottom: '8px' }}>
              Email verified!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Your account is now fully active.</p>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%', padding: '12px' }}>Go to Dashboard</button>
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h1 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: '700', fontSize: '18px', color: '#fff', marginBottom: '8px' }}>
              Verification failed
            </h1>
            <p style={{ color: '#ff6666', fontSize: '14px' }}>{error}</p>
          </>
        )}
      </div>
    </div>
  )
}
