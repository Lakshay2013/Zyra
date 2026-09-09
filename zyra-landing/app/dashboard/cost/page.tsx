'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { C, PageHeader, Card, Label, StatTile, MiniBars, EmptyState, Loading } from '@/components/dashboard/kit'

const money = (n: number, d = 4) => `$${Number(n || 0).toFixed(d)}`
const compact = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`

export default function CostDashboard() {
  const [ov, setOv] = useState<any>(null)
  const [cmp, setCmp] = useState<any>(null)
  const [breakdown, setBreakdown] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [a, b, c, d] = await Promise.all([
          api.get('/api/analytics/overview'),
          api.get('/api/analytics/cost-comparison?days=30'),
          api.get('/api/analytics/cost-breakdown?days=30'),
          api.get('/api/analytics/usage?period=30d'),
        ])
        setOv(a.data); setCmp(b.data); setBreakdown(c.data); setUsage(d.data.usage || [])
      } catch (e) { console.error('cost load failed', e) }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <Loading label="Loading cost analytics…" />

  const withoutZyra = cmp?.withoutZyra ?? 0
  const withZyra = cmp?.withZyra ?? 0
  const saved = cmp?.saved ?? 0
  const pct = cmp?.percentReduction ?? 0
  const byModel: any[] = breakdown?.byModel || []
  const byUser: any[] = breakdown?.byUser || []
  const maxBar = Math.max(withoutZyra, withZyra, 0.0001)

  return (
    <div>
      <PageHeader
        title="COST_ANALYTICS"
        subtitle={<>TOKEN BILLING: <span style={{ color: C.accent }}>Cost = (pt·Pp + ct·Pc) / 1000</span> {'//'} PRICING TABLE HAND-MAINTAINED</>}
      />

      {/* ── TOKEN + COST TILES ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatTile label="Total Tokens" value={compact(ov?.totalTokens ?? 0)} hint={`${compact(ov?.promptTokens ?? 0)} prompt · ${compact(ov?.completionTokens ?? 0)} completion`} />
        <StatTile label="Estimated Spend" value={money(withZyra, 2)} tone="accent" hint="with Zyra routing" />
        <StatTile label="Would-be Spend" value={money(withoutZyra, 2)} hint="baseline model, no routing" />
        <StatTile label="Saved" value={money(saved, 2)} unit={`(${pct}%)`} tone="good" />
      </div>

      {/* ── WITHOUT vs WITH ── */}
      <Card className="mt-6">
        <Label>Without Zyra  vs  With Zyra Optimization</Label>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { k: 'WITHOUT ZYRA', v: withoutZyra, color: C.faint },
            { k: 'WITH ZYRA', v: withZyra, color: C.accent },
          ].map((row) => (
            <div key={row.k}>
              <div className="flex justify-between" style={{ fontFamily: C.mono, fontSize: 12, color: C.dim }}>
                <span>{row.k}</span><span style={{ color: C.text }}>{money(row.v, 4)}</span>
              </div>
              <div style={{ height: 22, background: C.bg, borderRadius: 6, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max((row.v / maxBar) * 100, 1)}%`, background: row.color, borderRadius: 6, transition: 'width .4s' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontFamily: C.mono, fontSize: 12, color: C.green }}>
          → {pct}% reduction · {money(saved, 4)} saved over {cmp?.totalRequests ?? 0} requests ({cmp?.optimizedRequests ?? 0} routed, {cmp?.qualityRetries ?? 0} quality retries)
        </div>
        <p style={{ fontSize: 10, color: C.faint, marginTop: 10, lineHeight: 1.5 }}>
          Baseline = the model each request would have used without routing. Savings depend entirely on workload mix — Zyra does not promise a fixed percentage.
        </p>
      </Card>

      {/* ── COST OVER TIME ── */}
      <Card className="mt-6">
        <div className="flex justify-between items-start mb-4">
          <div><Label>Cost Over Time</Label><div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>Daily spend &amp; savings</div></div>
        </div>
        {usage.length > 0 ? (
          <>
            <MiniBars data={usage.map((u) => u.totalCost || 0)} height={72} color={C.accent} />
            <div className="flex gap-6 mt-3" style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>
              <span><span style={{ color: C.accent }}>■</span> spend</span>
              <span>peak {money(Math.max(...usage.map((u) => u.totalCost || 0)))}/day</span>
              <span>total saved {money(usage.reduce((s, u) => s + (u.savings || 0), 0))}</span>
            </div>
          </>
        ) : <EmptyState icon="show_chart" title="No usage in the last 30 days" />}
      </Card>

      {/* ── BY MODEL / BY USER ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(83,67,65,0.08)', background: C.panel2 }}>
            <h3 style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, color: C.text, textTransform: 'uppercase' }}>Cost by Model</h3>
          </div>
          {byModel.length === 0 ? <EmptyState icon="dns" title="No model usage yet" /> : (
            <div style={{ padding: 12 }}>
              {byModel.slice(0, 8).map((m) => {
                const max = Math.max(...byModel.map((x) => x.totalCost), 0.0001)
                return (
                  <div key={m._id} style={{ padding: '8px 10px' }}>
                    <div className="flex justify-between" style={{ fontFamily: C.mono, fontSize: 12 }}>
                      <span style={{ color: C.text }}>{m._id || 'unknown'}</span>
                      <span style={{ color: C.dim }}>{money(m.totalCost)} · {compact(m.totalTokens)}t</span>
                    </div>
                    <div style={{ height: 5, background: C.bg, borderRadius: 99, marginTop: 4 }}>
                      <div style={{ height: '100%', width: `${(m.totalCost / max) * 100}%`, background: C.accent, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(83,67,65,0.08)', background: C.panel2 }}>
            <h3 style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, color: C.text, textTransform: 'uppercase' }}>Most Expensive Users</h3>
          </div>
          {byUser.length === 0 ? <EmptyState icon="group" title="No user activity yet" /> : (
            <table style={{ width: '100%', fontFamily: C.mono, fontSize: 12, borderCollapse: 'collapse' }}>
              <tbody>
                {byUser.slice(0, 8).map((u, i) => (
                  <tr key={u._id} style={{ borderTop: i ? '1px solid rgba(83,67,65,0.06)' : 'none' }}>
                    <td style={{ padding: '10px 16px', color: C.dim }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', color: C.text }}>{u._id}</td>
                    <td style={{ padding: '10px 12px', color: C.dim, textAlign: 'right' }}>{compact(u.totalTokens)}t</td>
                    <td style={{ padding: '10px 16px', color: C.accent, textAlign: 'right' }}>{money(u.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* ── MODEL SWAPS ── */}
      {cmp?.modelSwaps?.length > 0 && (
        <Card className="mt-6" pad={0} style={{ overflow: 'hidden' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(83,67,65,0.08)', background: C.panel2 }}>
            <h3 style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, color: C.text, textTransform: 'uppercase' }}>Routing Swaps</h3>
          </div>
          <table style={{ width: '100%', fontFamily: C.mono, fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ color: C.dim }}>{['From', '→', 'To', 'Requests', 'Saved'].map((h) => <th key={h} style={{ padding: '10px 14px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left' }}>{h}</th>)}</tr></thead>
            <tbody>
              {cmp.modelSwaps.map((s: any, i: number) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(83,67,65,0.06)' }}>
                  <td style={{ padding: '10px 14px', color: C.dim }}>{s.from}</td>
                  <td style={{ padding: '10px 14px', color: C.faint }}>→</td>
                  <td style={{ padding: '10px 14px', color: C.text }}>{s.to}</td>
                  <td style={{ padding: '10px 14px', color: C.dim }}>{s.requests}</td>
                  <td style={{ padding: '10px 14px', color: C.green }}>{money(s.saved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
