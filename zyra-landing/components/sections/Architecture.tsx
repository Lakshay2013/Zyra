'use client'
import { useInView } from '@/hooks/useInView'

const STAGES = [
  'request', 'auth', 'pre-flight', 'idempotency', 'cache', 'usage reservation', 'cost optimizer', 'provider call', 'response',
]

const BOX_W = 120
const BOX_H = 44
const GAP = 26
const STEP = BOX_W + GAP
const START_X = 10
const ROW_Y = 20

const centers = STAGES.map((_, i) => START_X + i * STEP + BOX_W / 2)
const pathD = `M ${centers[0]} ${ROW_Y + BOX_H / 2} ` + centers.slice(1).map((cx) => `L ${cx} ${ROW_Y + BOX_H / 2}`).join(' ')
const viewW = START_X * 2 + STAGES.length * STEP - GAP
const branchX = centers[7]

export function Architecture() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 })

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="type-h1 text-center text-text">The real pipeline</h2>
      <div ref={ref} className="mt-10 overflow-x-auto">
        <svg viewBox={`0 0 ${viewW} 210`} className="h-auto min-w-[900px] w-full" role="img" aria-label="Zyra request pipeline: request, auth, pre-flight, idempotency, cache, usage reservation, cost optimizer, provider call, response — with an async branch to BullMQ, worker, MongoDB, and risk analysis">
          <path d={pathD} stroke="var(--color-border-strong)" strokeWidth="2" fill="none" />
          <path d={`M ${branchX} ${ROW_Y + BOX_H} L ${branchX} 150`} stroke="var(--color-border-strong)" strokeWidth="2" strokeDasharray="4 4" fill="none" />

          {inView && (
            <circle r="5" fill="var(--color-accent)" style={{ offsetPath: `path('${pathD}')`, animation: 'zyra-dot-travel 2.4s ease-in-out 1' }} />
          )}

          {STAGES.map((label, i) => (
            <g key={label} transform={`translate(${START_X + i * STEP}, ${ROW_Y})`}>
              <rect width={BOX_W} height={BOX_H} rx="8" fill="var(--color-bg-elevated)" stroke="var(--color-border)" />
              <text x={BOX_W / 2} y={BOX_H / 2 + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-text)">
                {label}
              </text>
            </g>
          ))}

          <g transform={`translate(${branchX - 130}, 150)`}>
            <rect width="260" height="44" rx="8" fill="var(--color-bg-subtle)" stroke="var(--color-border)" strokeDasharray="3 3" />
            <text x="130" y="27" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--color-text-secondary)">
              async: BullMQ → worker → MongoDB → risk analysis
            </text>
          </g>
        </svg>
      </div>
      <style>{`
        @keyframes zyra-dot-travel {
          from { offset-distance: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          to { offset-distance: 100%; opacity: 0; }
        }
      `}</style>
    </section>
  )
}
