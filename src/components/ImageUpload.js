'use client'
import FileUpload from './FileUpload'

// Single-image wrapper over FileUpload — exposes a plain value/onChange(url)
// string API so it drops into existing text-field-shaped form state.
export default function ImageUpload({ label, value, onChange }) {
  return (
    <FileUpload
      label={label}
      value={value ? [value] : []}
      onChange={urls => onChange(urls[urls.length - 1] || '')}
      multiple={false}
      maxFiles={1}
    />
  )
}
