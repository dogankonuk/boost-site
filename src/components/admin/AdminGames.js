'use client'
import { useState, useEffect } from 'react'

export default function AdminGames({ secret }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddGame, setShowAddGame] = useState(false)
  const [showAddService, setShowAddService] = useState(null)
  const [editService, setEditService] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [gameForm, setGameForm] = useState({ name: '', slug: '', category: '', sortOrder: 0 })
  const [serviceForm, setServiceForm] = useState({
    name: '', slug: '', basePrice: '', priceType: 'fixed',
    description: '', features: '', imageUrl: '', isHot: false,
  })
  const [msg, setMsg] = useState('')

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }

  useEffect(() => { fetchGames() }, [])

  async function fetchGames() {
    setLoading(true)
    const res = await fetch('/api/admin?type=games', { headers })
    const d = await res.json()
    if (d.success) setGames(d.data)
    setLoading(false)
  }

  async function addGame() {
    if (!gameForm.name || !gameForm.slug || !gameForm.category) {
      setMsg('Tüm alanları doldurun'); return
    }
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...gameForm, sortOrder: parseInt(gameForm.sortOrder) || 0 }),
    })
    const d = await res.json()
    if (d.success) {
      setMsg('Oyun eklendi')
      setGameForm({ name: '', slug: '', category: '', sortOrder: 0 })
      setShowAddGame(false)
      fetchGames()
    } else {
      setMsg(d.error || 'Hata')
    }
  }

  async function addService(gameId) {
    if (!serviceForm.name || !serviceForm.slug || !serviceForm.basePrice) {
      setMsg('Zorunlu alanları doldurun'); return
    }
    const res = await fetch(`/api/games/${gameId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: serviceForm.name,
        slug: serviceForm.slug,
        basePrice: parseFloat(serviceForm.basePrice),
        priceType: serviceForm.priceType,
        description: serviceForm.description || null,
        features: serviceForm.features ? serviceForm.features.split('\n').map(f => f.trim()).filter(Boolean) : null,
        imageUrl: serviceForm.imageUrl || null,
        isHot: serviceForm.isHot,
      }),
    })
    const d = await res.json()
    if (d.success) {
      setMsg('Hizmet eklendi')
      setServiceForm({ name: '', slug: '', basePrice: '', priceType: 'fixed', description: '', features: '', imageUrl: '', isHot: false })
      setShowAddService(null)
      fetchGames()
    } else {
      setMsg(d.error || 'Hata')
    }
  }

  async function saveEditService() {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        type: 'service',
        id: editService,
        data: {
          name: editForm.name,
          basePrice: parseFloat(editForm.basePrice),
          description: editForm.description || null,
          features: editForm.features ? editForm.features.split('\n').map(f => f.trim()).filter(Boolean) : null,
          imageUrl: editForm.imageUrl || null,
          isHot: editForm.isHot,
        }
      }),
    })
    setMsg('Hizmet güncellendi')
    setEditService(null)
    fetchGames()
  }

  async function toggleGame(id, isActive) {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ type: 'game', id, data: { isActive: !isActive } }),
    })
    fetchGames()
  }

  async function toggleService(id, isActive) {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ type: 'service', id, data: { isActive: !isActive } }),
    })
    fetchGames()
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>

  return (
    <div>
      {msg && (
        <div onClick={() => setMsg('')} style={{
          background: '#1a2a1a', border: '1px solid #2a4a2a',
          borderRadius: '8px', padding: '10px 16px',
          color: '#4caf50', fontSize: '13px', marginBottom: '16px', cursor: 'pointer',
        }}>{msg} ✕</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Oyunlar ({games.length})</h2>
        <button className="btn-primary" onClick={() => setShowAddGame(v => !v)}>+ Oyun Ekle</button>
      </div>

      {showAddGame && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px', marginBottom: '24px',
        }}>
          <h3 className="h4" style={{ color: '#fff', marginBottom: '16px' }}>Yeni Oyun</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <Field label="Oyun Adı *" value={gameForm.name}
              onChange={v => setGameForm(f => ({ ...f, name: v }))} />
            <Field label="Slug *" placeholder="fortnite" value={gameForm.slug}
              onChange={v => setGameForm(f => ({ ...f, slug: v.toLowerCase().replace(/\s/g, '-') }))} />
            <Field label="Kategori *" placeholder="Battle Royale" value={gameForm.category}
              onChange={v => setGameForm(f => ({ ...f, category: v }))} />
            <Field label="Sıra" type="number" value={gameForm.sortOrder}
              onChange={v => setGameForm(f => ({ ...f, sortOrder: v }))} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" onClick={addGame}>Kaydet</button>
            <button className="btn-secondary" onClick={() => setShowAddGame(false)}>İptal</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {games.map(game => (
          <div key={game.id} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '12px', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: (game.services?.length || showAddService === game.id) ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="h4" style={{ color: '#fff' }}>{game.name}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>/{game.slug}</span>
                <span style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: '20px', padding: '2px 10px',
                  fontSize: '11px', color: 'var(--gold)',
                  fontFamily: 'var(--font-montserrat)', fontWeight: '600',
                }}>{game.category}</span>
                {!game.isActive && (
                  <span style={{
                    background: '#2a1a1a', border: '1px solid #4a2a2a',
                    borderRadius: '20px', padding: '2px 10px',
                    fontSize: '11px', color: '#ff6666',
                  }}>Pasif</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => setShowAddService(showAddService === game.id ? null : game.id)}>
                  + Hizmet
                </button>
                <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => toggleGame(game.id, game.isActive)}>
                  {game.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                </button>
              </div>
            </div>

            {showAddService === game.id && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <h4 style={{ color: 'var(--gold)', fontSize: '13px', marginBottom: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
                  {game.name} — Yeni Hizmet
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <Field label="Hizmet Adı *" value={serviceForm.name}
                    onChange={v => setServiceForm(f => ({ ...f, name: v }))} />
                  <Field label="Slug *" value={serviceForm.slug}
                    onChange={v => setServiceForm(f => ({ ...f, slug: v.toLowerCase().replace(/\s/g, '-') }))} />
                  <Field label="Fiyat (₺) *" type="number" value={serviceForm.basePrice}
                    onChange={v => setServiceForm(f => ({ ...f, basePrice: v }))} />
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fiyat Tipi</label>
                    <select value={serviceForm.priceType}
                      onChange={e => setServiceForm(f => ({ ...f, priceType: e.target.value }))}
                      style={{
                        width: '100%', background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)', borderRadius: '6px',
                        padding: '8px 10px', color: '#fff', fontSize: '13px',
                        fontFamily: 'var(--font-inter)', outline: 'none',
                      }}>
                      <option value="fixed">Sabit</option>
                      <option value="variable">Değişken</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <Field label="Görsel URL" placeholder="https://..." value={serviceForm.imageUrl}
                    onChange={v => setServiceForm(f => ({ ...f, imageUrl: v }))} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                    <input type="checkbox" id="isHotNew" checked={serviceForm.isHot}
                      onChange={e => setServiceForm(f => ({ ...f, isHot: e.target.checked }))} />
                    <label htmlFor="isHotNew" style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      HOT olarak işaretle
                    </label>
                  </div>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Açıklama</label>
                  <textarea value={serviceForm.description}
                    onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Hizmet açıklaması..." rows={3}
                    style={{
                      width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px',
                      fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical',
                    }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Özellikler (her satır ayrı madde)
                  </label>
                  <textarea value={serviceForm.features}
                    onChange={e => setServiceForm(f => ({ ...f, features: e.target.value }))}
                    placeholder={'Tüm seviyelerde boost\nHesap güvenliği garantili\nVPN koruması'} rows={4}
                    style={{
                      width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px',
                      fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical',
                    }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => addService(game.id)}>Kaydet</button>
                  <button className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => setShowAddService(null)}>İptal</button>
                </div>
              </div>
            )}

            {game.services?.length > 0 && (
              <div style={{ padding: '12px 20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Hizmet', 'Fiyat', 'Tip', 'Durum', 'İşlemler'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', fontSize: '11px',
                          color: 'var(--text-dim)', fontWeight: '600',
                          fontFamily: 'var(--font-montserrat)',
                          padding: '6px 8px', borderBottom: '1px solid var(--border)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {game.services.map(s => (
                      <>
                        <tr key={s.id}>
                          <td style={{ padding: '10px 8px', fontSize: '13px', color: '#fff' }}>
                            {s.name}
                            {s.isHot && (
                              <span style={{
                                marginLeft: '6px', background: '#ff4444', color: '#fff',
                                fontSize: '9px', fontWeight: '700', padding: '1px 5px',
                                borderRadius: '3px', fontFamily: 'var(--font-montserrat)',
                              }}>HOT</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 8px', fontSize: '13px', color: 'var(--gold)', fontWeight: '600' }}>
                            {s.basePrice.toLocaleString('tr-TR')} ₺
                          </td>
                          <td style={{ padding: '10px 8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {s.priceType === 'fixed' ? 'Sabit' : 'Değişken'}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                              background: s.isActive ? '#1a2a1a' : '#2a1a1a',
                              color: s.isActive ? '#4caf50' : '#ff6666',
                              border: `1px solid ${s.isActive ? '#2a4a2a' : '#4a2a2a'}`,
                            }}>{s.isActive ? 'Aktif' : 'Pasif'}</span>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button style={{
                                background: 'transparent', border: '1px solid var(--gold)',
                                borderRadius: '6px', padding: '4px 10px',
                                fontSize: '11px', color: 'var(--gold)', cursor: 'pointer',
                              }} onClick={() => {
                                setEditService(editService === s.id ? null : s.id)
                                setEditForm({
                                  name: s.name,
                                  basePrice: s.basePrice,
                                  description: s.description || '',
                                  features: (s.features || []).join('\n'),
                                  imageUrl: s.imageUrl || '',
                                  isHot: s.isHot || false,
                                })
                              }}>Düzenle</button>
                              <button style={{
                                background: 'transparent', border: '1px solid var(--border)',
                                borderRadius: '6px', padding: '4px 10px',
                                fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer',
                              }} onClick={() => toggleService(s.id, s.isActive)}>
                                {s.isActive ? 'Pasif' : 'Aktif'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {editService === s.id && (
                          <tr key={`edit-${s.id}`}>
                            <td colSpan={5} style={{ padding: '0 8px 12px' }}>
                              <div style={{
                                background: 'var(--bg-elevated)', borderRadius: '10px',
                                border: '1px solid var(--gold)', padding: '16px',
                              }}>
                                <h4 style={{ color: 'var(--gold)', fontSize: '13px', marginBottom: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
                                  Düzenle — {s.name}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                  <Field label="Hizmet Adı" value={editForm.name}
                                    onChange={v => setEditForm(f => ({ ...f, name: v }))} />
                                  <Field label="Fiyat (₺)" type="number" value={editForm.basePrice}
                                    onChange={v => setEditForm(f => ({ ...f, basePrice: v }))} />
                                  <Field label="Görsel URL" value={editForm.imageUrl}
                                    onChange={v => setEditForm(f => ({ ...f, imageUrl: v }))} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                  <input type="checkbox" id={`hot-${s.id}`} checked={editForm.isHot}
                                    onChange={e => setEditForm(f => ({ ...f, isHot: e.target.checked }))} />
                                  <label htmlFor={`hot-${s.id}`} style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>HOT</label>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Açıklama</label>
                                  <textarea value={editForm.description}
                                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3} style={{
                                      width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                                      borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px',
                                      fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical',
                                    }} />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Özellikler (her satır ayrı madde)
                                  </label>
                                  <textarea value={editForm.features}
                                    onChange={e => setEditForm(f => ({ ...f, features: e.target.value }))}
                                    rows={4} style={{
                                      width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                                      borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px',
                                      fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical',
                                    }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}
                                    onClick={saveEditService}>Kaydet</button>
                                  <button className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}
                                    onClick={() => setEditService(null)}>İptal</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', background: 'var(--bg-elevated)',
          border: '1px solid var(--border)', borderRadius: '6px',
          padding: '8px 10px', color: '#fff', fontSize: '13px',
          fontFamily: 'var(--font-inter)', outline: 'none',
        }}
      />
    </div>
  )
}