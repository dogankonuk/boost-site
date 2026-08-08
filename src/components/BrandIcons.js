function Icon({ size = 24, children, fill = 'none', strokeWidth = 2 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function ServiceTypeIcon({ type = 'bolt', size = 24 }) {
  switch (type) {
    case 'level':
      return <Icon size={size}><path d="M4 17l5-5 4 3 7-8" /><path d="M15 7h5v5" /></Icon>
    case 'rank':
      return <Icon size={size}><path d="M8 5h8v4a4 4 0 0 1-8 0V5Z" /><path d="M8 7H5v1a4 4 0 0 0 4 4M16 7h3v1a4 4 0 0 1-4 4M12 13v4M8 20h8M9 17h6" /></Icon>
    case 'currency':
      return <Icon size={size}><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></Icon>
    case 'season':
      return <Icon size={size}><path d="M3 7l4 4 5-7 5 7 4-4-2 11H5L3 7Z" /></Icon>
    case 'gear':
      return <Icon size={size}><path d="M12 3l7 5-7 13L5 8l7-5Z" /><path d="M5 8h14M9 8l3 13 3-13" /></Icon>
    case 'quest':
      return <Icon size={size}><path d="M5 21V6l7-3 7 3v15" /><path d="M9 21v-5h6v5M9 9h.01M15 9h.01M12 3v4" /></Icon>
    case 'pvp':
      return <Icon size={size}><path d="M6 4l14 14M18 4L4 18M14 4l4 4M4 14l4 4M16 18l2 2M6 18l-2 2" /></Icon>
    case 'achievement':
      return <Icon size={size}><circle cx="12" cy="9" r="5" /><path d="M9 14l-1 7 4-2 4 2-1-7" /><path d="M12 6v3l2 1" /></Icon>
    case 'coaching':
      return <Icon size={size}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" /></Icon>
    case 'account':
      return <GamepadIcon size={size} />
    default:
      return <BoltIcon size={size} />
  }
}

export function BoltIcon({ size = 24 }) {
  return <Icon size={size}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z" /></Icon>
}

export function FlameIcon({ size = 24 }) {
  return <Icon size={size}><path d="M12 22c4 0 7-2.8 7-7 0-3-1.7-5.6-4.8-8.4.2 2-1 3.2-2.2 4.1.1-3.3-1.7-6.4-4.5-8.7.2 4-2.5 6.2-2.5 10.2C5 17.8 8 22 12 22Z" /><path d="M10 18c-1.1-1.5-.8-3.5.8-5.1.2 1.4 1 2.1 1.7 2.8.8-.7 1.2-1.6 1.1-2.7 1.1 1.1 1.6 2.3 1.4 3.5-.2 1.8-1.4 3-3 3.2" /></Icon>
}

export function GamepadIcon({ size = 24 }) {
  return <Icon size={size}><rect x="3" y="7" width="18" height="11" rx="5" /><path d="M8 10v5M5.5 12.5h5M16 11.5h.01M18.5 14h.01" /></Icon>
}

export function RssIcon({ size = 24 }) {
  return <Icon size={size}><path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" /><circle cx="6" cy="18" r="1" fill="currentColor" stroke="none" /></Icon>
}

export function ArticleIcon({ size = 24 }) {
  return <Icon size={size}><path d="M6 3h9l3 3v15H6V3Z" /><path d="M14 3v4h4M9 11h6M9 15h6" /></Icon>
}

export function AlertTriangleIcon({ size = 24 }) {
  return <Icon size={size}><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17h.01" /></Icon>
}

export function XIcon({ size = 24 }) {
  return <Icon size={size}><path d="m6 6 12 12M18 6 6 18" /></Icon>
}
