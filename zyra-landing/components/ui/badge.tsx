import React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ children, className, tone = 'neutral' }: {
  children: React.ReactNode
  className?: string
  tone?: 'neutral' | 'accent' | 'success' | 'danger' | 'warning'
}) {
  const toneClass: Record<string, string> = {
    neutral: 'bg-bg-subtle text-text-secondary',
    accent: 'bg-[var(--color-accent-subtle)] text-accent',
    success: 'bg-[var(--color-success-subtle)] text-success',
    danger: 'bg-[var(--color-danger-subtle)] text-danger',
    warning: 'bg-[var(--color-warning-subtle)] text-warning',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-0.5 type-meta', toneClass[tone], className)}>
      {children}
    </span>
  )
}

const SEVERITY: Record<string, { tone: 'success' | 'warning' | 'danger'; label: string }> = {
  low: { tone: 'success', label: 'Low' },
  medium: { tone: 'warning', label: 'Medium' },
  high: { tone: 'danger', label: 'High' },
  critical: { tone: 'danger', label: 'Critical' },
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY[severity] || SEVERITY.low
  return (
    <Badge tone={s.tone}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.tone === 'success' ? 'bg-success' : s.tone === 'warning' ? 'bg-warning' : 'bg-danger')} />
      {s.label}
    </Badge>
  )
}

/** SAFE / BLOCKED / WARN pipeline status — never color alone, always paired with a label. */
export function StatusBadge({ status }: { status: 'safe' | 'blocked' | 'warn' | 'error' }) {
  const map = {
    safe: { tone: 'success' as const, label: 'Safe' },
    blocked: { tone: 'danger' as const, label: 'Blocked' },
    warn: { tone: 'warning' as const, label: 'Warning' },
    error: { tone: 'danger' as const, label: 'Error' },
  }
  const s = map[status]
  return <Badge tone={s.tone}>{s.label}</Badge>
}

const PROVIDER_LABEL: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  groq: 'Groq',
  gemini: 'Gemini',
  simulator: 'Simulator',
}

export function ProviderBadge({ provider }: { provider: string }) {
  return <Badge tone="neutral">{PROVIDER_LABEL[provider] || provider || 'Unknown'}</Badge>
}

export function ModelBadge({ model }: { model: string }) {
  return (
    <span className="rounded-[var(--radius-sm)] bg-bg-subtle px-2 py-0.5 font-mono text-[12px] text-text-secondary">
      {model}
    </span>
  )
}

/** Pill toggle for filter chips / preset selectors — replaces the old uppercase-mono preset buttons. */
export function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'press-feedback rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-transparent bg-text text-bg'
          : 'border-border text-text-secondary hover:border-border-strong hover:text-text'
      )}
    >
      {children}
    </button>
  )
}
