'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { C, PageHeader, Card, Label, StatTile, SeverityBadge, FlagPill, MiniBars, EmptyState, Loading } from '@/components/dashboard/kit'

type Report = {
  id: string; logId: string; timestamp: string; userId: string; model: string; provider: string
  riskScore: number; severity: string
  components: { injection: number; jailbreak: number; pii: number; abuse: number }
  injection: boolean; jailbreak: boolean; pii: boolean; abuse: boolean; sensitiveKeyword: boolean
}

const WEIGHTS = { injection: 0.35, jailbreak: 0.30, pii: 0.20, abuse: 0.15 }

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

  if (loading) return <Loading label="Loading security intelligence…" />

  const t = overview?.totals || {}
  const trend = overview?.trend || []

  return (
    <div>
      <PageHeader
        title="SECURITY_&_RISK"
        subtitle={<>RISK MODEL: <span style={{ color: C.accent }}>{overview?.formula || 'R = 0.35*I + 0.30*J + 0.20*P + 0.15*A'}</span> {'//'} ALERT &gt; {overview?.notifyThreshold ?? 80}</>}
        right={
          <>
            <button onClick={() => load(true)} style={btn()}>{refreshing ? 'Syncing…' : 'Refresh'}</button>
            <button onClick={() => setAuto((v) => !v)} className="flex items-center gap-2" style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: auto ? C.green : C.dim, cursor: 'pointer' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: auto ? C.green : C.faint }} />
              {auto ? 'LIVE' : 'PAUSED'}{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ''}
            </button>
          </>
        }
      />

      {/* ── STAT GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatTile label="Total Interactions" value={(t.totalInteractions ?? 0).toLocaleString()} hint={`${t.analyzed ?? 0} risk-analyzed`} />
        <StatTile label="Security Events" value={t.securityEvents ?? 0} tone={t.securityEvents ? 'warn' : 'default'} />
        <StatTile label="Avg Risk Score" value={t.avgRiskScore ?? 0} unit="/100" tone={(t.avgRiskScore ?? 0) >= 50 ? 'bad' : 'default'} />
        <StatTile label="Critical (R>80)" value={t.criticalInteractions ?? 0} tone={t.criticalInteractions ? 'bad' : 'good'} hint="admin notified" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
        <StatTile label="Prompt Injections" value={t.promptInjections ?? 0} tone={t.promptInjections ? 'bad' : 'default'} />
        <StatTile label="Jailbreaks" value={t.jailbreaks ?? 0} tone={t.jailbreaks ? 'bad' : 'default'} />
        <StatTile label="PII Detections" value={t.piiDetections ?? 0} tone={t.piiDetections ? 'bad' : 'default'} />
        <StatTile label="Sensitive Keywords" value={t.sensitiveKeywordDetections ?? 0} tone={t.sensitiveKeywordDetections ? 'warn' : 'default'} />
        <StatTile label="Blocked Pre-flight" value={t.blockedRequests ?? 0} tone="accent" hint="never reached provider" />
      </div>

      {/* ── RISK TREND ── */}
      <Card className="mt-6">
        <div className="flex justify-between items-start mb-4">
          <div><Label>Risk Trend</Label><div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4 }}>Security events / day</div></div>
          <Label>last {trend.length} days</Label>
        </div>
        {trend.length > 0
          ? <MiniBars data={trend.map((d: any) => d.securityEvents)} height={72} color={C.red} />
          : <EmptyState icon="show_chart" title="No trend data yet" />}
        {trend.length > 0 && (
          <div className="flex justify-between mt-2" style={{ fontFamily: C.mono, fontSize: 10, color: C.faint }}>
            <span>{trend[0]?.date}</span><span>{trend[trend.length - 1]?.date}</span>
          </div>
        )}
      </Card>

      {/* ── RISK REPORTS TABLE ── */}
      <Card className="mt-6" pad={0} style={{ overflow: 'hidden' }}>
        <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(83,67,65,0.08)', background: C.panel2 }}>
          <h3 style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, color: C.text, textTransform: 'uppercase' }}>Risk_Reports</h3>
          <div className="flex gap-2">
            {['', 'low', 'medium', 'high', 'critical'].map((s) => (
              <button key={s || 'all'} onClick={() => setSeverityFilter(s)} style={{
                fontFamily: C.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
                color: severityFilter === s ? C.accentInk : C.dim,
                background: severityFilter === s ? C.accent : 'transparent',
              }}>{s || 'all'}</button>
            ))}
          </div>
        </div>
        {reports.length === 0 ? (
          <EmptyState icon="verified_user" title="No risk reports in this window" sub="Interactions are analysed asynchronously after each request. Run the playground or the demo seed." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.mono, fontSize: 12 }}>
              <thead>
                <tr style={{ color: C.dim, textAlign: 'left' }}>
                  {['Time', 'User', 'Model', 'Provider', 'I', 'J', 'P', 'A', 'Risk', 'Severity'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} onClick={() => openDetail(r.id)} className="hover:bg-[#2a2a2b]" style={{ cursor: 'pointer', borderTop: '1px solid rgba(83,67,65,0.06)' }}>
                    <td style={td()}>{new Date(r.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={td()}>{r.userId}</td>
                    <td style={td(C.text)}>{r.model || '—'}</td>
                    <td style={td()}>{r.provider || '—'}</td>
                    <td style={comp(r.components?.injection)}>{r.components?.injection ?? 0}</td>
                    <td style={comp(r.components?.jailbreak)}>{r.components?.jailbreak ?? 0}</td>
                    <td style={comp(r.components?.pii)}>{r.components?.pii ?? 0}</td>
                    <td style={comp(r.components?.abuse)}>{r.components?.abuse ?? 0}</td>
                    <td style={{ ...td(), fontWeight: 800, color: r.riskScore >= 50 ? C.red : r.riskScore >= 25 ? C.amber : C.text }}>{r.riskScore}</td>
                    <td style={td()}><SeverityBadge severity={r.severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── DETAIL DRAWER ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDetail(null)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 'min(560px, 100%)', height: '100%', background: C.panel, borderLeft: `1px solid ${C.border}`, overflowY: 'auto', padding: 28 }}>
            {detail.loading ? <Loading label="Loading report…" /> : detail.report ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <Label>Risk Report</Label>
                    <div style={{ fontFamily: C.mono, fontSize: 13, color: C.dim, marginTop: 4 }}>{new Date(detail.report.timestamp).toLocaleString()}</div>
                  </div>
                  <button onClick={() => setDetail(null)} className="material-symbols-outlined" style={{ color: C.dim, cursor: 'pointer' }}>close</button>
                </div>

                <div className="flex items-center gap-4 mt-5">
                  <div style={{ fontFamily: C.mono, fontSize: 52, fontWeight: 900, color: detail.report.riskScore >= 50 ? C.red : detail.report.riskScore >= 25 ? C.amber : C.green }}>
                    {detail.report.riskScore}
                  </div>
                  <div>
                    <SeverityBadge severity={detail.report.severity} />
                    <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginTop: 6 }}>{detail.report.userId} · {detail.report.model} · {detail.report.provider}</div>
                  </div>
                </div>

                {/* Component breakdown */}
                <div style={{ marginTop: 24 }}>
                  <Label>Score Components — R = ΣwᵢCᵢ</Label>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(['injection', 'jailbreak', 'pii', 'abuse'] as const).map((k) => {
                      const v = detail.report.components?.[k] ?? 0
                      const w = WEIGHTS[k]
                      return (
                        <div key={k}>
                          <div className="flex justify-between" style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>
                            <span style={{ textTransform: 'uppercase' }}>{k} <span style={{ color: C.faint }}>(w={w})</span></span>
                            <span style={{ color: C.text }}>{v} → {(v * w).toFixed(1)}</span>
                          </div>
                          <div style={{ height: 6, background: C.bg, borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${v}%`, background: v >= 50 ? C.red : v >= 25 ? C.amber : C.green, borderRadius: 99 }} />
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex justify-between" style={{ fontFamily: C.mono, fontSize: 12, color: C.text, borderTop: '1px solid rgba(83,67,65,0.15)', paddingTop: 8, fontWeight: 700 }}>
                      <span>FINAL RISK</span><span>{detail.report.riskScore} / 100</span>
                    </div>
                  </div>
                </div>

                {/* Detected patterns (labels only) */}
                <div style={{ marginTop: 24 }}>
                  <Label>Detected Patterns</Label>
                  <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
                    {[
                      ...(detail.report.detail?.piiTypes || []).map((x: string) => `pii:${x}`),
                      ...(detail.report.detail?.injectionMatches || []).map((x: string) => `inj:${x}`),
                      ...(detail.report.detail?.jailbreakMatches || []).map((x: string) => `jb:${x}`),
                      ...(detail.report.detail?.abuseIssues || []).map((x: string) => `abuse:${x}`),
                      ...(detail.report.detail?.sensitiveKeywords || []).map((x: string) => `kw:${x}`),
                    ].map((x, i) => <FlagPill key={i} label={x} on />)}
                    {![...(detail.report.detail?.piiTypes || []), ...(detail.report.detail?.injectionMatches || []), ...(detail.report.detail?.jailbreakMatches || []), ...(detail.report.detail?.abuseIssues || []), ...(detail.report.detail?.sensitiveKeywords || [])].length && (
                      <span style={{ color: C.faint, fontSize: 12 }}>none — clean interaction</span>
                    )}
                  </div>
                </div>

                {/* Interaction (masked) */}
                {detail.interaction && (
                  <div style={{ marginTop: 24 }}>
                    <Label>Interaction (secrets masked at storage)</Label>
                    <div style={{ marginTop: 10, background: C.bg, borderRadius: 8, padding: 14, fontFamily: C.mono, fontSize: 12, color: C.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      <span style={{ color: C.accent }}>prompt:</span> {detail.interaction.prompt}
                      {'\n\n'}
                      <span style={{ color: C.green }}>response:</span> {detail.interaction.response || '—'}
                    </div>
                    <div className="flex gap-4 mt-3" style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>
                      <span>tokens: {detail.interaction.tokens?.total ?? 0}</span>
                      <span>cost: ${Number(detail.interaction.cost || 0).toFixed(6)}</span>
                      <span>status: {detail.interaction.statusCode}</span>
                      {detail.interaction.blocked && <span style={{ color: C.accent }}>BLOCKED: {detail.interaction.blockReason}</span>}
                    </div>
                  </div>
                )}
              </>
            ) : <EmptyState icon="error" title="Could not load report" />}
          </div>
        </div>
      )}
    </div>
  )
}

const btn = (): React.CSSProperties => ({ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.text, background: C.card, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${C.border}` })
const td = (color = C.dim): React.CSSProperties => ({ padding: '10px 12px', color, whiteSpace: 'nowrap' })
const comp = (v = 0): React.CSSProperties => ({ padding: '10px 12px', color: v >= 50 ? C.red : v >= 25 ? C.amber : v > 0 ? C.text : C.faint, textAlign: 'center' })
