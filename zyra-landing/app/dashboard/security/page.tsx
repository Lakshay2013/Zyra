'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldAlert, RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric'
import { SeverityBadge, Chip } from '@/components/ui/badge'
import { RiskBar } from '@/components/ui/risk-bar'
import { EmptyState, LoadingScreen } from '@/components/ui/empty-state'
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/table'
import { IconButton } from '@/components/ui/icon-button'

type Report = {
  id: string; logId: string; timestamp: string; userId: string; model: string; provider: string
  riskScore: number; severity: string
  components: { injection: number; jailbreak: number; pii: number; abuse: number }
  injection: boolean; jailbreak: boolean; pii: boolean; abuse: boolean; sensitiveKeyword: boolean
}

const componentTone = (v = 0) => (v >= 50 ? 'text-danger' : v >= 25 ? 'text-warning' : v > 0 ? 'text-text' : 'text-text-tertiary')

export default function SecurityDashboard() {
  const [overview, setOverview] = useState<any>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [auto, setAuto] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    try {
      const [o, r] = await Promise.all([
        api.get('/api/security/overview?days=30'),
        api.get(`/api/security/reports?limit=50${severityFilter ? `&severity=${severityFilter}` : ''}`),
      ])
      setOverview(o.data)
      setReports(r.data.reports || [])
      setLastUpdated(new Date())
    } catch (e) { console.error('security load failed', e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [severityFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!auto) return
    const id = setInterval(() => load(true), 12000)
    return () => clearInterval(id)
  }, [auto, load])

  const openDetail = async (id: string) => {
    setDetail({ loading: true })
    try {
      const res = await api.get(`/api/security/reports/${id}`)
      setDetail(res.data)
    } catch { setDetail(null) }
  }

  if (loading) return <LoadingScreen label="Loading security intelligence" />

  const t = overview?.totals || {}
  const trend = overview?.trend || []
  const maxTrend = Math.max(...trend.map((d: any) => d.securityEvents), 1)

  const patterns = detail?.report ? [
    ...(detail.report.detail?.piiTypes || []).map((x: string) => `pii:${x}`),
    ...(detail.report.detail?.injectionMatches || []).map((x: string) => `inj:${x}`),
    ...(detail.report.detail?.jailbreakMatches || []).map((x: string) => `jb:${x}`),
    ...(detail.report.detail?.abuseIssues || []).map((x: string) => `abuse:${x}`),
    ...(detail.report.detail?.sensitiveKeywords || []).map((x: string) => `kw:${x}`),
  ] : []

  return (
    <div>
      <PageHeader
        title="Security & Risk"
        subtitle={<>Risk model: <span className="font-mono text-accent">{overview?.formula || 'R = 0.35*I + 0.30*J + 0.20*P + 0.15*A'}</span> · alert above {overview?.notifyThreshold ?? 80}</>}
        right={
          <>
            <button onClick={() => setAuto((v) => !v)} className="flex items-center gap-2 text-[12px] font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${auto ? 'bg-success' : 'bg-text-tertiary'}`} />
              <span className={auto ? 'text-success' : 'text-text-tertiary'}>{auto ? 'Live' : 'Paused'}</span>
              {lastUpdated && <span className="text-text-tertiary">· {lastUpdated.toLocaleTimeString()}</span>}
            </button>
            <IconButton onClick={() => load(true)} aria-label="Refresh">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </IconButton>
          </>
        }
      />

      {/* ── STAT GRID ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total interactions" value={(t.totalInteractions ?? 0).toLocaleString()} hint={`${t.analyzed ?? 0} risk-analyzed`} />
        <MetricCard label="Security events" value={t.securityEvents ?? 0} tone={t.securityEvents ? 'warning' : 'default'} />
        <MetricCard label="Avg risk score" value={t.avgRiskScore ?? 0} unit="/100" tone={(t.avgRiskScore ?? 0) >= 50 ? 'danger' : 'default'} />
        <MetricCard label="Critical (R>80)" value={t.criticalInteractions ?? 0} tone={t.criticalInteractions ? 'danger' : 'success'} hint="admin notified" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard label="Prompt injections" value={t.promptInjections ?? 0} tone={t.promptInjections ? 'danger' : 'default'} />
        <MetricCard label="Jailbreaks" value={t.jailbreaks ?? 0} tone={t.jailbreaks ? 'danger' : 'default'} />
        <MetricCard label="PII detections" value={t.piiDetections ?? 0} tone={t.piiDetections ? 'danger' : 'default'} />
        <MetricCard label="Sensitive keywords" value={t.sensitiveKeywordDetections ?? 0} tone={t.sensitiveKeywordDetections ? 'warning' : 'default'} />
        <MetricCard label="Blocked pre-flight" value={t.blockedRequests ?? 0} tone="accent" hint="never reached provider" />
      </div>

      {/* ── RISK TREND ── */}
      <Card padding="lg" className="mt-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="type-meta text-text-tertiary">Risk trend</div>
            <h2 className="type-h2 mt-1 text-text">Security events / day</h2>
          </div>
          <span className="type-meta text-text-tertiary">last {trend.length} days</span>
        </div>
        {trend.length > 0 ? (
          <>
            <div className="flex items-end gap-[3px]" style={{ height: 72 }}>
              {trend.map((d: any, i: number) => (
                <div key={i} className="flex-1" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div
                    className="w-full rounded-t-[2px] bg-danger"
                    style={{ height: `${Math.max((d.securityEvents / maxTrend) * 100, 2)}%`, opacity: 0.35 + (d.securityEvents / maxTrend) * 0.65 }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-text-tertiary">
              <span>{trend[0]?.date}</span><span>{trend[trend.length - 1]?.date}</span>
            </div>
          </>
        ) : (
          <EmptyState title="No trend data yet" />
        )}
      </Card>

      {/* ── RISK REPORTS TABLE ── */}
      <Card padding="none" className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="type-h3 text-text">Risk reports</h3>
          <div className="flex gap-1.5">
            {['', 'low', 'medium', 'high', 'critical'].map((s) => (
              <Chip key={s || 'all'} active={severityFilter === s} onClick={() => setSeverityFilter(s)}>
                {s || 'All'}
              </Chip>
            ))}
          </div>
        </div>
        {reports.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No risk reports in this window" sub="Interactions are analyzed asynchronously after each request. Run the Playground or the demo seed." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Time</TH><TH>User</TH><TH>Model</TH><TH>Provider</TH>
                <TH align="right">I</TH><TH align="right">J</TH><TH align="right">P</TH><TH align="right">A</TH>
                <TH align="right">Risk</TH><TH>Severity</TH>
              </tr>
            </THead>
            <TBody>
              {reports.map((r) => (
                <TR key={r.id} onClick={() => openDetail(r.id)}>
                  <TD className="text-text-tertiary">{new Date(r.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TD>
                  <TD className="text-text-tertiary">{r.userId}</TD>
                  <TD>{r.model || '—'}</TD>
                  <TD className="text-text-tertiary">{r.provider || '—'}</TD>
                  <TD align="right" className={componentTone(r.components?.injection)}>{r.components?.injection ?? 0}</TD>
                  <TD align="right" className={componentTone(r.components?.jailbreak)}>{r.components?.jailbreak ?? 0}</TD>
                  <TD align="right" className={componentTone(r.components?.pii)}>{r.components?.pii ?? 0}</TD>
                  <TD align="right" className={componentTone(r.components?.abuse)}>{r.components?.abuse ?? 0}</TD>
                  <TD align="right" className={`font-mono font-semibold ${componentTone(r.riskScore)}`}>{r.riskScore}</TD>
                  <TD><SeverityBadge severity={r.severity} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {/* ── DETAIL DRAWER ── */}
      <AnimatePresence>
        {detail && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setDetail(null)}
            />
            <motion.div
              initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="relative h-full w-full max-w-[560px] overflow-y-auto border-l border-border bg-bg-elevated p-7 shadow-[var(--shadow-lg)]"
            >
              {detail.loading ? <LoadingScreen label="Loading report" /> : detail.report ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="type-meta text-text-tertiary">Risk report</div>
                      <div className="mt-1 text-[13px] text-text-secondary">{new Date(detail.report.timestamp).toLocaleString()}</div>
                    </div>
                    <IconButton onClick={() => setDetail(null)} aria-label="Close">
                      <X size={18} />
                    </IconButton>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className={`font-mono text-[3.25rem] font-bold leading-none ${componentTone(detail.report.riskScore)}`}>
                      {detail.report.riskScore}
                    </div>
                    <div>
                      <SeverityBadge severity={detail.report.severity} />
                      <div className="mt-1.5 text-[12px] text-text-tertiary">{detail.report.userId} · {detail.report.model} · {detail.report.provider}</div>
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="type-meta mb-3 text-text-tertiary">Score components — R = Σwᵢcᵢ</div>
                    <RiskBar components={detail.report.components || { injection: 0, jailbreak: 0, pii: 0, abuse: 0 }} />
                    <div className="mt-3 flex justify-between border-t border-border pt-3 text-[13px] font-semibold text-text">
                      <span>Final risk</span><span className="font-mono">{detail.report.riskScore} / 100</span>
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="type-meta mb-2.5 text-text-tertiary">Detected patterns</div>
                    <div className="flex flex-wrap gap-1.5">
                      {patterns.length > 0 ? patterns.map((x, i) => (
                        <span key={i} className="rounded-[var(--radius-sm)] border border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)] px-2 py-0.5 font-mono text-[11px] text-danger">
                          {x}
                        </span>
                      )) : <span className="text-[12px] text-text-tertiary">None — clean interaction</span>}
                    </div>
                  </div>

                  {detail.interaction && (
                    <div className="mt-7">
                      <div className="type-meta mb-2.5 text-text-tertiary">Interaction (secrets masked at storage)</div>
                      <div className="whitespace-pre-wrap break-words rounded-[var(--radius-sm)] bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-text">
                        <span className="text-accent">prompt:</span> {detail.interaction.prompt}
                        {'\n\n'}
                        <span className="text-success">response:</span> {detail.interaction.response || '—'}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-4 text-[12px] text-text-tertiary">
                        <span>tokens: {detail.interaction.tokens?.total ?? 0}</span>
                        <span>cost: ${Number(detail.interaction.cost || 0).toFixed(6)}</span>
                        <span>status: {detail.interaction.statusCode}</span>
                        {detail.interaction.blocked && <span className="text-accent">Blocked: {detail.interaction.blockReason}</span>}
                      </div>
                    </div>
                  )}
                </>
              ) : <EmptyState title="Could not load report" />}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
