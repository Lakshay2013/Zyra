'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, ListTree } from 'lucide-react'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Metric } from '@/components/ui/metric'
import { StatusBadge, Badge, ModelBadge } from '@/components/ui/badge'
import { EmptyState, LoadingScreen } from '@/components/ui/empty-state'
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/table'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [filter, setFilter] = useState({ page: 1, limit: 20 })
  const [totalCount, setTotalCount] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchLogs = async (opts: { silent?: boolean } = {}) => {
    if (opts.silent) setRefreshing(true)
    try {
      const res = await api.get(`/api/logs?page=${filter.page}&limit=${filter.limit}`)
      setLogs(res.data.logs || res.data || [])
      setTotalCount(res.data.pagination?.total ?? res.data.total ?? res.data.logs?.length ?? 0)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load logs', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchLogs() }, [filter.page])

  useEffect(() => {
    if (!autoRefresh || filter.page !== 1) return
    const id = setInterval(() => fetchLogs({ silent: true }), 10000)
    return () => clearInterval(id)
  }, [autoRefresh, filter.page, filter.limit])

  if (loading) return <LoadingScreen label="Loading requests" />

  const avgLatency = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.latency || 0), 0) / logs.length) : 0
  const flaggedPct = logs.length > 0 ? (logs.filter((l) => (l.flags || []).length > 0).length / logs.length) * 100 : 0
  const statusOf = (l: any): 'safe' | 'blocked' | 'warn' => (l.blocked ? 'blocked' : (l.flags || []).length > 0 ? 'warn' : 'safe')

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle={autoRefresh ? `Auto-refreshing every 10s${lastUpdated ? ` · updated ${lastUpdated.toLocaleTimeString()}` : ''}` : 'Auto-refresh paused'}
        right={
          <>
            <button onClick={() => setAutoRefresh((v) => !v)} className="flex items-center gap-2 text-[12px] font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${autoRefresh ? 'bg-success' : 'bg-text-tertiary'}`} />
              <span className={autoRefresh ? 'text-success' : 'text-text-tertiary'}>{autoRefresh ? 'Live' : 'Paused'}</span>
            </button>
            <IconButton onClick={() => fetchLogs({ silent: true })} aria-label="Refresh">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </IconButton>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Metric label="On page" value={logs.length} />
        <Metric label="Total" value={totalCount.toLocaleString()} />
        <Metric label="Avg latency" value={avgLatency || '—'} unit="ms" />
        <Metric label="Flagged" value={`${flaggedPct.toFixed(0)}%`} tone={flaggedPct > 0 ? 'danger' : 'default'} />
        <Metric label="Page" value={filter.page} />
      </div>

      <Card padding="none" className="overflow-hidden">
        {logs.length === 0 ? (
          <EmptyState icon={ListTree} title="No requests yet" sub="Send requests through the Playground or your SDK to see them here." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Time</TH><TH>Model</TH><TH>Provider</TH><TH align="right">Tokens</TH>
                <TH align="right">Cost</TH><TH align="right">Risk</TH><TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {logs.map((log, idx) => (
                <TR key={log._id || idx} onClick={() => setSelectedLog(log)}>
                  <TD className="text-text-tertiary">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TD>
                  <TD><ModelBadge model={log.model || 'unknown'} /></TD>
                  <TD className="text-text-tertiary">{log.provider || 'unknown'}</TD>
                  <TD align="right" className="font-mono text-text-tertiary">{log.tokens?.total || 0}</TD>
                  <TD align="right" className="font-mono text-text">${Number(log.cost || 0).toFixed(6)}</TD>
                  <TD align="right" className={`font-mono ${log.riskScore >= 50 ? 'text-danger' : 'text-text-tertiary'}`}>{log.riskScore ?? 0}</TD>
                  <TD><StatusBadge status={statusOf(log)} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] text-text-tertiary">
          {logs.length > 0 ? `${logs.length} entries — page ${filter.page}` : 'No entries'}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={filter.page <= 1} onClick={() => setFilter((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}>
            Previous
          </Button>
          <span className="w-8 text-center text-[13px] text-text-tertiary">{filter.page}</span>
          <Button variant="outline" size="sm" disabled={logs.length < filter.limit} onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}>
            Next
          </Button>
        </div>
      </div>

      {/* ── DETAIL DRAWER ── */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={() => setSelectedLog(null)} />
            <motion.div
              initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="relative h-full w-full max-w-[520px] overflow-y-auto border-l border-border bg-bg-elevated p-7 shadow-[var(--shadow-lg)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="type-meta text-text-tertiary">Request</div>
                  <div className="mt-1 text-[13px] text-text-secondary">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
                <IconButton onClick={() => setSelectedLog(null)} aria-label="Close"><X size={18} /></IconButton>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StatusBadge status={statusOf(selectedLog)} />
                <ModelBadge model={selectedLog.model || 'unknown'} />
                <Badge tone="neutral">{selectedLog.provider || 'unknown'}</Badge>
                {selectedLog.simulated && <Badge tone="accent">Simulated</Badge>}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                <Row k="User" v={selectedLog.userId || 'anonymous'} />
                <Row k="Tokens" v={String(selectedLog.tokens?.total || 0)} />
                <Row k="Cost" v={`$${Number(selectedLog.cost || 0).toFixed(6)}`} />
                <Row k="Latency" v={`${selectedLog.latency || 0} ms`} />
                <Row k="Risk score" v={String(selectedLog.riskScore ?? 0)} danger={selectedLog.riskScore >= 50} />
                <Row k="Severity" v={selectedLog.severity || 'low'} />
                {selectedLog.blocked && <Row k="Blocked" v={selectedLog.blockReason || 'yes'} danger />}
                {(selectedLog.flags || []).length > 0 && <Row k="Flags" v={selectedLog.flags.join(', ')} danger />}
              </div>

              {selectedLog.prompt && (
                <div className="mt-6">
                  <div className="type-meta mb-2 text-text-tertiary">Prompt (masked)</div>
                  <div className="whitespace-pre-wrap break-words rounded-[var(--radius-sm)] bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-text">
                    {selectedLog.prompt}
                  </div>
                </div>
              )}
              {selectedLog.response && (
                <div className="mt-4">
                  <div className="type-meta mb-2 text-text-tertiary">Response (masked)</div>
                  <div className="whitespace-pre-wrap break-words rounded-[var(--radius-sm)] bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-text">
                    {selectedLog.response}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ k, v, danger }: { k: string; v: string; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-tertiary">{k}</span>
      <span className={`text-right font-mono ${danger ? 'text-danger' : 'text-text'}`}>{v}</span>
    </div>
  )
}
