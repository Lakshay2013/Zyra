import React from 'react'

const WEIGHTS: Record<string, number> = { injection: 0.35, jailbreak: 0.3, pii: 0.2, abuse: 0.15 }
const LABELS: Record<string, string> = { injection: 'Injection', jailbreak: 'Jailbreak', pii: 'PII', abuse: 'Abuse' }

/**
 * Visualizes the paper's risk formula R = 0.35I + 0.30J + 0.20P + 0.15A as a
 * per-component bar with its raw score and weighted contribution — makes the
 * formula legible without changing the backend calculation.
 */
type Components = { injection: number; jailbreak: number; pii: number; abuse: number }

export function RiskBar({ components }: { components: Components }) {
  return (
    <div className="space-y-3">
      {(Object.keys(WEIGHTS) as Array<keyof Components>).map((key) => {
        const raw = components[key] ?? 0
        const weighted = raw * WEIGHTS[key]
        return (
          <div key={key}>
            <div className="mb-1 flex items-baseline justify-between text-[12px]">
              <span className="font-medium text-text-secondary">
                {LABELS[key]} <span className="text-text-tertiary">(w={WEIGHTS[key].toFixed(2)})</span>
              </span>
              <span className="font-mono text-text">
                {raw} → {weighted.toFixed(1)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
              <div
                className="h-full rounded-full bg-danger transition-[width] duration-300"
                style={{ width: `${Math.min(raw, 100)}%`, opacity: raw > 0 ? 1 : 0 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
