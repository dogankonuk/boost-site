function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(text) {
  let out = escapeHtml(text)
  const urlPattern = '(https?:\\/\\/[^\\s)]+|\\/[^\\s)]*)'
  out = out.replace(new RegExp(`!\\[([^\\]]*)\\]\\(${urlPattern}\\)`, 'g'), '<img src="$2" alt="$1" loading="lazy" />')
  out = out.replace(new RegExp(`\\[([^\\]]+)\\]\\(${urlPattern}\\)`, 'g'), (match, label, url) => {
    const isExternal = /^https?:\/\//.test(url)
    return `<a href="${url}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`
  })
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return out
}

function slugify(text, used) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'section'
  let slug = base
  let i = 1
  while (used.has(slug)) {
    i++
    slug = `${base}-${i}`
  }
  used.add(slug)
  return slug
}

function splitTableRow(line) {
  let trimmed = line.trim()
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1)
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1)
  return trimmed.split('|').map(c => c.trim())
}

function isTableSeparatorRow(line) {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every(c => /^:?-+:?$/.test(c))
}

function extractYoutubeId(input) {
  const trimmed = input.trim()
  const match = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  return null
}

const CALLOUT_LABELS = { tip: '💡 Tip', note: '📝 Note', warning: '⚠️ Warning' }

// Converts a safe, extended subset of Markdown to HTML: headings (with
// anchor ids for a table of contents), bold/italic, links, images, lists,
// blockquotes, tables, callout boxes (:::tip Title ... :::), and YouTube
// embeds (@youtube(id-or-url)). Raw HTML is escaped first, so
// user-authored content can't inject scripts/tags.
export function markdownToHtml(markdown) {
  if (!markdown) return { html: '', headings: [] }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html = []
  const headings = []
  const usedSlugs = new Set()
  let listOpen = false
  let paragraph = []

  function flushParagraph() {
    if (paragraph.length > 0) {
      html.push(`<p>${inline(paragraph.join(' '))}</p>`)
      paragraph = []
    }
  }

  function closeList() {
    if (listOpen) {
      html.push('</ul>')
      listOpen = false
    }
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    if (line === '') {
      flushParagraph()
      closeList()
      i++
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      closeList()
      const level = heading[1].length
      const text = heading[2]
      const id = slugify(text, usedSlugs)
      html.push(`<h${level} id="${id}">${inline(text)}</h${level}>`)
      if (level <= 3) headings.push({ level, text, id })
      i++
      continue
    }

    const calloutStart = line.match(/^:::(tip|note|warning)\s*(.*)$/)
    if (calloutStart) {
      flushParagraph()
      closeList()
      const [, type, titleText] = calloutStart
      const body = []
      i++
      while (i < lines.length && lines[i].trim() !== ':::') {
        if (lines[i].trim() !== '') body.push(lines[i].trim())
        i++
      }
      i++ // skip closing :::
      const title = titleText.trim() || CALLOUT_LABELS[type]
      html.push(
        `<div class="callout callout--${type}"><div class="callout__title">${inline(title)}</div><div class="callout__body">${inline(body.join(' '))}</div></div>`
      )
      continue
    }

    const youtube = line.match(/^@youtube\((.+)\)$/)
    if (youtube) {
      flushParagraph()
      closeList()
      const videoId = extractYoutubeId(youtube[1])
      if (videoId) {
        html.push(
          `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" title="Embedded video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
        )
      }
      i++
      continue
    }

    if (line.startsWith('|') && line.endsWith('|') && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1])) {
      flushParagraph()
      closeList()
      const headerCells = splitTableRow(line)
      i += 2
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[i]))
        i++
      }
      html.push('<table><thead><tr>' + headerCells.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>')
      continue
    }

    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      flushParagraph()
      closeList()
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`)
      i++
      continue
    }

    const listItem = line.match(/^[-*]\s+(.*)$/)
    if (listItem) {
      flushParagraph()
      if (!listOpen) {
        html.push('<ul>')
        listOpen = true
      }
      html.push(`<li>${inline(listItem[1])}</li>`)
      i++
      continue
    }

    closeList()
    paragraph.push(line)
    i++
  }

  flushParagraph()
  closeList()

  return { html: html.join('\n'), headings }
}
