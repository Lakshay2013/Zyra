'use client'
import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from '@/components/ui/icons'
import { ROUTING_PROMPTS, PIPELINE_STAGES, routingOutcome, debugHeaders, type RoutingPrompt } from '@/lib/demo-data'
import { PRICING_CHECKED_DATE, formatCost } from '@/lib/pricing'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type Phase = 'typing' | 'stages' | 'response' | 'hold'

const STAGE_STEP_MS = 160
const RESPONSE_MS = 1400
const HOLD_MS = 1600

function requestBody(p: RoutingPrompt) {
  return `{\n  "model": "auto",\n  "messages": [\n    { "role": "user", "content": "${p.request}" }\n  ]\n}`
}

export function RoutingDemo() {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [phase, setPhase] = useState<Phase>(reducedMotion ? 'hold' : 'typing')
  const [typedChars, setTypedChars] = useState(0)
  const [stageCount, setStageCount] = useState(0)
  const [animatedCost, setAnimatedCost] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const prompt = ROUTING_PROMPTS[index]
  const outcome = routingOutcome(prompt)
  const body = requestBody(prompt)

  // Selecting a prompt directly restarts its cycle (or snaps to final state under reduced motion).
  const selectPrompt = (i: number) => {
    setIndex(i)
    setPhase(reducedMotion ? 'hold' : 'typing')
    setTypedChars(reducedMotion ? body.length : 0)
    setStageCount(reducedMotion ? PIPELINE_STAGES.length : 0)
  }

  useEffect(() => {
    if (reducedMotion) {
      setTypedChars(body.length)
      setStageCount(PIPELINE_STAGES.length)
      setAnimatedCost(outcome.routedCost)
      return
    }
    if (!playing) return
    const clear = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    if (phase === 'typing') {
      if (typedChars < body.length) {
        timeoutRef.current = setTimeout(() => setTypedChars((c) => Math.min(c + 3, body.length)), 14)
      } else {
        timeoutRef.current = setTimeout(() => setPhase('stages'), 250)
      }
      return clear
    }
    if (phase === 'stages') {
      if (stageCount < PIPELINE_STAGES.length) {
        timeoutRef.current = setTimeout(() => setStageCount((c) => c + 1), STAGE_STEP_MS)
      } else {
        timeoutRef.current = setTimeout(() => setPhase('response'), 250)
      }
      return clear
    }
    if (phase === 'response') {
      const start = performance.now()
      let raf: number
      const tick = (now: number) => {
        const t = Math.min((now - start) / RESPONSE_MS, 1)
        setAnimatedCost(outcome.routedCost * (1 - Math.pow(1 - t, 3)))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      timeoutRef.current = setTimeout(() => setPhase('hold'), RESPONSE_MS)
      return () => {
        cancelAnimationFrame(raf)
        clear()
      }
    }
    if (phase === 'hold') {
      timeoutRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % ROUTING_PROMPTS.length)
        setPhase('typing')
        setTypedChars(0)
        setStageCount(0)
        setAnimatedCost(0)
      }, HOLD_MS)
      return clear
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, typedChars, stageCount, playing, reducedMotion])

  const stagesToShow = reducedMotion ? PIPELINE_STAGES.length : stageCount
  const showResponse = reducedMotion || phase === 'response' || phase === 'hold'

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            <span className="ml-3 type-mono text-[12px] text-text-tertiary">zyra — routing</span>
          </div>
          <button
            aria-label={playing ? 'Pause demo' : 'Play demo'}
            onClick={() => setPlaying((p) => !p)}
            className="press-feedback flex h-6 w-6 items-center justify-center rounded-full text-text-tertiary hover:bg-bg-subtle hover:text-text"
          >
            {playing ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
          {/* Request */}
          <div>
            <p className="type-mono mb-2 text-[11px] text-text-tertiary">POST /v1/chat/completions</p>
            <pre className="type-mono min-h-[110px] whitespace-pre-wrap break-words rounded-[var(--radius-sm)] border border-border bg-bg p-3 text-[12px] leading-relaxed text-text">
              {body.slice(0, typedChars)}
              {!reducedMotion && phase === 'typing' && typedChars < body.length && (
                <span className="animate-pulse text-accent">|</span>
              )}
            </pre>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {PIPELINE_STAGES.map((stage, i) => {
                const cleared = i < stagesToShow
                return (
                  <span
                    key={stage.label}
                    className={`type-mono rounded-full border px-2.5 py-1 text-[11px] transition-colors duration-200 ${
                      cleared
                        ? 'border-success/30 bg-success-subtle text-success'
                        : 'border-border text-text-tertiary'
                    }`}
                  >
                    {stage.label}
                    {cleared && <span className="text-text-tertiary"> · {stage.result(prompt)}</span>}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Response + cost */}
          <div className={`transition-opacity duration-300 ${showResponse ? 'opacity-100' : 'opacity-0'}`}>
            <p className="type-mono mb-2 text-[11px] text-text-tertiary">200 OK — debug headers</p>
            <div className="rounded-[var(--radius-sm)] border border-border bg-bg">
              {debugHeaders(prompt).map((h) => (
                <div key={h.key} className="type-mono flex justify-between border-b border-border px-3 py-1.5 text-[11px] last:border-b-0">
                  <span className="text-text-tertiary">{h.key}</span>
                  <span className="text-text">{h.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[var(--radius-sm)] border border-border bg-bg p-3">
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-text-secondary">Naive (gpt-4o)</span>
                <span className="type-mono text-text-tertiary line-through">{formatCost(outcome.naiveCost)}</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between text-[13px]">
                <span className="text-text-secondary">Routed ({prompt.model})</span>
                <span className="type-mono text-text">{formatCost(reducedMotion ? outcome.routedCost : animatedCost)}</span>
              </div>
              <div className="mt-2 border-t border-border pt-2 text-[13px] font-medium">
                <span className={outcome.savingsPct > 1 ? 'text-success' : 'text-text-secondary'}>
                  {outcome.savingsPct > 1 ? `Saved ${outcome.savingsPct.toFixed(0)}%` : 'No savings — frontier model required'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="type-mono border-t border-border px-5 py-2.5 text-[11px] text-text-tertiary md:px-6">
          Illustrative — based on public list prices as of {PRICING_CHECKED_DATE}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {ROUTING_PROMPTS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => selectPrompt(i)}
            className={`press-feedback rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
              i === index ? 'border-accent bg-accent-subtle text-accent' : 'border-border text-text-secondary hover:text-text'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
