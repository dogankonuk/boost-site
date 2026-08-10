'use client'
import { useState } from 'react'

const fieldStyle = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px',
  fontFamily: 'var(--font-inter)', outline: 'none',
}
const labelStyle = { fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', orderNumber: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { type: 'success' | 'error', text }

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setResult({ type: 'error', text: 'Please fill in your name, email, and message.' })
      return
    }
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (d.success) {
        setResult({ type: 'success', text: "Thanks — we've got your message and will get back to you within 24 hours." })
        setForm({ name: '', email: '', orderNumber: '', message: '' })
      } else {
        setResult({ type: 'error', text: d.error || 'We could not send your message. Please try again.' })
      }
    } catch {
      setResult({ type: 'error', text: 'Could not connect to the server. Please try again.' })
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={submit} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
      padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label htmlFor="contact-name" style={labelStyle}>Name *</label>
          <input id="contact-name" type="text" value={form.name} onChange={e => update('name', e.target.value)} style={fieldStyle} required />
        </div>
        <div>
          <label htmlFor="contact-email" style={labelStyle}>Email *</label>
          <input id="contact-email" type="email" value={form.email} onChange={e => update('email', e.target.value)} style={fieldStyle} required />
        </div>
      </div>

      <div>
        <label htmlFor="contact-order" style={labelStyle}>Order Number (optional)</label>
        <input id="contact-order" type="text" placeholder="BST-..." value={form.orderNumber} onChange={e => update('orderNumber', e.target.value)} style={fieldStyle} />
      </div>

      <div>
        <label htmlFor="contact-message" style={labelStyle}>Message *</label>
        <textarea id="contact-message" rows={5} value={form.message} onChange={e => update('message', e.target.value)}
          placeholder="Tell us what you need help with..."
          style={{ ...fieldStyle, resize: 'vertical' }} required />
      </div>

      {result && (
        <p role={result.type === 'error' ? 'alert' : 'status'} style={{
          fontSize: '13px', margin: 0, lineHeight: '1.6',
          color: result.type === 'error' ? '#ff8a8a' : '#4caf50',
        }}>
          {result.text}
        </p>
      )}

      <button type="submit" className="btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '13px' }}>
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
