'use client'
import { useState, useEffect, useRef, Fragment } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'


export default function AdminGames({ secret }) {
  const [games, setGames] = useState([])
  const [gameCategories, setGameCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddGame, setShowAddGame] = useState(false)
  const [showAddService, setShowAddService] = useState(null)
  const [expandedGame, setExpandedGame] = useState(null)
  const [editGame, setEditGame] = useState(null)
  const [editGameForm, setEditGameForm] = useState({})
  const [editService, setEditService] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [gameForm, setGameForm] = useState({ name: '', slug: '', categories: [], sortOrder: 0 })
  const [serviceForm, setServiceForm] = useState({
    name: '', slug: '', basePrice: '', priceType: 'fixed',
    description: '', features: '', imageUrl: '', isHot: false, serviceCategory: '',
    pricingType: 'fixed',
    pricingOptions: { unitName: '', unitPrice: '', minQty: 1, maxQty: 999, pricePerUnit: '', min: 1, max: 100, choices: [] },
  })
  const [msg, setMsg] = useState('')

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { fetchGames(); fetchGameCategories() }, [])

  async function fetchGames() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=games', { headers })
      const d = await res.json()
      if (d.success) setGames(d.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }
  async function fetchGameCategories() {
    try {
      const res = await fetch('/api/admin?type=gameCategories', { headers })
      const d = await res.json()
      if (d.success) setGameCategories(d.data)
    } catch {}
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = games.findIndex(g => g.id === active.id)
    const newIndex = games.findIndex(g => g.id === over.id)
    const newGames = arrayMove(games, oldIndex, newIndex)
    setGames(newGames)
    await Promise.all(newGames.map((game, index) =>
      fetch('/api/admin', {
        method: 'PATCH', headers,
        body: JSON.stringify({ type: 'game', id: parseInt(game.id), data: { sortOrder: index + 1 } }),
      })
    ))
  }

  async function addGame() {
    if (!gameForm.name || !gameForm.slug || gameForm.categories.length === 0) {
      setMsg('Zorunlu alanları doldurun'); return
    }
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: gameForm.name, slug: gameForm.slug,
        category: gameForm.categories.join(', '),
        sortOrder: parseInt(gameForm.sortOrder) || games.length + 1,
      }),
    })
    const d = await res.json()
    if (d.success) {
      setMsg('Oyun eklendi')
      setGameForm({ name: '', slug: '', categories: [], sortOrder: 0 })
      setShowAddGame(false)
      fetchGames()
    } else { setMsg(d.error || 'Hata') }
  }

  async function saveEditGame() {
    const res = await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({
        type: 'game', id: parseInt(editGame),
        data: {
          name: editGameForm.name,
          category: (editGameForm.categories || []).join(', '),
          bannerImage: editGameForm.bannerImage || null,
          coverImage: editGameForm.coverImage || null,
          description: editGameForm.description || null,
          sortOrder: parseInt(editGameForm.sortOrder) || 0,
          serviceCategories: (editGameForm.serviceCategories || []).filter(c => c.trim() !== ''),
        }
      }),
    })
    const d = await res.json()
    if (d.success) { setMsg('Oyun güncellendi'); setEditGame(null); fetchGames() }
    else { setMsg('Hata: ' + (d.error || 'bilinmiyor')) }
  }

  async function addService(gameId) {
    if (!serviceForm.name || !serviceForm.slug || !serviceForm.basePrice) {
      setMsg('Zorunlu alanları doldurun'); return
    }
    let options = null
    if (serviceForm.pricingType === 'quantity') {
      options = { type: 'quantity', unitName: serviceForm.pricingOptions.unitName, unitPrice: parseFloat(serviceForm.pricingOptions.unitPrice), minQty: parseInt(serviceForm.pricingOptions.minQty), maxQty: parseInt(serviceForm.pricingOptions.maxQty) }
    } else if (serviceForm.pricingType === 'range') {
      options = { type: 'range', unitName: serviceForm.pricingOptions.unitName, pricePerUnit: parseFloat(serviceForm.pricingOptions.pricePerUnit), min: parseInt(serviceForm.pricingOptions.min), max: parseInt(serviceForm.pricingOptions.max) }
    } else if (serviceForm.pricingType === 'options') {
      options = { type: 'options', choices: serviceForm.pricingOptions.choices }
    }
    const res = await fetch(`/api/games/${gameId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: serviceForm.name, slug: serviceForm.slug,
        basePrice: parseFloat(serviceForm.basePrice),
        priceType: serviceForm.pricingType === 'fixed' ? 'fixed' : 'variable',
        description: serviceForm.description || null,
        features: serviceForm.features ? serviceForm.features.split('\n').map(f => f.trim()).filter(Boolean) : null,
        imageUrl: serviceForm.imageUrl || null,
        isHot: serviceForm.isHot,
        serviceCategory: serviceForm.serviceCategory || 'Genel',
        options,
      }),
    })
    const d = await res.json()
    if (d.success) {
      setMsg('Hizmet eklendi')
      setServiceForm({ name: '', slug: '', basePrice: '', priceType: 'fixed', description: '', features: '', imageUrl: '', isHot: false, serviceCategory: '', pricingType: 'fixed', pricingOptions: { unitName: '', unitPrice: '', minQty: 1, maxQty: 999, pricePerUnit: '', min: 1, max: 100, choices: [] } })
      setShowAddService(null)
      fetchGames()
    } else { setMsg(d.error || 'Hata') }
  }

  async function saveEditService() {
    let options = null
    if (editForm.pricingType === 'quantity') {
      options = { type: 'quantity', unitName: editForm.pricingOptions.unitName, unitPrice: parseFloat(editForm.pricingOptions.unitPrice), minQty: parseInt(editForm.pricingOptions.minQty), maxQty: parseInt(editForm.pricingOptions.maxQty) }
    } else if (editForm.pricingType === 'range') {
      options = { type: 'range', unitName: editForm.pricingOptions.unitName, pricePerUnit: parseFloat(editForm.pricingOptions.pricePerUnit), min: parseInt(editForm.pricingOptions.min), max: parseInt(editForm.pricingOptions.max) }
    } else if (editForm.pricingType === 'options') {
      options = { type: 'options', choices: editForm.pricingOptions.choices }
    }
    const res = await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({
        type: 'service', id: parseInt(editService),
        data: {
          name: editForm.name, basePrice: parseFloat(editForm.basePrice),
          description: editForm.description || null,
          features: editForm.features ? editForm.features.split('\n').map(f => f.trim()).filter(Boolean) : null,
          imageUrl: editForm.imageUrl || null, isHot: editForm.isHot,
          serviceCategory: editForm.serviceCategory || 'Genel',
          priceType: editForm.pricingType === 'fixed' ? 'fixed' : 'variable',
          options,
        }
      }),
    })
    const d = await res.json()
    if (d.success) { setMsg('Hizmet güncellendi'); setEditService(null); fetchGames() }
    else { setMsg('Hata: ' + (d.error || 'bilinmiyor')) }
  }

  async function toggleGame(id, isActive) {
    await fetch('/api/admin', { method: 'PATCH', headers, body: JSON.stringify({ type: 'game', id: parseInt(id), data: { isActive: !isActive } }) })
    fetchGames()
  }

  async function toggleService(id, isActive) {
    await fetch('/api/admin', { method: 'PATCH', headers, body: JSON.stringify({ type: 'service', id: parseInt(id), data: { isActive: !isActive } }) })
    fetchGames()
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>

  return (
    <div>
      {msg && (
        <div onClick={() => setMsg('')} style={{
          background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: '8px',
          padding: '10px 16px', color: '#4caf50', fontSize: '13px', marginBottom: '16px', cursor: 'pointer',
        }}>{msg} ✕</div>
      )}

      <GameCategories secret={secret} onCategoriesChange={setGameCategories} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="h3" style={{ color: '#fff' }}>Oyunlar ({games.length})</h2>
        <button className="btn-primary" onClick={() => setShowAddGame(v => !v)}>+ Oyun Ekle</button>
      </div>

      {showAddGame && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <h3 className="h4" style={{ color: '#fff', marginBottom: '16px' }}>Yeni Oyun</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <Field label="Oyun Adı *" value={gameForm.name} onChange={v => setGameForm(f => ({ ...f, name: v }))} />
            <Field label="Slug *" placeholder="fortnite" value={gameForm.slug} onChange={v => setGameForm(f => ({ ...f, slug: v.toLowerCase().replace(/\s/g, '-') }))} />
            <Field label="Sıra" type="number" value={gameForm.sortOrder} onChange={v => setGameForm(f => ({ ...f, sortOrder: v }))} />
            <div />
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Kategoriler *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {gameCategories.map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setGameForm(f => ({ ...f, categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat] }))}
                    style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer', border: '1px solid', background: gameForm.categories.includes(cat) ? 'var(--gold)' : 'transparent', color: gameForm.categories.includes(cat) ? '#0a0a0a' : 'var(--text-muted)', borderColor: gameForm.categories.includes(cat) ? 'var(--gold)' : 'var(--border)' }}>{cat}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" onClick={addGame}>Kaydet</button>
            <button className="btn-secondary" onClick={() => setShowAddGame(false)}>İptal</button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={games.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {games.map((game, index) => (
              <SortableGameRow
                key={game.id}
                game={game}
                index={index}
                isExpanded={expandedGame === game.id}
                onToggleExpand={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                editGame={editGame} editGameForm={editGameForm}
                setEditGame={setEditGame} setEditGameForm={setEditGameForm}
                showAddService={showAddService} setShowAddService={setShowAddService}
                editService={editService} setEditService={setEditService}
                editForm={editForm} setEditForm={setEditForm}
                serviceForm={serviceForm} setServiceForm={setServiceForm}
                saveEditGame={saveEditGame} saveEditService={saveEditService}
                addService={addService} toggleGame={toggleGame} toggleService={toggleService}
                gameCategories={gameCategories}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableGameRow({
  game, index, isExpanded, onToggleExpand, gameCategories,
  editGame, editGameForm, setEditGame, setEditGameForm,
  showAddService, setShowAddService,
  editService, setEditService, editForm, setEditForm,
  serviceForm, setServiceForm,
  saveEditGame, saveEditService, addService, toggleGame, toggleService
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: game.id })
  const catInputRef = useRef(null)

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>

        {/* Kompakt header satırı */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px' }}>
          {/* Sıra numarası */}
          <div style={{ width: '24px', height: '24px', background: 'var(--bg-elevated)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-montserrat)', fontWeight: '700', flexShrink: 0 }}>
            {index + 1}
          </div>

          {/* Sürükle ikonu */}
          <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-dim)', fontSize: '16px', userSelect: 'none', flexShrink: 0 }}>⠿</div>

          {/* Cover image küçük */}
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--bg-elevated)', backgroundImage: game.coverImage ? `url(${game.coverImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, border: '1px solid var(--border)' }} />

          {/* Oyun adı ve slug */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', fontFamily: 'var(--font-montserrat)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>/{game.slug}</span>
              <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1px 8px', fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', fontWeight: '600', whiteSpace: 'nowrap' }}>{game.category}</span>
              {!game.isActive && <span style={{ background: '#2a1a1a', border: '1px solid #4a2a2a', borderRadius: '20px', padding: '1px 8px', fontSize: '10px', color: '#ff6666' }}>Pasif</span>}
            </div>
          </div>

          {/* Hizmet sayısı badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '20px', padding: '3px 10px', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: '700', fontFamily: 'var(--font-montserrat)' }}>{game.services?.length || 0}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>hizmet</span>
          </div>

          {/* Butonlar */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}
              onClick={() => { setEditGame(editGame === game.id ? null : game.id); setEditGameForm({ name: game.name, categories: game.category ? game.category.split(', ') : [], bannerImage: game.bannerImage || '', coverImage: game.coverImage || '', description: game.description || '', sortOrder: game.sortOrder || 0, serviceCategories: game.serviceCategories || [] }) }}>
              {editGame === game.id ? 'Kapat' : 'Düzenle'}
            </button>
            <button className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}
              onClick={() => { setShowAddService(showAddService === game.id ? null : game.id); if (expandedGame !== game.id) onToggleExpand() }}>
              + Hizmet
            </button>
            <button className="btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}
              onClick={() => toggleGame(game.id, game.isActive)}>
              {game.isActive ? 'Pasif' : 'Aktif'}
            </button>
            <button onClick={onToggleExpand} style={{ width: '28px', height: '28px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</button>
          </div>
        </div>

        {/* Düzenle formu */}
        {editGame === game.id && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <h4 style={{ color: 'var(--gold)', fontSize: '13px', marginBottom: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>Oyun Düzenle — {game.name}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <Field label="Oyun Adı" value={editGameForm.name} onChange={v => setEditGameForm(f => ({ ...f, name: v }))} />
              <Field label="Sıra" type="number" value={editGameForm.sortOrder} onChange={v => setEditGameForm(f => ({ ...f, sortOrder: v }))} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Oyun Kategorileri</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {gameCategories.map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setEditGameForm(f => ({ ...f, categories: (f.categories || []).includes(cat) ? (f.categories || []).filter(c => c !== cat) : [...(f.categories || []), cat] }))}
                    style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer', border: '1px solid', background: (editGameForm.categories || []).includes(cat) ? 'var(--gold)' : 'transparent', color: (editGameForm.categories || []).includes(cat) ? '#0a0a0a' : 'var(--text-muted)', borderColor: (editGameForm.categories || []).includes(cat) ? 'var(--gold)' : 'var(--border)' }}>{cat}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <Field label="Banner Görsel URL" placeholder="https://..." value={editGameForm.bannerImage} onChange={v => setEditGameForm(f => ({ ...f, bannerImage: v }))} />
              <Field label="Kart Görseli URL (200x280px)" placeholder="https://..." value={editGameForm.coverImage} onChange={v => setEditGameForm(f => ({ ...f, coverImage: v }))} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Hizmet Kategorileri</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                {(editGameForm.serviceCategories || []).map((cat, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg)', border: '1px solid var(--gold)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
                    {cat}
                    <button type="button" onClick={() => setEditGameForm(f => ({ ...f, serviceCategories: f.serviceCategories.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '13px', lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input ref={catInputRef} type="text" placeholder="Yeni hizmet kategorisi..."
                  onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { setEditGameForm(f => ({ ...f, serviceCategories: [...(f.serviceCategories || []), e.target.value.trim()] })); e.target.value = '' } }}
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }} />
                <button type="button" className="btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}
                  onClick={() => { const val = catInputRef.current?.value?.trim(); if (val) { setEditGameForm(f => ({ ...f, serviceCategories: [...(f.serviceCategories || []), val] })); catInputRef.current.value = '' } }}>Ekle</button>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Açıklama</label>
              <textarea value={editGameForm.description} onChange={e => setEditGameForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Oyun hakkında kısa açıklama..."
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" style={{ fontSize: '13px', padding: '7px 16px' }} onClick={saveEditGame}>Kaydet</button>
              <button className="btn-secondary" style={{ fontSize: '13px', padding: '7px 16px' }} onClick={() => setEditGame(null)}>İptal</button>
            </div>
          </div>
        )}

        {/* Hizmet ekleme formu */}
        {showAddService === game.id && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <h4 style={{ color: 'var(--gold)', fontSize: '13px', marginBottom: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>{game.name} — Yeni Hizmet</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <Field label="Hizmet Adı *" value={serviceForm.name} onChange={v => setServiceForm(f => ({ ...f, name: v }))} />
              <Field label="Slug *" value={serviceForm.slug} onChange={v => setServiceForm(f => ({ ...f, slug: v.toLowerCase().replace(/\s/g, '-') }))} />
              <Field label="Fiyat (₺) *" type="number" value={serviceForm.basePrice} onChange={v => setServiceForm(f => ({ ...f, basePrice: v }))} />
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fiyat Tipi</label>
                <select value={serviceForm.priceType} onChange={e => setServiceForm(f => ({ ...f, priceType: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }}>
                  <option value="fixed">Sabit</option>
                  <option value="variable">Değişken</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori</label>
                <select value={serviceForm.serviceCategory} onChange={e => setServiceForm(f => ({ ...f, serviceCategory: e.target.value }))}
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }}>
                  <option value="">Genel</option>
                  {(game.serviceCategories || []).map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <Field label="Görsel URL" placeholder="https://..." value={serviceForm.imageUrl} onChange={v => setServiceForm(f => ({ ...f, imageUrl: v }))} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                <input type="checkbox" id="isHotNew" checked={serviceForm.isHot} onChange={e => setServiceForm(f => ({ ...f, isHot: e.target.checked }))} />
                <label htmlFor="isHotNew" style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>HOT olarak işaretle</label>
              </div>
            </div>

            {/* Fiyatlandırma tipi */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Fiyatlandırma Tipi</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {[{ key: 'fixed', label: 'Sabit' }, { key: 'quantity', label: 'Miktar' }, { key: 'range', label: 'Slider' }, { key: 'options', label: 'Seçenek' }].map(t => (
                  <button key={t.key} type="button" onClick={() => setServiceForm(f => ({ ...f, pricingType: t.key }))}
                    style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer', border: '1px solid', background: serviceForm.pricingType === t.key ? 'var(--gold)' : 'transparent', color: serviceForm.pricingType === t.key ? '#0a0a0a' : 'var(--text-muted)', borderColor: serviceForm.pricingType === t.key ? 'var(--gold)' : 'var(--border)' }}>{t.label}</button>
                ))}
              </div>
              {serviceForm.pricingType === 'quantity' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <Field label="Birim Adı" placeholder="Divine Orb" value={serviceForm.pricingOptions.unitName} onChange={v => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, unitName: v } }))} />
                  <Field label="Birim Fiyatı (₺)" type="number" value={serviceForm.pricingOptions.unitPrice} onChange={v => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, unitPrice: v } }))} />
                  <Field label="Min" type="number" value={serviceForm.pricingOptions.minQty} onChange={v => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, minQty: v } }))} />
                  <Field label="Max" type="number" value={serviceForm.pricingOptions.maxQty} onChange={v => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, maxQty: v } }))} />
                </div>
              )}
              {serviceForm.pricingType === 'range' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <Field label="Birim Adı" placeholder="Level" value={serviceForm.pricingOptions.unitName} onChange={v => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, unitName: v } }))} />
                  <Field label="Birim Fiyatı (₺)" type="number" value={serviceForm.pricingOptions.pricePerUnit} onChange={v => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, pricePerUnit: v } }))} />
                  <Field label="Min" type="number" value={serviceForm.pricingOptions.min} onChange={v => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, min: v } }))} />
                  <Field label="Max" type="number" value={serviceForm.pricingOptions.max} onChange={v => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, max: v } }))} />
                </div>
              )}
              {serviceForm.pricingType === 'options' && (
                <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {(serviceForm.pricingOptions.choices || []).map((c, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: '#fff' }}>
                        {c.label} — {c.price}₺
                        <button type="button" onClick={() => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, choices: f.pricingOptions.choices.filter((_, j) => j !== i) } }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', padding: 0 }}>×</button>
                      </span>
                    ))}
                  </div>
                  <ChoiceAdder onAdd={choice => setServiceForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, choices: [...(f.pricingOptions.choices || []), choice] } }))} />
                </div>
              )}
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Açıklama</label>
              <textarea value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} rows={2}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Özellikler (her satır ayrı madde)</label>
              <textarea value={serviceForm.features} onChange={e => setServiceForm(f => ({ ...f, features: e.target.value }))} rows={3}
                placeholder={'Tüm seviyelerde boost\nHesap güvenliği garantili'} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" style={{ fontSize: '13px', padding: '7px 16px' }} onClick={() => addService(game.id)}>Kaydet</button>
              <button className="btn-secondary" style={{ fontSize: '13px', padding: '7px 16px' }} onClick={() => setShowAddService(null)}>İptal</button>
            </div>
          </div>
        )}

{/* Hizmetler — collapsed/expanded */}
        {isExpanded && game.services?.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px 12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Hizmet', 'Kategori', 'Fiyat', 'Tip', 'Durum', 'İşlemler'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: '10px', color: 'var(--text-dim)', fontWeight: '600', fontFamily: 'var(--font-montserrat)', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {game.services.map(s => (
                  // HATA BURADAYDI: Boş fragment (<>) yerine key alan açık Fragment bileşeni kullandık
                  <Fragment key={`service-group-${s.id}`}>
                    <tr>
                      <td style={{ padding: '8px', fontSize: '13px', color: '#fff' }}>
                        {s.name}
                        {s.isHot && <span style={{ marginLeft: '6px', background: '#ff4444', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px' }}>HOT</span>}
                      </td>
                      <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>{s.serviceCategory || 'Genel'}</td>
                      <td style={{ padding: '8px', fontSize: '13px', color: 'var(--gold)', fontWeight: '600' }}>{(s.basePrice || 0).toLocaleString('tr-TR')} ₺</td>
                      <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>{s.priceType === 'fixed' ? 'Sabit' : 'Değişken'}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: s.isActive ? '#1a2a1a' : '#2a1a1a', color: s.isActive ? '#4caf50' : '#ff6666', border: `1px solid ${s.isActive ? '#2a4a2a' : '#4a2a2a'}` }}>{s.isActive ? 'Aktif' : 'Pasif'}</span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button style={{ background: 'transparent', border: '1px solid var(--gold)', borderRadius: '5px', padding: '3px 8px', fontSize: '11px', color: 'var(--gold)', cursor: 'pointer' }}
                            onClick={() => {
                              setEditService(editService === s.id ? null : s.id)
                              setEditForm({ name: s.name, basePrice: s.basePrice, description: s.description || '', features: (s.features || []).join('\n'), imageUrl: s.imageUrl || '', isHot: s.isHot || false, serviceCategory: s.serviceCategory || '', pricingType: s.options?.type || 'fixed', pricingOptions: s.options ? { unitName: s.options.unitName || '', unitPrice: s.options.unitPrice || '', minQty: s.options.minQty || 1, maxQty: s.options.maxQty || 999, pricePerUnit: s.options.pricePerUnit || '', min: s.options.min || 1, max: s.options.max || 100, choices: s.options.choices || [] } : { unitName: '', unitPrice: '', minQty: 1, maxQty: 999, pricePerUnit: '', min: 1, max: 100, choices: [] } })
                            }}>
                            {editService === s.id ? 'Kapat' : 'Düzenle'}
                          </button>
                          <button style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '5px', padding: '3px 8px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}
                            onClick={() => toggleService(s.id, s.isActive)}>
                            {s.isActive ? 'Pasif' : 'Aktif'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {editService === s.id && (
                      <tr key={`edit-row-${s.id}`}>
                        <td colSpan={6} style={{ padding: '0 8px 10px' }}>
                          <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--gold)', padding: '14px', marginTop: '6px' }}>
                            <h4 style={{ color: 'var(--gold)', fontSize: '12px', marginBottom: '10px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>Düzenle — {s.name}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                              <Field label="Hizmet Adı" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
                              <Field label="Fiyat (₺)" type="number" value={editForm.basePrice} onChange={v => setEditForm(f => ({ ...f, basePrice: v }))} />
                              <Field label="Görsel URL" value={editForm.imageUrl} onChange={v => setEditForm(f => ({ ...f, imageUrl: v }))} />
                              <div>
                                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori</label>
                                <select value={editForm.serviceCategory || ''} onChange={e => setEditForm(f => ({ ...f, serviceCategory: e.target.value }))}
                                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }}>
                                  <option value="">Genel</option>
                                  {(game.serviceCategories || []).map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                              <input type="checkbox" id={`hot-${s.id}`} checked={editForm.isHot} onChange={e => setEditForm(f => ({ ...f, isHot: e.target.checked }))} />
                              <label htmlFor={`hot-${s.id}`} style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>HOT</label>
                            </div>

                            {/* Edit fiyatlandırma tipi */}
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Fiyatlandırma Tipi</label>
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                {[{ key: 'fixed', label: 'Sabit' }, { key: 'quantity', label: 'Miktar' }, { key: 'range', label: 'Slider' }, { key: 'options', label: 'Seçenek' }].map(t => (
                                  <button key={t.key} type="button" onClick={() => setEditForm(f => ({ ...f, pricingType: t.key }))}
                                    style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontFamily: 'var(--font-montserrat)', fontWeight: '600', cursor: 'pointer', border: '1px solid', background: editForm.pricingType === t.key ? 'var(--gold)' : 'transparent', color: editForm.pricingType === t.key ? '#0a0a0a' : 'var(--text-muted)', borderColor: editForm.pricingType === t.key ? 'var(--gold)' : 'var(--border)' }}>{t.label}</button>
                                ))}
                              </div>
                              {editForm.pricingType === 'quantity' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', padding: '10px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                  <Field label="Birim Adı" value={editForm.pricingOptions?.unitName || ''} onChange={v => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, unitName: v } }))} />
                                  <Field label="Birim Fiyatı" type="number" value={editForm.pricingOptions?.unitPrice || ''} onChange={v => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, unitPrice: v } }))} />
                                  <Field label="Min" type="number" value={editForm.pricingOptions?.minQty || 1} onChange={v => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, minQty: v } }))} />
                                  <Field label="Max" type="number" value={editForm.pricingOptions?.maxQty || 999} onChange={v => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, maxQty: v } }))} />
                                </div>
                              )}
                              {editForm.pricingType === 'range' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', padding: '10px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                  <Field label="Birim Adı" value={editForm.pricingOptions?.unitName || ''} onChange={v => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, unitName: v } }))} />
                                  <Field label="Birim Fiyatı" type="number" value={editForm.pricingOptions?.pricePerUnit || ''} onChange={v => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, pricePerUnit: v } }))} />
                                  <Field label="Min" type="number" value={editForm.pricingOptions?.min || 1} onChange={v => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, min: v } }))} />
                                  <Field label="Max" type="number" value={editForm.pricingOptions?.max || 100} onChange={v => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, max: v } }))} />
                                </div>
                              )}
                              {editForm.pricingType === 'options' && (
                                <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                    {(editForm.pricingOptions?.choices || []).map((c, i) => (
                                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: '#fff' }}>
                                        {c.label} — {c.price}₺
                                        <button type="button" onClick={() => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, choices: f.pricingOptions.choices.filter((_, j) => j !== i) } }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', padding: 0 }}>×</button>
                                      </span>
                                    ))}
                                  </div>
                                  <ChoiceAdder onAdd={choice => setEditForm(f => ({ ...f, pricingOptions: { ...f.pricingOptions, choices: [...(f.pricingOptions?.choices || []), choice] } }))} />
                                </div>
                              )}
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Açıklama</label>
                              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2}
                                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical' }} />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Özellikler (her satır ayrı madde)</label>
                              <textarea value={editForm.features} onChange={e => setEditForm(f => ({ ...f, features: e.target.value }))} rows={3}
                                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none', resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={saveEditService}>Kaydet</button>
                              <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => setEditService(null)}>İptal</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isExpanded && (!game.services || game.services.length === 0) && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
            Henüz hizmet eklenmemiş.
          </div>
        )}
      </div>
    </div>
  )
}

function GameCategories({ secret, onCategoriesChange }) {
  const [categories, setCategories] = useState([])
  const [manualCategories, setManualCategories] = useState([])
  const [newCat, setNewCat] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?type=gameCategories', { headers })
      const d = await res.json()
      if (d.success) {
        setCategories(d.data)
        setManualCategories(d.manual || [])
        onCategoriesChange(d.data)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function addCategory() {
    if (!newCat.trim()) return
    console.log('addCategory çağrıldı:', newCat.trim())
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ type: 'gameCategories', action: 'add', value: newCat.trim() }),
    })
    const d = await res.json()
    console.log('response:', d)
    if (d.success) { setMsg('Kategori eklendi'); setNewCat(''); fetchCategories() }
    else setMsg(d.error || 'Hata')
  }

  async function removeCategory(cat) {
    const res = await fetch('/api/admin', {
      method: 'PATCH', headers,
      body: JSON.stringify({ type: 'gameCategories', action: 'remove', value: cat }),
    })
    const d = await res.json()
    if (d.success) { setMsg('Kategori silindi'); fetchCategories() }
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '16px 20px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ color: '#fff', fontSize: '14px', fontFamily: 'var(--font-montserrat)', fontWeight: '600' }}>
          Oyun Kategorileri
        </h3>
        {msg && <span style={{ fontSize: '12px', color: '#4caf50', cursor: 'pointer' }} onClick={() => setMsg('')}>{msg} ✕</span>}
      </div>

      {loading ? (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Yükleniyor...</span>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {categories.map((cat, i) => {
            const isManual = manualCategories.includes(cat)
            return (
              <span key={i} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: isManual ? 'rgba(245,197,24,0.1)' : 'var(--bg-elevated)',
                border: `1px solid ${isManual ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: '20px', padding: '4px 12px',
                fontSize: '12px', color: isManual ? 'var(--gold)' : '#fff',
                fontFamily: 'var(--font-montserrat)', fontWeight: '600',
              }}>
                {cat}
                {isManual && (
                  <button type="button" onClick={() => removeCategory(cat)} style={{
                    background: 'none', border: 'none', color: 'var(--gold)',
                    cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0,
                  }}>×</button>
                )}
              </span>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCategory()}
          placeholder="Yeni kategori ekle..."
          style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }} />
        <button type="button" className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}
          onClick={addCategory}>Ekle</button>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
        Sarı olanlar manuel eklendi (silinebilir). Beyazlar oyunlardan otomatik geliyor.
      </p>
    </div>
  )
}

function ChoiceAdder({ onAdd }) {
  const [label, setLabel] = useState('')
  const [price, setPrice] = useState('')
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
      <div style={{ flex: 2 }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Seçenek Adı</label>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="PvP, Express..."
          style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }} />
      </div>
      <div style={{ flex: 1 }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fiyat (₺)</label>
        <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="299"
          style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }} />
      </div>
      <button type="button" className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }}
        onClick={() => { if (label.trim() && price) { onAdd({ label: label.trim(), price: parseFloat(price) }); setLabel(''); setPrice('') } }}>Ekle</button>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-inter)', outline: 'none' }} />
    </div>
  )
}