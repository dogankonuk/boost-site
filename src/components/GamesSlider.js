'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function GamesSlider() {
  const [games, setGames] = useState([])
  const [offset, setOffset] = useState(0)
  const containerRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(5)
  const cardW = 200
  const gap = 12

  useEffect(() => {
    fetch('/api/games')
      .then(r => r.json())
      .then(d => { if (d.data?.length > 0) setGames(d.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function updateVisible() {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 96
        const count = Math.floor((containerWidth + gap) / (cardW + gap))
        setVisibleCount(Math.max(1, count))
      }
    }
    updateVisible()
    window.addEventListener('resize', updateVisible)
    return () => window.removeEventListener('resize', updateVisible)
  }, [])

  const maxOffset = Math.max(0, games.length - visibleCount)

  function prev() { setOffset(o => Math.max(0, o - 1)) }
  function next() { setOffset(o => Math.min(maxOffset, o + 1)) }

  return (
    <section style={{ padding: '0 0 48px' }}>
      <div className="container" ref={containerRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NavBtn onClick={prev} disabled={offset === 0}>&#8249;</NavBtn>

          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, padding: '8px 0' }}>
            <div style={{
              display: 'flex',
              gap: `${gap}px`,
              transform: `translateX(-${offset * (cardW + gap)}px)`,
              transition: 'transform 0.3s ease',
            }}>
              {games.map(game => (
                <Link key={game.id} href={`/games/${game.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{
                    width: `${cardW}px`,
                    height: '280px',
                    background: 'var(--bg-elevated)',
                    backgroundImage: game.coverImage ? `url(${game.coverImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '2px solid var(--gold)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {game.coverImage && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)',
                        borderRadius: '14px',
                      }} />
                    )}
                    <div style={{
                      fontFamily: 'var(--font-montserrat)',
                      fontSize: '14px', fontWeight: '700',
                      color: '#fff', textAlign: 'center',
                      lineHeight: '1.3', position: 'relative', zIndex: 1,
                    }}>{game.name}</div>
                    <div style={{
                      fontSize: '12px', color: 'var(--gold)',
                      marginTop: '6px', fontFamily: 'var(--font-inter)',
                      fontWeight: '500', position: 'relative', zIndex: 1,
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
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--gold)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {children}
    </button>
  )
}