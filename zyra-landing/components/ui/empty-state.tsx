import React from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon = Inbox, title, sub }: { icon?: LucideIcon; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
      <Icon size={28} className="text-text-tertiary" strokeWidth={1.5} />
      <p className="text-[13px] font-medium text-text-secondary">{title}</p>
      {sub && <p className="max-w-xs text-[12px] leading-relaxed text-text-tertiary">{sub}</p>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-sm)] bg-bg-subtle ${className}`} />
}

export function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2.5 text-text-tertiary">
      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span className="type-meta">{label}</span>
    </div>
  )
}
