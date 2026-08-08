'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { authFetch } from '@/lib/authFetch'

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

export default function MessageThread({ orderId, onOpen }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)
  const onOpenRef = useRef(onOpen)

  const load = useCallback(async (silent, signal) => {
    if (!silent && !signal?.aborted) {
      setLoading(true)
      setError('')
    }
    try {
      const res = await authFetch(`/api/messages?orderId=${orderId}`, { signal })
      if (res) {
        const d = await res.json()
        if (!signal?.aborted && d.success) setMessages(d.data)
        else if (!silent && !signal?.aborted) setError(d.error || 'Could not load messages. Please try again.')
      }
    } catch (error) {
      if (error.name !== 'AbortError' && !silent && !signal?.aborted) {
        setError('Could not connect to the server. Please try again.')
      }
    }
    if (!silent && !signal?.aborted) setLoading(false)
  }, [orderId])

  useEffect(() => {
    onOpenRef.current = onOpen
  }, [onOpen])

  // Fetches once on mount (silently) so the message count badge is accurate
  // even before the thread is ever expanded.
  useEffect(() => {
    const controller = new AbortController()

    async function loadInitialMessages() {
      await Promise.resolve()
      if (!controller.signal.aborted) await load(true, controller.signal)
    }

    loadInitialMessages()
    return () => controller.abort()
  }, [load])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()

    async function loadOpenMessages() {
      await Promise.resolve()
      if (!controller.signal.aborted) await load(false, controller.signal)
    }

    loadOpenMessages()
    const interval = setInterval(() => load(true, controller.signal), 8000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [open, load])

  // Opening the thread counts as having seen it — clears the order-level
  // "new message" indicator both locally and via the unread notification(s).
  useEffect(() => {
    if (!open) return
    onOpenRef.current?.()
    const controller = new AbortController()
    authFetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markReadForOrder', orderId }),
      signal: controller.signal,
    }).catch(() => {})
    return () => controller.abort()
  }, [open, orderId])

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [open, messages])

  async function send() {
    if (sending) return
    const body = text.trim()
    if (!body) return
    setSending(true)
    setError('')
    try {
      const res = await authFetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, body }),
      })
      if (res) {
        const d = await res.json()
        if (d.success) {
          setMessages(prev => [...prev, d.data])
          setText('')
        } else {
          setError(d.error || 'Could not send message. Please try again.')
        }
      }
    } catch {
      setError('Could not connect to the server. Please try again.')
    }
    setSending(false)
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`order-messages-${orderId}`}
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          background: open ? 'rgba(245,197,24,0.1)' : 'var(--bg-elevated)',
          border: `1px solid ${open ? 'rgba(245,197,24,0.3)' : 'var(--border)'}`,
          borderRadius: '20px', padding: '6px 14px', cursor: 'pointer',
          color: open ? 'var(--gold)' : 'var(--text-muted)',
          fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = '#fff' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' } }}
      >
        <ChatIcon />
        {open ? 'Hide Messages' : 'Messages'}
        {messages.length > 0 && (
          <span style={{
            background: 'var(--gold)', color: '#0a0a0a', borderRadius: '10px',
            fontSize: '10px', fontWeight: '700', padding: '1px 6px', minWidth: '16px', textAlign: 'center',
          }}>{messages.length}</span>
        )}
      </button>

      {open && (
        <div id={`order-messages-${orderId}`} style={{ marginTop: '10px' }}>
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-busy={loading}
            aria-label="Order messages"
            style={{
              maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px',
              padding: messages.length > 0 ? '10px' : 0, marginBottom: '10px',
              background: messages.length > 0 ? 'var(--bg)' : 'transparent',
              borderRadius: '10px',
            }}
          >
            {loading ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '12px', margin: 0 }}>Loading...</p>
            ) : messages.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '12px', margin: 0 }}>No messages yet — say hello!</p>
            ) : (
              messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '7px 12px', borderRadius: '12px',
                    background: m.isMine ? 'rgba(245,197,24,0.14)' : 'rgba(147,51,234,0.14)',
                    border: `1px solid ${m.isMine ? 'rgba(245,197,24,0.35)' : 'rgba(147,51,234,0.4)'}`,
                  }}>
                    <div style={{
                      fontSize: '10px', fontWeight: '700', marginBottom: '2px',
                      color: m.isMine ? 'var(--gold)' : '#c084fc',
                    }}>
                      {m.isMine ? 'You' : m.sender?.username}
                    </div>
                    <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.4', wordBreak: 'break-word' }}>{m.body}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px', textAlign: m.isMine ? 'right' : 'left' }}>
                      {timeAgo(m.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              aria-label="Write a message"
              aria-describedby={error ? `message-error-${orderId}` : undefined}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Type a message..."
              style={{
                flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none',
              }}
            />
            <button type="button" className="btn-primary" onClick={send} disabled={sending || !text.trim()} style={{ fontSize: '12px', padding: '8px 16px', flexShrink: 0 }}>
              {sending ? '...' : 'Send'}
            </button>
          </div>
          {error && (
            <p id={`message-error-${orderId}`} role="alert" style={{
              color: '#ff8a8a', fontSize: '11px', lineHeight: '1.5', marginTop: '7px',
            }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ChatIcon() {
  return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a8 8 0 1 0-8 8h6l2 2v-4a8 8 0 0 0 0-6z" strokeLinejoin="round" /></svg>
}
