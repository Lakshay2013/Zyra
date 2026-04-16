'use client'

import { useState, useEffect } from "react"
import api from "@/lib/api"
import toast from 'react-hot-toast'

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [filter, setFilter] = useState({ page: 1, limit: 20 })

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get(`/api/logs?page=${filter.page}&limit=${filter.limit}`)
        setLogs(res.data.logs || res.data || [])
      } catch (err) {
        console.error('Failed to load logs', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [filter.page])

  if (loading) {
    return (
      <div className="flex gap-3 items-center justify-center min-h-[50vh]" style={{ color: '#ffa69e' }}>
        <span className="material-symbols-outlined animate-pulse">list_alt</span>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>Loading Log Stream...</span>
      </div>
    )
  }

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
        <div>
          <h1 style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#e5e2e3', lineHeight: 0.9 }}>
            LOG_STREAM
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#71717a', marginTop: 8 }}>
            LIVE MONITORING: PRODUCTION-ALPHA-V2
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffa69e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#ffa69e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>

      {/* ── METRIC STRIP ── */}
      <div className="flex items-center gap-12 mt-6 p-4" style={{ background: '#1c1b1c', borderRadius: 12 }}>
        {[
          { label: 'Throughput', value: `${logs.length}`, unit: 'logs' },
          { label: 'Latency', value: '42', unit: 'ms' },
          { label: 'Error Rate', value: '0.02%', unit: '', error: true },
          { label: 'Total', value: `${logs.length}`, unit: '' },
        ].map((m, i) => (
          <div key={i} className="flex flex-col">
            <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</span>
            <div className="flex items-baseline gap-1">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: m.error ? '#ffb4ab' : '#e5e2e3' }}>{m.value}</span>
              {m.unit && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#71717a' }}>{m.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── JSON VIEWER — matching LOG_STREAM reference exactly ── */}
      <div className="mt-6" style={{ background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)', overflow: 'hidden' }}>
        {/* Window chrome */}
        <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#534341' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#534341' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#534341' }} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#534341', textTransform: 'uppercase' }}>JSON_FORMAT</span>
            <button onClick={() => toast.success('JSON export initiated')} className="material-symbols-outlined hover:text-white transition-colors" style={{ fontSize: 16, color: '#534341', cursor: 'pointer' }}>download</button>
          </div>
        </div>

        {/* Log entries as JSON */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
          {logs.length > 0 ? (
            logs.map((log, idx) => (
              <div key={log._id || idx} className="mb-6 cursor-pointer transition-colors hover:bg-[#2a2a2b] -mx-2 px-2 py-2 rounded" onClick={() => setSelectedLog(selectedLog?._id === log._id ? null : log)}>
                <div className="flex">
                  <span style={{ color: '#534341', width: 28, display: 'inline-block', textAlign: 'right', marginRight: 16, userSelect: 'none' }}>{(idx * 10 + 1).toString().padStart(2, '0')}</span>
                  <span style={{ color: '#71717a' }}>{'{'}</span>
                </div>
                {[
                  { key: 'timestamp', value: `"${new Date(log.createdAt).toISOString()}"` },
                  { key: 'level', value: `"${log.riskScore > 5 ? 'WARN' : 'INFO'}"`, warn: log.riskScore > 5 },
                  { key: 'model', value: `"${log.model || 'unknown'}"` },
                  { key: 'user', value: `"${log.userId || 'anonymous'}"` },
                  { key: 'tokens', value: `${log.tokens?.total || 0}` },
                  ...(log.estimatedCost ? [{ key: 'cost', value: `"$${log.estimatedCost.toFixed(6)}"` }] : []),
                  ...(log.riskScore ? [{ key: 'risk_score', value: `${log.riskScore}`, warn: log.riskScore > 5 }] : []),
                ].map((line, i) => (
                  <div key={i} className="flex" style={{ paddingLeft: 0, lineHeight: 1.9 }}>
                    <span style={{ color: '#534341', width: 28, display: 'inline-block', textAlign: 'right', marginRight: 16, userSelect: 'none' }}>{(idx * 10 + i + 2).toString().padStart(2, '0')}</span>
                    <span style={{ paddingLeft: 16 }}>
                      <span style={{ color: '#ffa69e' }}>"{line.key}"</span>
                      <span style={{ color: '#71717a' }}>: </span>
                      <span style={{ color: (line as any).warn ? '#ffb4ab' : '#e5e2e3' }}>{line.value}</span>
                      <span style={{ color: '#71717a' }}>,</span>
                    </span>
                  </div>
                ))}
                {selectedLog?._id === log._id && log.prompt && (
                  <div className="flex" style={{ lineHeight: 1.9 }}>
                    <span style={{ color: '#534341', width: 28, display: 'inline-block', textAlign: 'right', marginRight: 16, userSelect: 'none' }}>++</span>
                    <span style={{ paddingLeft: 16 }}>
                      <span style={{ color: '#ffa69e' }}>"prompt"</span>
                      <span style={{ color: '#71717a' }}>: </span>
                      <span style={{ color: '#9be8cb' }}>"{log.prompt.substring(0, 100)}..."</span>
                    </span>
                  </div>
                )}
                <div className="flex">
                  <span style={{ color: '#534341', width: 28, display: 'inline-block', textAlign: 'right', marginRight: 16, userSelect: 'none' }}>{(idx * 10 + 9).toString().padStart(2, '0')}</span>
                  <span style={{ color: '#71717a' }}>{'}'}</span>
                  {idx < logs.length - 1 && <span style={{ color: '#71717a' }}>,</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p style={{ color: '#534341', fontSize: 14 }}>No log entries yet</p>
              <p style={{ color: '#3f3f3f', fontSize: 12, marginTop: 4 }}>Send requests through the proxy to see them here</p>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM TERMINAL PROMPT ── */}
      <div className="mt-6 flex items-center gap-3 p-4" style={{ background: '#1c1b1c', borderRadius: 12 }}>
        <span style={{ color: '#ffa69e', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700 }}>&gt;</span>
        <span style={{ width: 6, height: 16, background: '#ffa69e', animation: 'pulse 1s infinite' }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          {logs.length > 0 ? `${logs.length} entries loaded` : 'Awaiting network streams...'}
        </span>
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
