'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { GamepadIcon } from './BrandIcons'

export default function GamesGrid({ games }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')

  const visibleGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = normalizedQuery
      ? games.filter(game => `${game.name} ${game.category || ''}`.toLowerCase().includes(normalizedQuery))
      : [...games]

    if (sort === 'alphabetical') {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sort === 'services') {
      filtered.sort((a, b) => b.services.length - a.services.length || a.name.localeCompare(b.name))
    }

    return filtered
  }, [games, query, sort])

  return (
    <div>
      <div className="games-discovery-bar" style={{
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px',
        padding: '12px', border: '1px solid var(--border)', borderRadius: '14px',
        background: 'var(--bg-card)',
      }}>
        <label className="games-search-field" style={{
          flex: 1, minWidth: 0, minHeight: '48px', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 14px', border: '1px solid var(--border)', borderRadius: '10px',
          background: 'var(--bg-elevated)', color: 'var(--text-muted)',
        }}>
          <SearchIcon />
          <input
            type="search"
            aria-label="Search games"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search by game or genre"
            style={{
              width: '100%', minWidth: 0, border: 0, outline: 0, background: 'transparent', color: '#fff',
              fontFamily: 'var(--font-inter)', fontSize: '14px',
            }}
          />
        </label>

        <label className="games-sort-field" style={{
          minHeight: '48px', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 12px', border: '1px solid var(--border)', borderRadius: '10px',
          background: 'var(--bg-elevated)', color: 'var(--text-muted)',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'var(--font-montserrat)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort</span>
          <select
            aria-label="Sort games"
            value={sort}
            onChange={event => setSort(event.target.value)}
            style={{ border: 0, outline: 0, background: 'transparent', color: '#fff', fontFamily: 'var(--font-inter)', fontSize: '13px', cursor: 'pointer' }}
          >
            <option value="featured">Featured</option>
            <option value="alphabetical">A–Z</option>
            <option value="services">Most services</option>
          </select>
        </label>

        <div className="games-result-count" aria-live="polite" style={{
          minWidth: '72px', textAlign: 'center', color: 'var(--gold)',
          fontFamily: 'var(--font-montserrat)', fontSize: '12px', fontWeight: '700',
        }}>
          {visibleGames.length} {visibleGames.length === 1 ? 'game' : 'games'}
        </div>
      </div>

      {visibleGames.length === 0 ? (
        <div style={{
          padding: '64px 20px', textAlign: 'center', border: '1px dashed var(--border)',
          borderRadius: '16px', background: 'rgba(255,255,255,0.015)',
        }}>
          <div style={{ color: '#fff', fontFamily: 'var(--font-montserrat)', fontWeight: '700', marginBottom: '6px' }}>No games found</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Try another game name or genre.</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px',
        }}>
          {visibleGames.map(game => (
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
                  <span style={{ color: 'var(--gold)', opacity: 0.22, display: 'flex' }}><GamepadIcon size={48} /></span>
                </div>
              )}
            </div>

            <div style={{ padding: '16px' }}>
              <h2 className="h4" style={{ color: '#fff', marginBottom: '6px' }}>{game.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '11px', color: 'var(--gold)',
                  fontFamily: 'var(--font-montserrat)', fontWeight: '600',
                }}>{game.category}</span>
                <span style={{
                  fontSize: '11px', color: 'var(--text-dim)',
                  fontFamily: 'var(--font-inter)',
                }}>{game.services.length} {game.services.length === 1 ? 'service' : 'services'}</span>
              </div>
            </div>
          </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" strokeLinecap="round" />
    </svg>
  )
}
