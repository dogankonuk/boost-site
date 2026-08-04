'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCurrency, CURRENCY_SYMBOLS } from '@/context/CurrencyContext'
import { useCart } from '@/context/CartContext'

export default function Navbar() {
  const [search, setSearch] = useState('')
  const [user, setUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef(null)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const currencyRef = useRef(null)
  const [isBooster, setIsBooster] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [gamesMenuOpen, setGamesMenuOpen] = useState(false)
  const [navGames, setNavGames] = useState([])
  const [selectedGameSlug, setSelectedGameSlug] = useState(null)
  const [gamesSearch, setGamesSearch] = useState('')
  const gamesMenuRef = useRef(null)
  const { currency, setCurrency, format } = useCurrency()
  const { count: cartCount } = useCart()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    if (token && username) {
      setUser({ username })
      fetch('/api/booster?type=me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(d => setIsBooster(!!(d.success && d.data && d.data.status === 'active')))
        .catch(() => setIsBooster(false))
      fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(d => setNotifications(d.success ? d.data : []))
        .catch(() => setNotifications([]))
    }

    fetch('/api/games')
      .then(res => res.json())
      .then(d => { if (d.success) setNavGames(d.data) })
      .catch(() => setNavGames([]))

    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
      if (gamesMenuRef.current && !gamesMenuRef.current.contains(e.target)) {
        setGamesMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUser(null)
    setIsBooster(false)
    setNotifications([])
    setDropdownOpen(false)
    router.push('/')
  }

  async function handleSearch(val) {
    setSearch(val)
    if (!val.trim()) { setSearchResults([]); setSearchOpen(false); return }
    setSearchLoading(true)
    setSearchOpen(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`)
      const d = await res.json()
      if (d.success) setSearchResults(d.data)
    } catch {}
    setSearchLoading(false)
  }

  async function markNotifRead(n) {
    if (!n.isRead) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))
      const token = localStorage.getItem('token')
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'markRead', id: n.id }),
      }).catch(() => {})
    }
    setNotifOpen(false)
    if (n.link) router.push(n.link)
  }

  async function markAllNotifsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    const token = localStorage.getItem('token')
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'markAllRead' }),
    }).catch(() => {})
  }

  function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <nav style={{

      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="navbar-inner" style={{
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

        <div ref={gamesMenuRef} className="navbar-desktop-only" style={{ position: 'relative', alignItems: 'center' }}>
          <button onClick={() => setGamesMenuOpen(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontFamily: 'var(--font-inter)', fontWeight: '500', fontSize: '14px',
            color: gamesMenuOpen ? 'var(--gold)' : 'var(--text-muted)',
            padding: '6px 12px', borderRadius: '6px',
            transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = gamesMenuOpen ? 'var(--gold)' : 'var(--text-muted)'}
          >
            Games
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              style={{ transform: gamesMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {gamesMenuOpen && (
            <GamesMegaMenu
              navGames={navGames}
              selectedGameSlug={selectedGameSlug}
              setSelectedGameSlug={setSelectedGameSlug}
              gamesSearch={gamesSearch}
              setGamesSearch={setGamesSearch}
              format={format}
              onClose={() => setGamesMenuOpen(false)}
            />
          )}
        </div>

        <Link href="/blog" className="navbar-desktop-only" style={{
          fontFamily: 'var(--font-inter)',
          fontWeight: '500', fontSize: '14px',
          color: 'var(--text-muted)',
          padding: '6px 12px', borderRadius: '6px',
          transition: 'color 0.2s',
          textDecoration: 'none',
          alignItems: 'center',
        }}
          onMouseEnter={e => e.target.style.color = 'var(--gold)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >
          Blog
        </Link>

        <div ref={searchRef} className="navbar-search" style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
  <input
        value={search}
        onChange={e => handleSearch(e.target.value)}
        onFocus={() => search && setSearchOpen(true)}
        placeholder="Search games & services..."
        style={{
          width: '100%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px 16px',
          color: '#fff', fontSize: '13px',
          fontFamily: 'var(--font-inter)',
          outline: 'none',
        }}
      />

      {searchOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: '100%', minWidth: '320px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', zIndex: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          {searchLoading ? (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              No results found
            </div>
          ) : (
            <div>
              {searchResults.map((result, i) => (
                <a key={i} href={result.url} onClick={() => { setSearchOpen(false); setSearch('') }}
                  style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 16px', cursor: 'pointer',
                    borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {result.image ? (
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        backgroundImage: `url(${result.image})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        flexShrink: 0, border: '1px solid var(--border)',
                      }} />
                    ) : (
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'var(--bg-elevated)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', border: '1px solid var(--border)',
                      }}>{result.type === 'post' ? '📝' : '🎮'}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600', fontFamily: 'var(--font-montserrat)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {result.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {result.type === 'game' || result.type === 'post' ? result.category : `${result.gameName} · ${format(result.basePriceUSD)}`}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                      background: result.type === 'game' ? 'rgba(245,197,24,0.1)' : result.type === 'post' ? 'rgba(147,51,234,0.1)' : 'var(--bg-elevated)',
                      color: result.type === 'game' ? 'var(--gold)' : result.type === 'post' ? 'var(--violet)' : 'var(--text-muted)',
                      border: `1px solid ${result.type === 'game' ? 'var(--gold)' : result.type === 'post' ? 'var(--violet)' : 'var(--border)'}`,
                      fontFamily: 'var(--font-montserrat)', fontWeight: '600', flexShrink: 0,
                    }}>
                      {result.type === 'game' ? 'Game' : result.type === 'post' ? 'Post' : 'Service'}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

        <div className="navbar-desktop-only" style={{ marginLeft: 'auto', gap: '20px', alignItems: 'center' }}>
          <div ref={currencyRef} style={{ position: 'relative' }}>
            <button onClick={() => setCurrencyOpen(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '6px 10px',
              cursor: 'pointer', transition: 'border-color 0.2s',
              color: '#fff', fontSize: '13px', fontFamily: 'var(--font-montserrat)', fontWeight: '600',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {CURRENCY_SYMBOLS[currency]} {currency}
              <svg width="10" height="10" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {currencyOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '6px',
                minWidth: '120px', zIndex: 200,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {Object.keys(CURRENCY_SYMBOLS).map(code => (
                  <button key={code} onClick={() => { setCurrency(code); setCurrencyOpen(false) }} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '8px 10px', borderRadius: '8px',
                    background: currency === code ? 'rgba(245,197,24,0.1)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    color: currency === code ? 'var(--gold)' : 'var(--text-muted)',
                    fontSize: '13px', fontFamily: 'var(--font-inter)', fontWeight: '500',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => { if (currency !== code) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { if (currency !== code) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ width: '16px' }}>{CURRENCY_SYMBOLS[code]}</span> {code}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(v => !v)} aria-label="Notifications" style={{
              position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <BellIcon />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-8px',
                  background: 'var(--gold)', color: '#0a0a0a',
                  fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-montserrat)',
                  borderRadius: '20px', minWidth: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', lineHeight: 1,
                }}>{notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}</span>
              )}
            </button>

            {notifOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', width: '340px', zIndex: 200,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>
                    Notifications
                  </span>
                  {notifications.some(n => !n.isRead) && (
                    <button onClick={markAllNotifsRead} style={{
                      background: 'none', border: 'none', color: 'var(--gold)',
                      fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-inter)',
                    }}>Mark all read</button>
                  )}
                </div>

                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 8).map(n => (
                      <div key={n.id} onClick={() => markNotifRead(n)} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '12px 16px', cursor: n.link ? 'pointer' : 'default',
                        background: n.isRead ? 'transparent' : 'rgba(245,197,24,0.05)',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(245,197,24,0.05)'}
                      >
                        {!n.isRead && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, marginTop: '5px' }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', color: '#fff', fontWeight: n.isRead ? '400' : '600', fontFamily: 'var(--font-montserrat)' }}>
                            {n.title}
                          </div>
                          {n.body && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{n.body}</div>
                          )}
                          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>{timeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Link href="/notifications" onClick={() => setNotifOpen(false)} style={{
                  display: 'block', textAlign: 'center', padding: '10px',
                  fontSize: '12px', color: 'var(--gold)', textDecoration: 'none',
                  fontFamily: 'var(--font-montserrat)', fontWeight: '600',
                }}>
                  See all notifications
                </Link>
              </div>
            )}
          </div>

          <NavIcon href="/cart" label="Cart" badge={cartCount}><CartIcon /></NavIcon>

          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button onClick={() => setDropdownOpen(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '6px 12px',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  width: '24px', height: '24px',
                  background: 'var(--gold)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '800', color: '#0a0a0a',
                  fontFamily: 'var(--font-montserrat)',
                }}>
                  {user.username[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', color: '#fff', fontFamily: 'var(--font-inter)', fontWeight: '500' }}>
                  {user.username}
                </span>
                <svg width="12" height="12" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '8px',
                  minWidth: '180px', zIndex: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  <DropdownItem href="/dashboard" icon="🏠" label="Dashboard" onClick={() => setDropdownOpen(false)} />
                  <DropdownItem href="/dashboard?tab=orders" icon="📦" label="My Orders" onClick={() => setDropdownOpen(false)} />
                  <DropdownItem href="/dashboard?tab=account" icon="⚙️" label="My Account" onClick={() => setDropdownOpen(false)} />
                  {isBooster && (
                    <DropdownItem href="/booster" icon="🛠️" label="Booster Panel" onClick={() => setDropdownOpen(false)} />
                  )}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />
                  <button onClick={logout} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    background: 'transparent', border: 'none',
                    color: '#ff6666', fontSize: '13px', cursor: 'pointer',
                    fontFamily: 'var(--font-inter)', transition: 'background 0.15s',
                    textAlign: 'left',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,100,100,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--gold)', border: 'none',
                borderRadius: '8px', padding: '7px 16px',
                cursor: 'pointer', fontFamily: 'var(--font-montserrat)',
                fontWeight: '600', fontSize: '13px', color: '#0a0a0a',
              }}>
                Sign In
              </button>
            </Link>
          )}
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(v => !v)}
          aria-label="Menu"
          style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            color: '#fff', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px',
          }}
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div style={{
          borderTop: '1px solid var(--border)', background: 'var(--bg)',
          padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search games & services..."
            style={{
              width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px',
              fontFamily: 'var(--font-inter)', outline: 'none',
            }}
          />
          {searchOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '-6px' }}>
              {searchLoading ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Searching...</span>
              ) : searchResults.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No results found</span>
              ) : (
                searchResults.map((result, i) => (
                  <a key={i} href={result.url} onClick={() => { setMobileMenuOpen(false); setSearchOpen(false); setSearch('') }}
                    style={{
                      fontSize: '13px', color: '#fff', textDecoration: 'none',
                      padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: '8px',
                    }}>
                    {result.name}
                  </a>
                ))
              )}
            </div>
          )}

          <MobileMenuLink href="/games" onClick={() => setMobileMenuOpen(false)}>Games</MobileMenuLink>
          <MobileMenuLink href="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</MobileMenuLink>
          <MobileMenuLink href="/apply" onClick={() => setMobileMenuOpen(false)}>Work with us</MobileMenuLink>

          <div style={{ display: 'flex', gap: '8px' }}>
            {Object.keys(CURRENCY_SYMBOLS).map(code => (
              <button key={code} onClick={() => setCurrency(code)} style={{
                flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                background: currency === code ? 'rgba(245,197,24,0.1)' : 'var(--bg-elevated)',
                border: `1px solid ${currency === code ? 'var(--gold)' : 'var(--border)'}`,
                color: currency === code ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: '13px', fontFamily: 'var(--font-montserrat)', fontWeight: '600',
              }}>
                {CURRENCY_SYMBOLS[code]} {code}
              </button>
            ))}
          </div>

          <MobileMenuLink href="/notifications" onClick={() => setMobileMenuOpen(false)}>
            Notifications{notifications.filter(n => !n.isRead).length > 0 && ` (${notifications.filter(n => !n.isRead).length})`}
          </MobileMenuLink>
          <MobileMenuLink href="/cart" onClick={() => setMobileMenuOpen(false)}>
            Cart{cartCount > 0 && ` (${cartCount})`}
          </MobileMenuLink>

          <div style={{ borderTop: '1px solid var(--border)', margin: '2px 0' }} />

          {user ? (
            <>
              <MobileMenuLink href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</MobileMenuLink>
              <MobileMenuLink href="/dashboard?tab=orders" onClick={() => setMobileMenuOpen(false)}>My Orders</MobileMenuLink>
              <MobileMenuLink href="/dashboard?tab=account" onClick={() => setMobileMenuOpen(false)}>Account Settings</MobileMenuLink>
              {isBooster && (
                <MobileMenuLink href="/booster" onClick={() => setMobileMenuOpen(false)}>Booster Panel</MobileMenuLink>
              )}
              <button onClick={() => { logout(); setMobileMenuOpen(false) }} style={{
                textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                color: '#ff6666', fontSize: '14px', fontFamily: 'var(--font-inter)', padding: '4px 0',
              }}>
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%', padding: '11px' }}>
                Sign In
              </button>
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}

function groupServices(services) {
  const grouped = {}
  services.forEach(s => {
    const cat = s.serviceCategory || 'General'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(s)
  })
  return grouped
}

function GamesMegaMenu({ navGames, selectedGameSlug, setSelectedGameSlug, gamesSearch, setGamesSearch, format, onClose }) {
  const filteredGames = navGames.filter(g => g.name.toLowerCase().includes(gamesSearch.trim().toLowerCase()))
  const selectedGame = navGames.find(g => g.slug === selectedGameSlug)
    || navGames.find(g => (g.services?.length || 0) > 0)
    || navGames[0]

  const hotServices = navGames
    .flatMap(g => (g.services || []).filter(s => s.isHot).map(s => ({ ...s, game: g })))
    .slice(0, 6)

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', zIndex: 190,
      }} />
      <div style={{
        position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 200,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        maxHeight: 'calc(100vh - 64px)', overflowY: 'auto',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 32px', position: 'relative', display: 'flex', gap: '28px' }}>
          <button onClick={onClose} aria-label="Close" style={{
            position: 'absolute', top: '0px', right: '32px',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
          >
            <CloseIcon />
          </button>

          <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid var(--border)', paddingRight: '24px' }}>
            <input
              value={gamesSearch}
              onChange={e => setGamesSearch(e.target.value)}
              placeholder="Search game..."
              style={{
                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px',
                fontFamily: 'var(--font-inter)', outline: 'none', marginBottom: '14px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '400px', overflowY: 'auto' }}>
              {filteredGames.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '8px 0' }}>No games found</div>
              ) : filteredGames.map(g => {
                const active = selectedGame?.slug === g.slug
                return (
                  <button key={g.id} onClick={() => setSelectedGameSlug(g.slug)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left',
                    padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(245,197,24,0.1)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                      background: 'var(--bg-elevated)',
                      backgroundImage: g.coverImage ? `url(${g.coverImage})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--border)',
                    }} />
                    <span style={{
                      flex: 1, minWidth: 0, fontSize: '13px', fontFamily: 'var(--font-montserrat)', fontWeight: '600',
                      color: active ? 'var(--gold)' : '#fff',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{g.name}</span>
                    {active && (
                      <svg width="12" height="12" fill="none" stroke="var(--gold)" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
            <Link href="/games" onClick={onClose} style={{
              display: 'block', marginTop: '14px', fontSize: '12px', color: 'var(--gold)',
              fontFamily: 'var(--font-montserrat)', fontWeight: '600', textDecoration: 'none',
            }}>
              View All Games →
            </Link>
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingRight: '24px' }}>
            {selectedGame ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0,
                    backgroundImage: selectedGame.coverImage ? `url(${selectedGame.coverImage})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--border)',
                  }} />
                  <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-montserrat)', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {selectedGame.name}
                  </h3>
                </div>

                {(selectedGame.services?.length || 0) === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    No services listed yet for this game — check back soon.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
                    {Object.entries(groupServices(selectedGame.services)).map(([category, services]) => (
                      <div key={category}>
                        <h4 style={{
                          fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)',
                          fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                          margin: '0 0 10px',
                        }}>{category}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {services.map(s => (
                            <Link key={s.id} href={`/order/${s.id}`} onClick={onClose} style={{
                              fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none',
                              transition: 'color 0.15s',
                            }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                              {s.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading games...</div>
            )}
          </div>

          <div style={{ width: '280px', flexShrink: 0, borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
            <h4 style={{
              fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)',
              fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px',
            }}>🔥 Popular Services</h4>
            {hotServices.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Nothing hot right now.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {hotServices.map(s => (
                  <Link key={s.id} href={`/order/${s.id}`} onClick={onClose} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', gap: '10px', padding: '10px', borderRadius: '10px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '8px', flexShrink: 0,
                        background: 'var(--bg-card)',
                        backgroundImage: s.imageUrl ? `url(${s.imageUrl})` : (s.game?.coverImage ? `url(${s.game.coverImage})` : 'none'),
                        backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--border)',
                      }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{s.game?.name}</div>
                        <div style={{
                          fontSize: '12px', color: '#fff', fontWeight: '600', fontFamily: 'var(--font-montserrat)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{s.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: '700', marginTop: '2px' }}>
                          from {format(s.basePrice)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function MobileMenuLink({ href, onClick, children }) {
  return (
    <Link href={href} onClick={onClick} style={{
      color: '#fff', fontSize: '14px', fontFamily: 'var(--font-inter)', textDecoration: 'none',
    }}>
      {children}
    </Link>
  )
}

function DropdownItem({ href, icon, label, onClick }) {
  return (
    <Link href={href} onClick={onClick} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 12px', borderRadius: '8px',
        color: 'var(--text-muted)', fontSize: '13px',
        fontFamily: 'var(--font-inter)', transition: 'background 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span>{icon}</span> {label}
      </div>
    </Link>
  )
}

function NavIcon({ href, label, children, badge }) {
  return (
    <Link href={href} aria-label={label} style={{
      position: 'relative',
      color: 'var(--text-muted)', display: 'flex',
      alignItems: 'center', transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: '-6px', right: '-8px',
          background: 'var(--gold)', color: '#0a0a0a',
          fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-montserrat)',
          borderRadius: '20px', minWidth: '16px', height: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px', lineHeight: 1,
        }}>{badge > 9 ? '9+' : badge}</span>
      )}
    </Link>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}