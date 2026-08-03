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

export default function MessageThread({ orderId }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  const load = useCallback(async (silent) => {
    if (!silent) setLoading(true)
    try {
      const res = await authFetch(`/api/messages?orderId=${orderId}`)
      if (res) {
        const d = await res.json()
        if (d.success) setMessages(d.data)
      }
    } catch {}
    if (!silent) setLoading(false)
  }, [orderId])

  useEffect(() => {
    if (!open) return
    load()
    const interval = setInterval(() => load(true), 8000)
    return () => clearInterval(interval)
  }, [open, load])

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [open, messages])

  async function send() {
    const body = text.trim()
    if (!body) return
    setSending(true)
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
          alert(d.error || 'Could not send message')
        }
      }
    } catch {}
    setSending(false)
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '12px', padding: 0,
          display: 'flex', alignItems: 'center', gap: '5px',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        💬 {open ? 'Hide messages' : 'Messages'}{messages.length > 0 && ` (${messages.length})`}
      </button>

      {open && (
        <div style={{ marginTop: '10px' }}>
          <div
            ref={listRef}
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
                    background: m.isMine ? 'rgba(245,197,24,0.14)' : 'rgba(68,170,255,0.12)',
                    border: `1px solid ${m.isMine ? 'rgba(245,197,24,0.35)' : 'rgba(68,170,255,0.35)'}`,
                  }}>
                    <div style={{
                      fontSize: '10px', fontWeight: '700', marginBottom: '2px',
                      color: m.isMine ? 'var(--gold)' : '#44aaff',
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
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type a message..."
              style={{
                flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none',
              }}
            />
            <button className="btn-primary" onClick={send} disabled={sending || !text.trim()} style={{ fontSize: '12px', padding: '8px 16px', flexShrink: 0 }}>
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
