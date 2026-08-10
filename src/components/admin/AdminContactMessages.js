'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const STATUS = {
  new: { label: 'Yeni', color: 'var(--gold)', bg: 'rgba(245,197,24,0.12)' },
  read: { label: 'Okundu', color: 'var(--text-muted)', bg: 'var(--bg-elevated)' },
  resolved: { label: 'Çözüldü', color: 'var(--success)', bg: 'rgba(76,175,80,0.12)' },
}

export default function AdminContactMessages({ secret, initialMessageId = null }) {
  const [messages, setMessages] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(initialMessageId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  }), [secret])

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin?type=contactMessages&status=${filter}`, { headers })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Mesajlar yüklenemedi')
      setMessages(data.data)
    } catch (err) {
      setError(err.message || 'Mesajlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [filter, headers])

  useEffect(() => {
    let cancelled = false
    async function loadMessages() {
      await Promise.resolve()
      if (!cancelled) await fetchMessages()
    }
    loadMessages()
    return () => { cancelled = true }
  }, [fetchMessages])

  const selected = messages.find(message => message.id === selectedId) || null

  useEffect(() => {
    if (!selected || selected.status !== 'new') return
    let cancelled = false
    async function markRead() {
      try {
        const res = await fetch('/api/admin', {
          method: 'PATCH', headers,
          body: JSON.stringify({ type: 'contactMessage', id: selected.id, data: { status: 'read' } }),
        })
        const data = await res.json()
        if (!cancelled && res.ok && data.success) {
          setMessages(current => current.map(message => message.id === selected.id ? data.data : message))
        }
      } catch {
        // The message remains visible as new; the admin can retry explicitly.
      }
    }
    markRead()
    return () => { cancelled = true }
  }, [selected, headers])

  async function updateStatus(status) {
    if (!selected || updating) return
    setUpdating(true)
    setError('')
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH', headers,
        body: JSON.stringify({ type: 'contactMessage', id: selected.id, data: { status } }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Durum güncellenemedi')
      setMessages(current => current.map(message => message.id === selected.id ? data.data : message))
    } catch (err) {
      setError(err.message || 'Durum güncellenemedi')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Mesajlar yükleniyor...</p>

  return (
    <section aria-labelledby="contact-messages-title">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <h2 id="contact-messages-title" className="h3" style={{ color: '#fff' }}>İletişim Mesajları</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Contact formundan gelen mesajlar burada kalıcı olarak saklanır.</p>
        </div>
        <div role="group" aria-label="Mesaj filtresi" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[['all', 'Tümü'], ['new', 'Yeni'], ['read', 'Okundu'], ['resolved', 'Çözüldü']].map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}
              className={filter === key ? 'btn-primary' : 'btn-secondary'} style={{ padding: '7px 12px', fontSize: '12px' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div role="alert" style={{ padding: '12px 14px', marginBottom: '14px', color: 'var(--error)', background: 'rgba(255,102,102,0.08)', border: '1px solid rgba(255,102,102,0.25)', borderRadius: '8px' }}>{error} <button type="button" onClick={fetchMessages} className="btn-secondary" style={{ marginLeft: '10px', padding: '5px 9px' }}>Tekrar Dene</button></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.8fr) minmax(340px, 1.2fr)', gap: '14px' }} className="admin-contact-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>Bu filtrede mesaj yok.</div>
          ) : messages.map(message => {
            const meta = STATUS[message.status] || STATUS.read
            const active = message.id === selectedId
            return (
              <button key={message.id} type="button" onClick={() => setSelectedId(message.id)} aria-pressed={active} style={{
                textAlign: 'left', padding: '14px', cursor: 'pointer', borderRadius: '10px',
                background: active ? 'rgba(245,197,24,0.08)' : 'var(--bg-card)',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`, color: '#fff',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                  <strong style={{ fontFamily: 'var(--font-montserrat)', fontSize: '13px' }}>{message.name}</strong>
                  <span style={{ padding: '2px 7px', borderRadius: '20px', background: meta.bg, color: meta.color, fontSize: '10px' }}>{meta.label}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.message}</div>
                <time dateTime={message.createdAt} style={{ color: 'var(--text-dim)', fontSize: '10px', display: 'block', marginTop: '7px' }}>{new Date(message.createdAt).toLocaleString('tr-TR')}</time>
              </button>
            )
          })}
        </div>

        <div aria-live="polite">
          {selected ? (
            <article style={{ position: 'sticky', top: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h3 className="h4" style={{ color: '#fff' }}>{selected.name}</h3>
                  <a href={`mailto:${selected.email}`} style={{ color: 'var(--gold)', fontSize: '13px' }}>{selected.email}</a>
                </div>
                <time dateTime={selected.createdAt} style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{new Date(selected.createdAt).toLocaleString('tr-TR')}</time>
              </div>
              {selected.orderNumber && <div style={{ marginTop: '14px', color: 'var(--text-muted)', fontSize: '12px' }}>Sipariş: <strong style={{ color: '#fff' }}>{selected.orderNumber}</strong></div>}
              <p style={{ marginTop: '18px', whiteSpace: 'pre-wrap', color: 'var(--text)', lineHeight: '1.7', fontSize: '14px' }}>{selected.message}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                <a href={`mailto:${selected.email}?subject=${encodeURIComponent(selected.orderNumber ? `ShadowBoosting — ${selected.orderNumber}` : 'ShadowBoosting support')}`} className="btn-primary" style={{ textDecoration: 'none', padding: '8px 14px', fontSize: '12px' }}>Yanıtla</a>
                {selected.status !== 'resolved' && <button type="button" disabled={updating} onClick={() => updateStatus('resolved')} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>Çözüldü Olarak İşaretle</button>}
                {selected.status === 'resolved' && <button type="button" disabled={updating} onClick={() => updateStatus('read')} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>Yeniden Aç</button>}
              </div>
            </article>
          ) : <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>Detaylarını görmek için bir mesaj seç.</div>}
        </div>
      </div>
    </section>
  )
}
