// Minimal inline-SVG icons for the landing page — kept out of lucide-react on purpose.
// Lucide stays installed and in use for the (out-of-scope) dashboard.
type IconProps = { size?: number; className?: string }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function Menu({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

export function X({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

export function Sun({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="6.6" y2="6.6" />
      <line x1="17.4" y1="17.4" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="6.6" y2="17.4" />
      <line x1="17.4" y1="6.6" x2="19.1" y2="4.9" />
    </svg>
  )
}

export function Moon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  )
}

export function Play({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor" stroke="none">
      <path d="M7 4.5v15l13-7.5-13-7.5Z" />
    </svg>
  )
}

export function Pause({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

export function Copy({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

export function Check({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polyline points="4,12.5 9,17.5 20,6" />
    </svg>
  )
}

export function ChevronDown({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <polyline points="5,8.5 12,15.5 19,8.5" />
    </svg>
  )
}
