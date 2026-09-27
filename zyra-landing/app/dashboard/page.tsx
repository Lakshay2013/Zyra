'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Download, RefreshCw, TrendingDown, BarChart3, ArrowUpRight } from 'lucide-react'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Metric } from '@/components/ui/metric'
import { LoadingScreen } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

export default function DashboardOverview() {
  const [stats, setStats] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])
  const [costBreakdown, setCostBreakdown] = useState<any>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      const [overviewRes, usageRes, highRiskRes, costRes, recentRes] = await Promise.all([
        api.get('/api/analytics/overview'),
        api.get('/api/analytics/usage?period=30d'),
        api.get('/api/analytics/high-risk'),
        api.get('/api/analytics/cost-breakdown'),
        api.get('/api/analytics/recent'),
      ])
      setStats(overviewRes.data)
      setUsage(usageRes.data.usage || [])
      setCostBreakdown(costRes.data)
      setRecentLogs(recentRes.data.recent || [])
      void highRiskRes
    } catch (err) {
      console.error('Failed to load analytics', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ stats, usage, recentLogs }, null, 2))
    const a = document.createElement('a')
    a.setAttribute('href', dataStr)
    a.setAttribute('download', 'zyra_dashboard_export.json')
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  useEffect(() => {
    handleRefresh().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <LoadingScreen label="Loading overview" />

  const maxLogs = usage.length > 0 ? Math.max(...usage.map((u) => u.totalLogs), 1) : 1
  const chartData = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const dateStr = d.toISOString().split('T')[0]
    const u = usage.find((x: any) => x._id === dateStr)
    return {
      height: u ? (u.totalLogs / maxLogs) * 100 : 0,
      date: d,
      value: u ? u.totalLogs : 0,
      cost: u ? u.totalCost || 0 : 0,
      savings: u ? u.savings || 0 : 0,
    }
  })

  const totalCost = stats?.totalCost || 0
  const totalSavings = stats?.totalSavings || 0
  const reduction = totalCost + totalSavings > 0 ? (totalSavings / (totalCost + totalSavings)) * 100 : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const highRiskPct = stats?.totalLogs > 0 ? ((stats?.flaggedCount || 0) / stats.totalLogs) * 100 : 0

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting}.`}
        subtitle={
          <>
            Your AI infrastructure at a glance — last 30 days, {(stats?.totalLogs || 0).toLocaleString()} interactions
            {stats?.simulatedCount > 0 ? ' (demo mode)' : ''}.
          </>
        }
        right={
          <>
            <Button variant="outline" size="sm" onClick={handleExportLogs}>
              <Download size={14} className="mr-1.5" /> Export
            </Button>
            <Button size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw size={14} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </>
        }
      />

      {/* ── PRIMARY KPI ── */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <div className="type-meta text-text-tertiary">Total spend</div>
          <div className="mt-2 font-mono text-[3rem] font-semibold leading-none tracking-tight text-text">
            ${totalCost.toFixed(2)}
          </div>
          {totalSavings > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-success">
              <TrendingDown size={15} /> {reduction.toFixed(1)}% lower than without routing
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
          <Metric label="Requests" value={(stats?.totalLogs || 0).toLocaleString()} />
          <Metric label="Tokens" value={`${((stats?.totalTokens || 0) / 1000).toFixed(1)}k`} />
          <Metric label="Models used" value={costBreakdown?.byModel?.length || 0} />
          <Metric label="High-risk" value={`${highRiskPct.toFixed(1)}%`} tone={highRiskPct > 5 ? 'danger' : 'default'} />
        </div>
      </div>

      {/* ── THROUGHPUT + SAVINGS ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="lg">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="type-h2 text-text">Daily throughput</h2>
              <p className="mt-1 text-[13px] text-text-secondary">Requests over the last 30 days</p>
            </div>
            <Link href="/dashboard/logs" className="flex items-center gap-1 text-[13px] font-medium text-accent">
              View requests <ArrowUpRight size={14} />
            </Link>
          </div>

          {chartData.some((d) => d.value > 0) ? (
            <>
              <div className="flex items-end gap-1" style={{ height: 180 }}>
                {chartData.map((d, i) => (
                  <div key={i} className="group relative flex h-full flex-1 items-end">
                    <div
                      className="absolute bottom-0 w-full rounded-t-[3px] bg-accent transition-opacity group-hover:opacity-70"
                      style={{ height: `${Math.max(d.height, 2)}%`, opacity: 0.35 + (d.height / 100) * 0.65 }}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-sm)] bg-bg-inverse px-3 py-2 text-[11px] text-white group-hover:block">
                      <div className="font-semibold">{d.date.toLocaleDateString()}</div>
                      <div className="mt-1 text-white/70">{d.value} requests · ${d.cost.toFixed(4)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-between border-t border-border pt-4 text-[13px]">
                <div className="flex gap-8">
                  <div>
                    <div className="type-meta text-text-tertiary">Peak / day</div>
                    <div className="mt-1 font-mono text-text">{Math.max(...chartData.map((d) => d.value))} req</div>
                  </div>
                  <div>
                    <div className="type-meta text-text-tertiary">Active days</div>
                    <div className="mt-1 font-mono text-text">{chartData.filter((d) => d.value > 0).length}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <BarChart3 size={28} className="text-text-tertiary" strokeWidth={1.5} />
              <p className="max-w-xs text-[13px] text-text-tertiary">No traffic yet. Connect your SDK or send a Playground request to see throughput.</p>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card padding="lg">
            <Metric label="Total savings" value={`$${totalSavings.toFixed(2)}`} tone="success" size="lg" />
          </Card>
          <Card padding="lg">
            <Metric
              label="Cost reduction"
              value={`${reduction.toFixed(1)}%`}
              tone="accent"
              size="lg"
              hint={reduction > 0 ? 'vs. baseline model for every request' : undefined}
            />
          </Card>
        </div>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <Card padding="none">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="type-h3 text-text">Recent activity</h3>
          <Link href="/dashboard/logs" className="text-[13px] font-medium text-accent">View all</Link>
        </div>
        {recentLogs.length > 0 ? (
          recentLogs.slice(0, 5).map((log: any, i: number) => {
            const isHighRisk = log.riskScore > 50
            let text = 'Request processed'
            let sub = `Routed to ${log.model}${log.optimizer?.wasOptimized ? ' via optimizer' : ''}`
            let tone: 'success' | 'danger' | 'accent' = 'success'
            if (isHighRisk) {
              text = 'Security alert'
              sub = `Risk score ${log.riskScore} — ${log.flags?.join(', ') || 'unknown'}`
              tone = 'danger'
            } else if (log.optimizer?.wasOptimized) {
              text = 'Routing optimized'
              sub = `${log.optimizer.originalModel} → ${log.optimizer.optimizedModel}`
              tone = 'accent'
            }
            const dotClass = { success: 'bg-success', danger: 'bg-danger', accent: 'bg-accent' }[tone]
            return (
              <div key={log._id || i} className="flex items-center justify-between border-b border-border px-6 py-4 last:border-0">
                <div className="flex items-center gap-3.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
                  <div>
                    <div className={`text-[14px] font-medium ${isHighRisk ? 'text-danger' : 'text-text'}`}>{text}</div>
                    <div className="mt-0.5 text-[12px] text-text-secondary">{sub}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-right">
                  <span className="text-[12px] text-text-tertiary">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {log.cost > 0 && <span className="font-mono text-[12px] text-success">${log.cost.toFixed(6)}</span>}
                </div>
              </div>
            )
          })
        ) : (
          <div className="px-6 py-10 text-center text-[13px] text-text-tertiary">No recent activity. Connect your SDK to begin.</div>
        )}
      </Card>
    </div>
  )
}
