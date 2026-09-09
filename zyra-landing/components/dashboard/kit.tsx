'use client'

import React from 'react'

/* Shared dashboard design tokens + primitives.
   Matches the terminal aesthetic used across /dashboard/*  */

export const C = {
  bg: '#131314',
  panel: '#201f20',
  panel2: '#1c1b1c',
  card: '#2a2a2b',
  border: 'rgba(83,67,65,0.15)',
  text: '#e5e2e3',
  dim: '#71717a',
  faint: '#534341',
  accent: '#ffa69e',
  accentInk: '#3b0908',
  green: '#9be8cb',
  red: '#ffb4ab',
  amber: '#f5c86b',
  mono: "'JetBrains Mono', monospace",
}

export const SEVERITY: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: C.green, bg: 'rgba(155,232,203,0.12)', label: 'LOW' },
  medium: { color: C.amber, bg: 'rgba(245,200,107,0.12)', label: 'MEDIUM' },
  high: { color: C.accent, bg: 'rgba(255,166,158,0.14)', label: 'HIGH' },
  critical: { color: C.red, bg: 'rgba(255,180,171,0.16)', label: 'CRITICAL' },
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
      <div>
        <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: C.text, lineHeight: 1 }}>{title}</h1>
        {subtitle && <p style={{ fontFamily: C.mono, fontSize: 12, color: C.dim, marginTop: 8 }}>{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  )
}

export function Card({ children, className = '', pad = 24, style = {} }: { children: React.ReactNode; className?: string; pad?: number; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{ background: C.panel, borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)', padding: pad, ...style }}>
      {children}
    </div>
  )
}

export function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: C.dim, textTransform: 'uppercase' }}>{children}</span>
}

export function StatTile({ label, value, unit, tone = 'default', hint }: {
  label: string; value: React.ReactNode; unit?: string; tone?: 'default' | 'good' | 'bad' | 'warn' | 'accent'; hint?: string
}) {
  const color = tone === 'good' ? C.green : tone === 'bad' ? C.red : tone === 'warn' ? C.amber : tone === 'accent' ? C.accent : C.text
  return (
    <div style={{ background: C.card, borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)', padding: 20 }}>
      <Label>{label}</Label>
      <div className="flex items-baseline gap-1" style={{ marginTop: 8 }}>
        <span style={{ fontFamily: C.mono, fontSize: 30, fontWeight: 800, color }}>{value}</span>
        {unit && <span style={{ fontFamily: C.mono, fontSize: 12, color: C.dim }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize: 10, color: C.dim, marginTop: 6, letterSpacing: '0.05em' }}>{hint}</div>}
    </div>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY[severity] || SEVERITY.low
  return (
    <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 6 }}>
      {s.label}
    </span>
  )
}

export function FlagPill({ label, on }: { label: string; on: boolean }) {
  return (
    <span style={{
      fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 5,
      color: on ? C.red : C.faint, background: on ? 'rgba(255,180,171,0.12)' : 'transparent',
      border: `1px solid ${on ? 'rgba(255,180,171,0.25)' : 'rgba(83,67,65,0.2)'}`,
    }}>{label}</span>
  )
}

/** Tiny inline SVG sparkline/bar row — theme-aware, no deps. */
export function MiniBars({ data, height = 64, color = C.accent }: { data: number[]; height?: number; color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 group relative" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', height: `${Math.max((v / max) * 100, 2)}%`, background: color, opacity: 0.35 + (v / max) * 0.65, borderRadius: '2px 2px 0 0' }} />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: '48px 24px', gap: 10 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: C.faint }}>{icon}</span>
      <p style={{ color: C.dim, fontSize: 13, fontWeight: 600 }}>{title}</p>
      {sub && <p style={{ color: C.faint, fontSize: 12, maxWidth: 320, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  )
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="flex gap-3 items-center justify-center" style={{ minHeight: '50vh', color: C.accent }}>
      <span className="material-symbols-outlined animate-pulse">shield</span>
      <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}
