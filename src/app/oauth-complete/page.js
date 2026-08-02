'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SessionProvider, useSession } from 'next-auth/react'

export default function OAuthCompletePage() {
  return (
    <SessionProvider>
      <OAuthCompleteContent />
    </SessionProvider>
  )
}

function OAuthCompleteContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session?.appToken) {
      localStorage.setItem('token', session.appToken)
      localStorage.setItem('username', session.appUsername)
      router.replace('/dashboard')
    } else if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, session, router])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Signing you in...</p>
    </div>
  )
}
