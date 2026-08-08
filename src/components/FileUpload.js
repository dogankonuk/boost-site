'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { uploadToCloudinary } from '@/lib/cloudinary'

export default function FileUpload({ value = [], onChange, multiple = true, maxFiles = 5, label }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, Math.max(0, maxFiles - value.length))
    if (files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const urls = await Promise.all(files.map(uploadToCloudinary))
      onChange([...value, ...urls])
    } catch (err) {
      setError(err.message || 'Upload failed — please try again')
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeAt(i) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      {label && (
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-montserrat)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
          {label}
        </label>
      )}

      {value.length < maxFiles && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          style={{
            border: '1px dashed var(--border)', borderRadius: '10px', padding: '20px',
            textAlign: 'center', cursor: 'pointer', background: 'var(--bg-elevated)',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <input
            ref={inputRef} type="file" accept="image/*" multiple={multiple}
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {uploading ? 'Uploading...' : `📎 Click or drag image${multiple ? 's' : ''} here to upload`}
          </div>
        </div>
      )}

      {error && <div style={{ color: '#ff6666', fontSize: '12px', marginTop: '6px' }}>{error}</div>}

      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          {value.map((url, i) => (
            <div key={url} style={{ position: 'relative', width: '70px', height: '70px' }}>
              <Image src={url} alt={`Uploaded image ${i + 1}`} width={70} height={70} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove"
                style={{
                  position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px',
                  borderRadius: '50%', background: '#ff6666', border: 'none', color: '#fff',
                  fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, lineHeight: 1,
                }}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
