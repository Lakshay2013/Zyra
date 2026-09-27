'use client'
import { ROUTING_PROMPTS, routingOutcome } from '@/lib/demo-data'
import { PRICING_CHECKED_DATE } from '@/lib/pricing'
import { useCountUp } from '@/hooks/useCountUp'

// Illustrative 1,000-request mix, weighted toward the simple/short calls that
// make up most real traffic. Same token profiles as the hero demo prompts.
const MIX = { simple: 500, standard: 350, complex: 150 }

function totals() {
  let naive = 0
  let routed = 0
  const byTier: Record<string, number> = {}
  for (const p of ROUTING_PROMPTS) {
    const count = MIX[p.complexity as keyof typeof MIX]
    const { naiveCost, routedCost } = routingOutcome(p)
    naive += naiveCost * count
    routed += routedCost * count
    byTier[p.tier] = (byTier[p.tier] ?? 0) + routedCost * count
  }
  return { naive, routed, byTier }
}

function Counter({ value, className }: { value: number; className?: string }) {
  const { ref, value: animated } = useCountUp<HTMLSpanElement>(value)
  return (
    <span ref={ref} className={className}>
      ${animated.toFixed(2)}
    </span>
  )
}

export function CostComparison() {
  const { naive, routed, byTier } = totals()
  const tierOrder: Array<[string, string]> = [
    ['economy', 'bg-success'],
    ['standard', 'bg-accent'],
    ['premium', 'bg-warning'],
  ]

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="type-h1 text-center text-text">Same 1,000 requests, two ways</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-6">
          <p className="type-mono text-[12px] text-text-tertiary">Direct to gpt-4o</p>
          <Counter value={naive} className="type-mono mt-3 block text-[40px] font-semibold text-text" />
          <p className="mt-2 text-[13px] text-text-secondary">One model for every request, regardless of complexity.</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-accent/30 bg-accent-subtle p-6">
          <p className="type-mono text-[12px] text-text-tertiary">Through Zyra</p>
          <Counter value={routed} className="type-mono mt-3 block text-[40px] font-semibold text-accent" />
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-bg">
            {tierOrder.map(([tier, color]) => (
              <span key={tier} className={color} style={{ width: `${((byTier[tier] ?? 0) / routed) * 100}%` }} />
            ))}
          </div>
          <p className="mt-2 text-[13px] text-text-secondary">Split across economy, standard, and premium tiers by prompt complexity.</p>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-[14px] leading-relaxed text-text-secondary">
        Savings depend entirely on workload mix. Short, classifiable calls save the most; hard reasoning tasks route to
        a frontier model and save little or nothing. Figures above are illustrative, built from public list prices as
        of {PRICING_CHECKED_DATE}, not a guarantee.
      </p>
    </section>
  )
}
