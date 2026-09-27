'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RAIL_FEATURES } from '@/lib/features'

function RoutingVisual() {
  const rows = [
    { label: 'simple', tier: 'economy', color: 'bg-success' },
    { label: 'standard', tier: 'standard', color: 'bg-accent' },
    { label: 'complex', tier: 'premium', color: 'bg-warning' },
  ]
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="type-mono w-16 text-[11px] text-text-tertiary">{r.label}</span>
          <div className="h-2 flex-1 rounded-full bg-bg" />
          <span className={`type-mono rounded-full px-2.5 py-1 text-[11px] text-text-on-accent ${r.color}`}>{r.tier}</span>
        </div>
      ))}
    </div>
  )
}

function QualityGuardVisual() {
  return (
    <div className="space-y-3">
      <div className="type-mono rounded-[var(--radius-sm)] border border-danger/30 bg-danger-subtle p-3 text-[12px] text-danger">
        response: "" (empty) — flagged
      </div>
      <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
        <span>retry → premium tier</span>
      </div>
      <div className="type-mono flex justify-between rounded-[var(--radius-sm)] border border-success/30 bg-success-subtle p-3 text-[12px]">
        <span className="text-text-tertiary">x-zyra-quality-retry</span>
        <span className="text-success">true</span>
      </div>
    </div>
  )
}

function ReliabilityVisual() {
  return (
    <div className="space-y-2 type-mono text-[12px]">
      <div className="rounded-[var(--radius-sm)] border border-warning/30 bg-warning-subtle p-2.5 text-warning">provider A → 503, backoff 500ms</div>
      <div className="rounded-[var(--radius-sm)] border border-warning/30 bg-warning-subtle p-2.5 text-warning">retry → 503, backoff 1000ms</div>
      <div className="rounded-[var(--radius-sm)] border border-success/30 bg-success-subtle p-2.5 text-success">fallback → provider B, 200 OK</div>
      <p className="pt-1 text-[11px] text-text-tertiary">401 / invalid-model never retry</p>
    </div>
  )
}

function PreflightVisual() {
  return (
    <div className="space-y-3">
      <div className="type-mono rounded-[var(--radius-sm)] border border-border bg-bg p-3 text-[12px] text-text-secondary">
        contact me at ████████@████.com
      </div>
      <div className="type-mono rounded-[var(--radius-sm)] border border-danger/30 bg-danger-subtle p-3 text-[12px] text-danger">
        403 · pii_type: ["email"]
      </div>
    </div>
  )
}

const VISUALS = [RoutingVisual, QualityGuardVisual, ReliabilityVisual, PreflightVisual]

export function FeatureRail() {
  const [active, setActive] = useState(0)
  const [userInteracted, setUserInteracted] = useState(false)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = refs.current.map((el, i) => {
      if (!el) return null
      const io = new IntersectionObserver(
        ([entry]) => entry.isIntersecting && setActive(i),
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
      )
      io.observe(el)
      return io
    })
    return () => observers.forEach((io) => io?.disconnect())
  }, [])

  // Mobile-only auto-advance, stops after the visitor picks a tab themselves.
  useEffect(() => {
    if (userInteracted) return
    const id = setInterval(() => setActive((a) => (a + 1) % RAIL_FEATURES.length), 4000)
    return () => clearInterval(id)
  }, [userInteracted])

  const Visual = VISUALS[active]

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="type-h1 text-center text-text">The four core capabilities</h2>

      {/* Mobile tabs */}
      <div className="mt-8 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {RAIL_FEATURES.map((f, i) => (
            <button
              key={f.id}
              onClick={() => {
                setActive(i)
                setUserInteracted(true)
              }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                active === i ? 'border-accent bg-accent-subtle text-accent' : 'border-border text-text-secondary'
              }`}
            >
              {f.title}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-5">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Visual />
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-text-secondary">{RAIL_FEATURES[active].body}</p>
      </div>

      {/* Desktop sticky rail */}
      <div className="mt-12 hidden grid-cols-[auto_1fr] gap-12 md:grid">
        <div className="relative flex flex-col gap-1">
          <div className="absolute left-0 top-0 h-full w-px bg-border" />
          {RAIL_FEATURES.map((f, i) => (
            <div
              key={f.id}
              ref={(el) => { refs.current[i] = el }}
              className="min-h-[50vh] max-w-md py-8 pl-6"
              style={{ borderLeft: active === i ? '2px solid var(--color-accent)' : '2px solid transparent', marginLeft: '-2px' }}
            >
              <p className="type-h3 text-text">{f.title}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="sticky top-24 h-fit self-start rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-6">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <Visual />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
