'use client'
import Link from 'next/link'

export default function GamesGrid({ games }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '20px',
    }}>
      {games.map(game => (
        <Link key={game.id} href={`/games/${game.slug}`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'border-color 0.2s, transform 0.15s',
            height: '100%',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--gold)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              height: '200px',
              background: 'var(--bg-elevated)',
              backgroundImage: game.coverImage ? `url(${game.coverImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}>
              {game.coverImage && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 50%, var(--bg-card) 100%)',
                }} />
              )}
              {!game.coverImage && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '48px', opacity: 0.2 }}>🎮</span>
                </div>
              )}
            </div>

            <div style={{ padding: '16px' }}>
              <h3 className="h4" style={{ color: '#fff', marginBottom: '6px' }}>{game.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '11px', color: 'var(--gold)',
                  fontFamily: 'var(--font-montserrat)', fontWeight: '600',
                }}>{game.category}</span>
                <span style={{
                  fontSize: '11px', color: 'var(--text-dim)',
                  fontFamily: 'var(--font-inter)',
                }}>{game.services.length} services</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}