'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import useFinePointer from '@/hooks/useFinePointer'
import AdaptiveTilt from './AdaptiveTilt'
import { FlameIcon } from './BrandIcons'

export default function GamesSlider() {
  const shouldReduceMotion = useReducedMotion()
  const tiltEnabled = useFinePointer() && !shouldReduceMotion
  const [games, setGames] = useState([])
  const [offset, setOffset] = useState(0)
  const [paused, setPaused] = useState(false)
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

  function buildRoute(gameId) {
    setPaused(true)
    window.dispatchEvent(new window.CustomEvent('shadow-route:select-game', { detail: { gameId } }))
  }

  // Auto-advance so the homepage feels alive; pauses while the visitor is
  // hovering or has manually interacted, loops back to the start at the end.
  useEffect(() => {
    if (shouldReduceMotion || paused || maxOffset <= 0) return
    const id = setInterval(() => {
      setOffset(o => (o >= maxOffset ? 0 : o + 1))
    }, 3500)
    return () => clearInterval(id)
  }, [paused, maxOffset, shouldReduceMotion])

  return (
    <section style={{ padding: '0 0 48px' }}>
      <motion.div className="container" ref={containerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.15, ease: 'easeOut' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NavBtn onClick={prev} disabled={offset === 0}>&#8249;</NavBtn>

          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, padding: '8px 0' }}>
            <div style={{
              display: 'flex',
              gap: `${gap}px`,
              transform: `translateX(-${offset * (cardW + gap)}px)`,
              transition: shouldReduceMotion ? 'none' : 'transform 0.3s ease',
            }}>
              {games.map(game => (
                <div key={game.id} style={{ flexShrink: 0 }}>
                  <AdaptiveTilt
                    enabled={tiltEnabled}
                    tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03} transitionSpeed={1200}
                    glareEnable glareMaxOpacity={0.18} glareColor="#f5c518" glarePosition="all"
                    glareBorderRadius="16px" tiltReverse
                    style={{ width: `${cardW}px` }}
                  >
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
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <Link
                      href={`/games/${game.slug}`}
                      aria-label={`View ${game.name} services`}
                      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
                    />
                    {game.coverImage && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)',
                        borderRadius: '14px',
                      }} />
                    )}
                    {game.services?.some(s => s.isHot) && (
                      <span style={{
                        position: 'absolute', top: '10px', left: '10px', zIndex: 2,
                        fontSize: '10px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px',
                        background: 'linear-gradient(90deg, var(--gold), var(--gold-soft))', color: '#0a0a0a',
                        fontFamily: 'var(--font-montserrat)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}><FlameIcon size={11} /> HOT</span>
                    )}
                    <div style={{
                      fontFamily: 'var(--font-montserrat)',
                      fontSize: '14px', fontWeight: '700',
                      color: '#fff', textAlign: 'center',
                      lineHeight: '1.3', position: 'relative', zIndex: 2, pointerEvents: 'none',
                    }}>{game.name}</div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      marginTop: '6px', position: 'relative', zIndex: 2, pointerEvents: 'none',
                    }}>
                      <span style={{
                        fontSize: '12px', color: 'var(--gold)',
                        fontFamily: 'var(--font-inter)', fontWeight: '500',
                      }}>{game.category}</span>
                      {game.services?.length > 0 && (
                        <>
                          <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>&bull;</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-inter)' }}>
                            {game.services.length} service{game.services.length !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      className="game-route-action"
                      data-route-game-id={game.id}
                      onClick={() => buildRoute(game.id)}
                      aria-label={`Build a route for ${game.name}`}
                    >
                      Build route <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  </AdaptiveTilt>
                </div>
              ))}
            </div>
          </div>

          <NavBtn onClick={next} disabled={offset >= maxOffset}>&#8250;</NavBtn>
        </div>
      </motion.div>
    </section>
  )
}

function NavBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '44px', height: '44px',
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
