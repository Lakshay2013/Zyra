'use client'
import { useState } from 'react'

function Tile({ wide, title, children }: { wide?: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-6 ${wide ? 'md:col-span-2' : ''}`}>
      <p className="type-h3 text-text">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function IdempotencyDemo() {
  const [fired, setFired] = useState(false)
  return (
    <div onMouseEnter={() => setFired(true)} className="type-mono flex items-center gap-3 text-[12px]">
      <div className={`rounded-[var(--radius-sm)] border border-border px-3 py-2 transition-colors ${fired ? 'border-accent bg-accent-subtle' : ''}`}>
        request A
      </div>
      <div className={`rounded-[var(--radius-sm)] border border-border px-3 py-2 transition-colors delay-100 ${fired ? 'border-accent bg-accent-subtle' : ''}`}>
        request B
      </div>
      <span className="text-text-tertiary">→</span>
      <div className={`rounded-[var(--radius-sm)] border px-3 py-2 transition-colors ${fired ? 'border-success/30 bg-success-subtle text-success' : 'border-border'}`}>
        1 provider call
      </div>
      <span className="ml-auto text-[11px] text-text-tertiary">24h window · non-streaming only</span>
    </div>
  )
}

function CacheDemo() {
  const [hit, setHit] = useState(false)
  return (
    <div onMouseEnter={() => setHit(true)} className="type-mono text-[12px]">
      <p className="text-text-tertiary">key = model + messages + params</p>
      <p className={`mt-2 font-medium transition-colors ${hit ? 'text-success' : 'text-text-secondary'}`}>{hit ? 'cache: hit — instant' : 'cache: —'}</p>
      <p className="mt-1 text-[11px] text-text-tertiary">Exact match only, no semantic cache.</p>
    </div>
  )
}

function UsageLimitsDemo() {
  const [checked, setChecked] = useState(false)
  return (
    <div onMouseEnter={() => setChecked(true)} className="type-mono flex flex-col gap-2 text-[12px]">
      <div className={`rounded-[var(--radius-sm)] border px-3 py-2 ${checked ? 'border-success/30 bg-success-subtle text-success' : 'border-border'}`}>request A → reserved</div>
      <div className={`rounded-[var(--radius-sm)] border px-3 py-2 ${checked ? 'border-danger/30 bg-danger-subtle text-danger' : 'border-border'}`}>request B → rejected, plan limit</div>
      <p className="text-[11px] text-text-tertiary">Single atomic conditional MongoDB update.</p>
    </div>
  )
}

function ObservabilityDemo() {
  const rows = [
    { provider: 'openai', model: 'gpt-4o', cost: '$0.0119', flag: '—' },
    { provider: 'groq', model: 'llama-3.1-8b', cost: '$0.0000', flag: 'retry' },
  ]
  return (
    <div className="type-mono overflow-hidden rounded-[var(--radius-sm)] border border-border text-[11px]">
      {rows.map((r) => (
        <div key={r.model} className="flex justify-between border-b border-border px-3 py-2 last:border-b-0">
          <span className="text-text-secondary">{r.provider}/{r.model}</span>
          <span className="text-text-tertiary">{r.cost}</span>
          <span className="text-warning">{r.flag}</span>
        </div>
      ))}
      <p className="px-3 py-2 text-text-tertiary">risk score computed post-hoc, async via BullMQ</p>
    </div>
  )
}

const TILES = [
  { title: 'Idempotency', wide: true, node: <IdempotencyDemo /> },
  { title: 'Response cache', node: <CacheDemo /> },
  { title: 'Atomic usage limits', node: <UsageLimitsDemo /> },
  { title: 'Observability', wide: true, node: <ObservabilityDemo /> },
  {
    title: 'Self-host',
    node: (
      <div className="space-y-2">
        <p className="type-mono rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-[12px] text-text-secondary">docker compose up -d --build</p>
        <p className="type-mono text-[11px] text-success">/health → &#123;"status":"ok"&#125;</p>
      </div>
    ),
  },
  { title: 'MIT licensed', node: <p className="text-[13px] text-text-secondary">Use it, fork it, ship it.</p> },
]

export function BentoGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="type-h1 text-center text-text">Everything else</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {TILES.map((t) => (
          <Tile key={t.title} title={t.title} wide={t.wide}>
            {t.node}
          </Tile>
        ))}
      </div>
    </section>
  )
}
