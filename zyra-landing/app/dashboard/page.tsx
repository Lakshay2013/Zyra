'use client'

import { useState, useEffect } from "react"
import api from "@/lib/api"

export default function DashboardOverview() {
  const [stats, setStats] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])
  const [costBreakdown, setCostBreakdown] = useState<any>(null)
  const [highRisk, setHighRisk] = useState<any[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, usageRes, highRiskRes, costRes, recentRes] = await Promise.all([
          api.get('/api/analytics/overview'),
          api.get('/api/analytics/usage?period=7d'),
          api.get('/api/analytics/high-risk'),
          api.get('/api/analytics/cost-breakdown'),
          api.get('/api/analytics/recent')
        ])
        setStats(overviewRes.data)
        setUsage(usageRes.data.usage || [])
        setHighRisk(highRiskRes.data.highRisk || [])
        setCostBreakdown(costRes.data)
        setRecentLogs(recentRes.data.recent || [])
      } catch (err) {
        console.error("Failed to load analytics", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex gap-3 items-center justify-center min-h-[50vh]" style={{ color: '#ffa69e' }}>
        <span className="material-symbols-outlined animate-pulse">terminal</span>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>Initializing System Overview...</span>
      </div>
    )
  }

  const maxLogs = usage.length > 0 ? Math.max(...usage.map(u => u.totalLogs), 1) : 1
  const chartData = usage.map(u => ({
    height: (u.totalLogs / maxLogs) * 100,
    date: new Date(u._id),
    value: u.totalLogs,
    cost: u.totalCost || 0,
    savings: u.savings || 0
  }))

  // Simulated metrics for the marquee (replace with real provider data)
  const metrics = [
    { label: 'Network Out', value: `${((stats?.totalTokens || 0) / 1000).toFixed(1)} kT`, mono: true },
    { label: 'Total Cost', value: `$${(stats?.totalCost || 0).toFixed(2)}`, mono: true },
    { label: 'Active Models', value: `${costBreakdown?.byModel?.length || 0}`, mono: true },
    { label: 'Error Rate', value: `${stats?.totalLogs > 0 ? ((stats?.flaggedCount || 0) / stats.totalLogs * 100).toFixed(2) : '0.00'}%`, mono: true, error: true },
    { label: 'Savings', value: `$${(stats?.totalSavings || 0).toFixed(2)}`, mono: true },
  ]

  return (
    <div>
      {/* ── HERO HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
        <div>
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#e5e2e3', lineHeight: 1 }}>
            SYSTEM_OVERVIEW
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#71717a', marginTop: 8 }}>
            CLUSTER_ID: <span style={{ color: '#ffa69e' }}>ALPHA-PROD-092</span> // NODE_STATUS: <span style={{ color: '#9be8cb' }}>HEALTHY</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button style={{
            background: '#2a2a2b', padding: '8px 16px', borderRadius: 12,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#e5e2e3', border: '1px solid rgba(83,67,65,0.15)'
          }}>Export Logs</button>
          <button style={{
            background: '#ffa69e', padding: '8px 16px', borderRadius: 12,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#3b0908'
          }}>Refresh Core</button>
        </div>
      </div>

      {/* ── METRIC MARQUEE ── */}
      <div className="flex items-center gap-12 overflow-x-auto mt-6 p-4" style={{ background: '#1c1b1c', borderRadius: 12 }}>
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col shrink-0">
            <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700,
              color: m.error ? '#ffb4ab' : '#e5e2e3'
            }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* ── BENTO GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">

        {/* ── THROUGHPUT CHART (8 cols) ── */}
        <div className="md:col-span-8 p-6 relative overflow-hidden" style={{
          background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)'
        }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Live Traffic</span>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#e5e2e3', marginTop: 4 }}>Throughput Density</h2>
            </div>
            <div className="flex gap-1 items-center">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffcdc9', animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#ffcdc9', textTransform: 'uppercase' }}>Real-time</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-1 px-2" style={{ height: 256 }}>
            {chartData.length > 0 ? (
              chartData.map((d, i) => {
                const isPeach = d.height > 50
                return (
                  <div key={i} className="flex-1 rounded-t-sm transition-all hover:opacity-80" style={{
                    height: `${Math.max(d.height, 4)}%`,
                    background: isPeach ? `rgba(255,166,158,${0.3 + d.height / 200})` : '#353436',
                  }} />
                )
              })
            ) : (
              Array.from({ length: 20 }).map((_, i) => {
                const h = [20,25,40,35,60,75,85,70,50,45,30,95,80,60,40,20,15,65,45,30][i]
                const isPeach = h > 60
                return (
                  <div key={i} className="flex-1 rounded-t-sm" style={{
                    height: `${h}%`,
                    background: isPeach ? `rgba(255,166,158,${0.3 + h / 200})` : '#353436',
                  }} />
                )
              })
            )}
          </div>

          {/* Bottom stats */}
          <div className="flex justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(83,67,65,0.1)' }}>
            <div className="flex gap-8">
              <div>
                <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>Peak</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: '#e5e2e3' }}>
                  {stats?.totalLogs ? `${(stats.totalLogs / 7).toFixed(0)} req/d` : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>Average</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: '#e5e2e3' }}>
                  {stats?.totalLogs ? `${Math.round(stats.totalLogs / 7)} req/d` : '—'}
                </div>
              </div>
            </div>
            <button style={{ color: '#ffcdc9', fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.15em' }}>Full Report</button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: 3 METRIC CARDS (4 cols) ── */}
        <div className="md:col-span-4 flex flex-col gap-6">

          {/* CPU Usage → Total Cost */}
          <div className="p-6" style={{ background: '#2a2a2b', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
            <div className="flex justify-between mb-4">
              <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Total Cost</span>
              <span className="material-symbols-outlined" style={{ color: '#71717a', fontSize: 18 }}>payments</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 900, color: '#e5e2e3' }}>
                ${(stats?.totalCost || 0).toFixed(2)}
              </span>
            </div>
            <div className="w-full overflow-hidden" style={{ background: '#131314', height: 6, borderRadius: 99 }}>
              <div style={{
                background: 'linear-gradient(to right, #ffa69e, #ffcdc9)',
                height: '100%',
                width: `${Math.min((stats?.totalCost || 0) / 10 * 100, 100)}%`,
                borderRadius: 99,
              }} />
            </div>
          </div>

          {/* Latency → Savings */}
          <div className="p-6" style={{ background: '#2a2a2b', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
            <div className="flex justify-between mb-4">
              <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Total Savings</span>
              <span className="material-symbols-outlined" style={{ color: '#71717a', fontSize: 18 }}>savings</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 900, color: '#9be8cb' }}>
                ${(stats?.totalSavings || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex gap-1 mt-2">
              {[1,1,1,0.2,0.2].map((o, i) => (
                <div key={i} className="flex-1" style={{ height: 4, background: `rgba(155,232,203,${o})` }} />
              ))}
            </div>
          </div>

          {/* Requests/sec → Total Requests */}
          <div className="p-6" style={{ background: '#2a2a2b', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
            <div className="flex justify-between mb-4">
              <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Total Requests</span>
              <span className="material-symbols-outlined" style={{ color: '#71717a', fontSize: 18 }}>hub</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 900, color: '#e5e2e3' }}>
                {(stats?.totalLogs || 0).toLocaleString()}
              </span>
            </div>
            {stats?.totalSavings > 0 && (
              <div className="mt-2 flex items-center gap-1" style={{ fontSize: 10, color: '#9be8cb', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>
                {((stats?.totalSavings / Math.max(stats?.totalCost, 0.01)) * 100).toFixed(1)}% cost reduction
              </div>
            )}
          </div>
        </div>

        {/* ── RECENT EVENTS (full width) ── */}
        <div className="md:col-span-12 overflow-hidden" style={{ background: '#1c1b1c', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
          <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)', background: '#201f20' }}>
            <h3 style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#e5e2e3', textTransform: 'uppercase' }}>Recent_System_Events</h3>
            <button style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: '#ffcdc9', letterSpacing: '0.15em' }}>View History</button>
          </div>
            {recentLogs.length > 0 ? (
              recentLogs.slice(0, 5).map((log: any, i: number) => {
                const isHighRisk = log.riskScore > 50;
                
                let text = "API Interaction Processed"
                let sub = `Routed to ${log.model} via ${log.optimizer?.wasOptimized ? 'Optimizer' : 'Direct'}`
                let dotColor = '#9be8cb' // green

                if (isHighRisk) {
                  text = "Security Alert Triggered"
                  sub = `Risk score ${log.riskScore} — ${log.flags?.join(', ') || 'unknown'}`
                  dotColor = '#ffb4ab' // red
                } else if (log.optimizer?.wasOptimized) {
                  text = "Routing Optimization Delivered"
                  sub = `Shifted from ${log.optimizer.originalModel} to ${log.optimizer.optimizedModel}`
                  dotColor = '#ffa69e' // peach/orange
                }

                return (
                  <div key={log._id || i} className="px-6 py-4 flex items-center justify-between transition-colors hover:bg-[#2a2a2b]" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
                    <div className="flex items-center gap-4">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: isHighRisk ? '#ffb4ab' : '#e5e2e3' }}>
                          {text} <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, opacity: 0.6, marginLeft: 8 }}>USER_{log.userId?.slice(0, 8)}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '-0.02em', marginTop: 2 }}>
                          {sub}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#534341', marginTop: 4, fontStyle: 'italic', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          "{log.prompt}"
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#71717a' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
                      </span>
                      {log.cost > 0 && <span style={{ fontSize: 10, color: '#9be8cb', fontWeight: 600 }}>${log.cost.toFixed(6)}</span>}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="px-6 py-8 text-center" style={{ color: '#71717a', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                No recent activity detected. Connect your SDK to begin.
              </div>
            )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
