import React from 'react'
import { cn } from '@/lib/utils'

export function Metric({ label, value, unit, hint, tone = 'default', size = 'md' }: {
  label: string
  value: React.ReactNode
  unit?: string
  hint?: string
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'accent'
  size?: 'md' | 'lg'
}) {
  const toneClass = {
    default: 'text-text',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    accent: 'text-accent',
  }[tone]
  return (
    <div>
      <div className="type-meta text-text-tertiary">{label}</div>
      <div className={cn('flex items-baseline gap-1.5', size === 'lg' ? 'mt-2' : 'mt-1.5')}>
        <span className={cn('font-mono font-semibold tracking-tight', size === 'lg' ? 'text-[2.25rem]' : 'text-[1.5rem]', toneClass)}>
          {value}
        </span>
        {unit && <span className="text-[13px] text-text-tertiary">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-[12px] text-text-tertiary">{hint}</div>}
    </div>
  )
}

export function MetricCard(props: Parameters<typeof Metric>[0] & { className?: string }) {
  const { className, ...rest } = props
  return (
    <div className={cn('rounded-[var(--radius-md)] border border-border bg-bg-elevated p-5', className)}>
      <Metric {...rest} />
    </div>
  )
}
