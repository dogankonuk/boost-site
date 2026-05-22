'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [search, setSearch] = useState('')

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 48px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--gold)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '800', color: '#0a0a0a',
            fontFamily: 'var(--font-montserrat)',
          }}>S</div>
          <span style={{
            fontFamily: 'var(--font-montserrat)',
            fontWeight: '700', fontSize: '15px', color: '#fff',
          }}>ShadowBoosting</span>
        </Link>

        <Link href="/games" style={{
          fontFamily: 'var(--font-inter)',
          fontWeight: '500', fontSize: '14px',
          color: 'var(--text-muted)',
          padding: '6px 12px', borderRadius: '6px',
          transition: 'color 0.2s',
          textDecoration: 'none',
        }}
          onMouseEnter={e => e.target.style.color = 'var(--gold)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >
          Oyunlar
        </Link>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Oyun/servis ara..."
          style={{
            flex: 1, maxWidth: '320px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#fff', fontSize: '13px',
            fontFamily: 'var(--font-inter)',
            outline: 'none',
          }}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <NavIcon href="/notifications" label="Bildirimler"><BellIcon /></NavIcon>
          <NavIcon href="/cart" label="Sepet"><CartIcon /></NavIcon>
          <NavIcon href="/login" label="Hesap"><UserIcon /></NavIcon>
        </div>
      </div>
    </nav>
  )
}

function NavIcon({ href, label, children }) {
  return (
    <Link href={href} aria-label={label} style={{
      color: 'var(--text-muted)', display: 'flex',
      alignItems: 'center', transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
    >
      {children}
    </Link>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}