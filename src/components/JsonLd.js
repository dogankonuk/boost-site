// Renders a JSON-LD structured-data block. Escaping `<` prevents a value
// containing "</script>" from prematurely closing the script tag.
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
