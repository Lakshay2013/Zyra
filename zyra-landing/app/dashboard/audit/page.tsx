'use client'

import { Fragment, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, History, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Chip, Badge } from '@/components/ui/badge'
import { EmptyState, LoadingScreen } from '@/components/ui/empty-state'
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['', 'auth', 'api_key', 'policy', 'provider', 'organization', 'security']

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [forbidden, setForbidden] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

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

  if (loading) return <LoadingScreen label="Loading audit trail" />
  if (forbidden) return (
    <div>
      <PageHeader title="Audit Log" />
      <Card padding="lg"><EmptyState icon={Lock} title="Admin only" sub="The audit trail is restricted to organization administrators." /></Card>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Control-plane events — authentication, API keys, policy, provider configuration"
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <Chip key={c || 'all'} active={cat === c} onClick={() => { setCat(c); setPage(1) }}>
            {c ? c.replace('_', ' ') : 'All'}
          </Chip>
        ))}
      </div>

      <Card padding="none" className="overflow-hidden">
        {logs.length === 0 ? (
          <EmptyState icon={History} title="No audit events" sub="Log in, create an API key, or change a policy to generate events." />
        ) : (
          <Table>
            <THead>
              <tr><TH>Time</TH><TH>Actor</TH><TH>Category</TH><TH>Action</TH><TH>Outcome</TH><TH>Target</TH><TH /></tr>
            </THead>
            <TBody>
              {logs.map((l) => (
                <Fragment key={l.id}>
                  <TR onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                    <TD className="text-text-tertiary">{new Date(l.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TD>
                    <TD>{l.actor}{l.actorRole ? <span className="text-text-tertiary"> · {l.actorRole}</span> : null}</TD>
                    <TD><Badge tone="neutral">{l.category}</Badge></TD>
                    <TD>{l.action}</TD>
                    <TD className={l.outcome === 'success' ? 'text-success' : 'text-danger'}>{l.outcome}</TD>
                    <TD className="text-text-tertiary">{l.target || '—'}</TD>
                    <TD align="right">
                      <motion.span animate={{ rotate: expanded === l.id ? 90 : 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.25 }} className="inline-block text-text-tertiary">
                        <ChevronRight size={15} />
                      </motion.span>
                    </TD>
                  </TR>
                  <AnimatePresence>
                    {expanded === l.id && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                            className="overflow-hidden bg-bg-subtle"
                          >
                            <div className="grid grid-cols-2 gap-3 px-4 py-3 text-[12px] md:grid-cols-3">
                              <div><span className="text-text-tertiary">IP: </span><span className="font-mono text-text">{l.ip || '—'}</span></div>
                              <div><span className="text-text-tertiary">Target type: </span><span className="font-mono text-text">{l.target?.split(':')[0] || '—'}</span></div>
                              <div className="md:col-span-1"><span className="text-text-tertiary">Meta: </span><span className="font-mono text-text">{l.meta && Object.keys(l.meta).length ? JSON.stringify(l.meta) : '—'}</span></div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <span className="text-[13px] text-text-tertiary">{page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</Button>
        </div>
      )}
    </div>
  )
}
