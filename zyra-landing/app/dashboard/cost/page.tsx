'use client'

import { useState, useEffect } from 'react'
import { Server, Users } from 'lucide-react'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric'
import { EmptyState, LoadingScreen } from '@/components/ui/empty-state'
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/table'

const money = (n: number, d = 4) => `$${Number(n || 0).toFixed(d)}`
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`)

export default function CostDashboard() {
  const [ov, setOv] = useState<any>(null)
  const [cmp, setCmp] = useState<any>(null)
  const [breakdown, setBreakdown] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
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

  if (loading) return <LoadingScreen label="Loading cost analytics" />

  const withoutZyra = cmp?.withoutZyra ?? 0
  const withZyra = cmp?.withZyra ?? 0
  const saved = cmp?.saved ?? 0
  const pct = cmp?.percentReduction ?? 0
  const byModel: any[] = breakdown?.byModel || []
  const byUser: any[] = breakdown?.byUser || []
  const maxBar = Math.max(withoutZyra, withZyra, 0.0001)
  const maxUsageCost = Math.max(...usage.map((u) => u.totalCost || 0), 0.0001)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Analytics"
        subtitle={<>Token billing: <span className="font-mono text-accent">Cost = (pt·Pp + ct·Pc) / 1000</span> · pricing table is hand-maintained</>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total tokens" value={compact(ov?.totalTokens ?? 0)} hint={`${compact(ov?.promptTokens ?? 0)} prompt · ${compact(ov?.completionTokens ?? 0)} completion`} />
        <MetricCard label="Estimated spend" value={money(withZyra, 2)} tone="accent" hint="with Zyra routing" />
        <MetricCard label="Would-be spend" value={money(withoutZyra, 2)} hint="baseline model, no routing" />
        <MetricCard label="Saved" value={money(saved, 2)} unit={`(${pct}%)`} tone="success" />
      </div>

      {/* ── PRIMARY STORY: without vs with ── */}
      <Card padding="lg">
        <h2 className="type-h2 text-text">Without Zyra vs. with Zyra optimization</h2>
        <div className="mt-5 flex flex-col gap-4">
          {[
            { k: 'Without Zyra', v: withoutZyra, className: 'bg-text-tertiary' },
            { k: 'With Zyra', v: withZyra, className: 'bg-accent' },
          ].map((row) => (
            <div key={row.k}>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">{row.k}</span>
                <span className="font-mono text-text">{money(row.v, 4)}</span>
              </div>
              <div className="mt-1.5 h-5 overflow-hidden rounded-[6px] bg-bg-subtle">
                <div className={`h-full rounded-[6px] transition-[width] duration-500 ${row.className}`} style={{ width: `${Math.max((row.v / maxBar) * 100, 1)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[13px] font-medium text-success">
          → {pct}% reduction · {money(saved, 4)} saved over {cmp?.totalRequests ?? 0} requests ({cmp?.optimizedRequests ?? 0} routed, {cmp?.qualityRetries ?? 0} quality retries)
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-text-tertiary">
          Baseline = the model each request would have used without routing. Savings depend entirely on workload mix — Zyra does not promise a fixed percentage.
        </p>
      </Card>

      {/* ── COST OVER TIME ── */}
      <Card padding="lg">
        <div className="mb-4">
          <div className="type-meta text-text-tertiary">Cost over time</div>
          <h2 className="type-h2 mt-1 text-text">Daily spend &amp; savings</h2>
        </div>
        {usage.length > 0 ? (
          <>
            <div className="flex items-end gap-[3px]" style={{ height: 72 }}>
              {usage.map((u, i) => (
                <div key={i} className="flex-1" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div className="w-full rounded-t-[2px] bg-accent" style={{ height: `${Math.max(((u.totalCost || 0) / maxUsageCost) * 100, 2)}%`, opacity: 0.4 + ((u.totalCost || 0) / maxUsageCost) * 0.6 }} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-6 text-[12px] text-text-tertiary">
              <span>peak {money(Math.max(...usage.map((u) => u.totalCost || 0)))}/day</span>
              <span>total saved {money(usage.reduce((s, u) => s + (u.savings || 0), 0))}</span>
            </div>
          </>
        ) : <EmptyState title="No usage in the last 30 days" />}
      </Card>

      {/* ── BY MODEL / BY USER ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-border px-6 py-4"><h3 className="type-h3 text-text">Cost by model</h3></div>
          {byModel.length === 0 ? <EmptyState icon={Server} title="No model usage yet" /> : (
            <div className="space-y-3 p-4">
              {byModel.slice(0, 8).map((m) => {
                const max = Math.max(...byModel.map((x) => x.totalCost), 0.0001)
                return (
                  <div key={m._id}>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-text">{m._id || 'unknown'}</span>
                      <span className="font-mono text-text-tertiary">{money(m.totalCost)} · {compact(m.totalTokens)}t</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-bg-subtle">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(m.totalCost / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-border px-6 py-4"><h3 className="type-h3 text-text">Most expensive users</h3></div>
          {byUser.length === 0 ? <EmptyState icon={Users} title="No user activity yet" /> : (
            <Table>
              <TBody>
                {byUser.slice(0, 8).map((u, i) => (
                  <TR key={u._id}>
                    <TD className="text-text-tertiary">{i + 1}</TD>
                    <TD>{u._id}</TD>
                    <TD align="right" className="text-text-tertiary">{compact(u.totalTokens)}t</TD>
                    <TD align="right" className="font-mono text-accent">{money(u.totalCost)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>

      {/* ── MODEL SWAPS ── */}
      {cmp?.modelSwaps?.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-border px-6 py-4"><h3 className="type-h3 text-text">Routing swaps</h3></div>
          <Table>
            <THead>
              <tr><TH>From</TH><TH>To</TH><TH align="right">Requests</TH><TH align="right">Saved</TH></tr>
            </THead>
            <TBody>
              {cmp.modelSwaps.map((s: any, i: number) => (
                <TR key={i}>
                  <TD className="text-text-tertiary">{s.from}</TD>
                  <TD>{s.to}</TD>
                  <TD align="right" className="text-text-tertiary">{s.requests}</TD>
                  <TD align="right" className="font-mono text-success">{money(s.saved)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
