import React from 'react'
import { cn } from '@/lib/utils'

export function Card({ children, className, padding = 'md' }: {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}) {
  const pad = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }[padding]
  return (
    <div className={cn('rounded-[var(--radius-md)] border border-border bg-bg-elevated', pad, className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between gap-3 border-b border-border px-6 py-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('type-h3 text-text', className)}>{children}</h3>
}
