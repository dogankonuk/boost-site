'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PLACEHOLDER_GAMES = [
  { id: 1, slug: 'dune-awakening', name: 'Dune Awakening', category: 'RPG' },
  { id: 2, slug: 'fortnite', name: 'Fortnite', category: 'Battle Royale' },
  { id: 3, slug: 'wow', name: 'World of Warcraft', category: 'MMO' },
  { id: 4, slug: 'eft', name: 'Escape From Tarkov', category: 'Extraction' },
  { id: 5, slug: 'diablo4', name: 'Diablo IV', category: 'ARPG' },
  { id: 6, slug: 'poe2', name: 'Path of Exile 2', category: 'ARPG' },
  { id: 7, slug: 'marvel-rivals', name: 'Marvel Rivals', category: 'Hero Shooter' },
  { id: 8, slug: 'bdo', name: 'Black Desert Online', category: 'MMO' },
]

export default function GamesSlider() {
  const [games, setGames] = useState(PLACEHOLDER_GAMES)
  const [offset, setOffset] = useState(0)
  const visible = 5
  const cardW = 200
  const gap = 12

  useEffect(() => {
    fetch('/api/games')
      .then(r => r.json())
      .then(d => { if (d.data?.length > 0) setGames(d.data) })
      .catch(() => {})
  }, [])

  const maxOffset = Math.max(0, games.length - visible)

  function prev() { setOffset(o => Math.max(0, o - 1)) }
  function next() { setOffset(o => Math.min(maxOffset, o + 1)) }

  return (
    <section style={{ padding: '0 0 48px' }}>
  <div style={{
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 48px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <NavBtn onClick={prev} disabled={offset === 0}>&#8249;</NavBtn>

        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div style={{
            display: 'flex',
            gap: `${gap}px`,
            transform: `translateX(-${offset * (cardW + gap)}px)`,
            transition: 'transform 0.3s ease',
            paddingTop: '8px',
            paddingBottom: '8px',
          }}>
            {games.map(game => (
              <Link key={game.id} href={`/games/${game.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  width: `${cardW}px`,
                  height: '280px',
                  background: 'var(--bg-elevated)',
                  border: '2px solid var(--gold)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, border-color 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    fontFamily: 'var(--font-montserrat)',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#fff',
                    textAlign: 'center',
                    lineHeight: '1.3',
                    zIndex: 1,
                  }}>{game.name}</div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--gold)',
                    marginTop: '6px',
                    fontFamily: 'var(--font-inter)',
                    fontWeight: '500',
                    zIndex: 1,
                  }}>{game.category}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <NavBtn onClick={next} disabled={offset >= maxOffset}>&#8250;</NavBtn>
      </div>
      </div>
    </section>
  )
}

function NavBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '40px', height: '40px',
      background: disabled ? 'var(--bg-elevated)' : 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '50%',
      color: disabled ? 'var(--text-dim)' : '#fff',
      fontSize: '20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer',
      flexShrink: 0,
      transition: 'border-color 0.2s, color 0.2s',
    }}>
      {children}
    </button>
  )
}