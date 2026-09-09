'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { C, PageHeader, Card, EmptyState, Loading } from '@/components/dashboard/kit'

const CAT_COLOR: Record<string, string> = {
  auth: C.green, api_key: C.accent, organization: '#c9b8ff', provider: '#8fd3ff', policy: C.amber, billing: '#ffd6a5', security: C.red,
}

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/audit?page=${page}&limit=40${cat ? `&category=${cat}` : ''}`)
      setLogs(res.data.logs || [])
      setPages(res.data.pagination?.pages || 1)
    } catch (e: any) {
      if (e?.response?.status === 403) setForbidden(true)
      else console.error('audit load failed', e)
    } finally { setLoading(false) }
  }, [page, cat])

  useEffect(() => { load() }, [load])

  if (loading) return <Loading label="Loading audit trail…" />
  if (forbidden) return (
    <div>
      <PageHeader title="AUDIT_LOG" />
      <Card className="mt-6"><EmptyState icon="lock" title="Admin only" sub="The audit trail is restricted to organisation administrators." /></Card>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="AUDIT_LOG"
        subtitle={<>CONTROL-PLANE EVENTS {'//'} AUTH · API KEYS · POLICY · PROVIDER CONFIG</>}
        right={
          <div className="flex gap-2">
            {['', 'auth', 'api_key', 'policy', 'provider', 'organization', 'security'].map((c) => (
              <button key={c || 'all'} onClick={() => { setCat(c); setPage(1) }} style={{
                fontFamily: C.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
                color: cat === c ? C.accentInk : C.dim, background: cat === c ? C.accent : 'transparent',
              }}>{c ? c.replace('_', ' ') : 'all'}</button>
            ))}
          </div>
        }
      />

      <Card className="mt-6" pad={0} style={{ overflow: 'hidden' }}>
        {logs.length === 0 ? (
          <EmptyState icon="history" title="No audit events" sub="Log in, create an API key, or change a policy to generate events." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.mono, fontSize: 12 }}>
              <thead>
                <tr style={{ color: C.dim, textAlign: 'left' }}>
                  {['Time', 'Actor', 'Category', 'Action', 'Outcome', 'Target', 'IP'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} style={{ borderTop: '1px solid rgba(83,67,65,0.06)' }}>
                    <td style={{ padding: '10px 14px', color: C.dim, whiteSpace: 'nowrap' }}>{new Date(l.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td style={{ padding: '10px 14px', color: C.text }}>{l.actor}{l.actorRole ? <span style={{ color: C.faint }}> · {l.actorRole}</span> : null}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ color: CAT_COLOR[l.category] || C.dim, textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>{l.category}</span></td>
                    <td style={{ padding: '10px 14px', color: C.text }}>{l.action}</td>
                    <td style={{ padding: '10px 14px', color: l.outcome === 'success' ? C.green : C.red }}>{l.outcome}</td>
                    <td style={{ padding: '10px 14px', color: C.dim }}>{l.target || '—'}</td>
                    <td style={{ padding: '10px 14px', color: C.faint }}>{l.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center gap-3 mt-4" style={{ fontFamily: C.mono, fontSize: 11, color: C.dim }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={pgBtn(page <= 1)}>Prev</button>
          <span>{page} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} style={pgBtn(page >= pages)}>Next</button>
        </div>
      )}
    </div>
  )
}

const pgBtn = (disabled: boolean): React.CSSProperties => ({
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: disabled ? C.faint : C.accent, background: 'rgba(255,166,158,0.1)', padding: '6px 14px', borderRadius: 8,
  border: '1px solid rgba(255,166,158,0.2)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
})
