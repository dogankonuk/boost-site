export default function Container({ children, style }) {
  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '0 48px',
      width: '100%',
      ...style,
    }}>
      {children}
    </div>
  )
}