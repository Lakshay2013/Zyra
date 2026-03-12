import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

const RiskBadge = ({ score }) => {
  if (score > 70) return <span className="risk-badge risk-high">{score}</span>
  if (score > 30) return <span className="risk-badge risk-medium">{score}</span>
  return <span className="risk-badge risk-low">{score}</span>
}

const ExpandedRow = ({ log }) => (
  <tr>
    <td colSpan={7} style={{ padding: 0, background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Prompt</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
            {log.prompt}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Response</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--bg-card)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
            {log.response || '—'}
          </div>
        </div>
        {log.riskDetails && (
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: 16 }}>
            {[
              { label: 'PII Score', value: log.riskDetails.piiScore, color: 'var(--red)' },
              { label: 'Injection Score', value: log.riskDetails.injectionScore, color: 'var(--yellow)' },
              { label: 'Abuse Score', value: log.riskDetails.abuseScore, color: '#7C3AED' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
            {log.riskDetails.piiTypes?.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>PII Types Found</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>{log.riskDetails.piiTypes.join(', ')}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </td>
  </tr>
)

export default function Logs() {
  const [filters, setFilters] = useState({ userId: '', model: '', minRisk: '', maxRisk: '' })
  const [applied, setApplied] = useState({})
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['logs', applied, page],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit: 20, ...applied })
      Object.keys(applied).forEach(k => !applied[k] && params.delete(k))
      return api.get(`/logs?${params}`).then(r => r.data)
    }
  })

  const applyFilters = () => { setApplied({ ...filters }); setPage(1) }
  const clearFilters = () => { setFilters({ userId: '', model: '', minRisk: '', maxRisk: '' }); setApplied({}); setPage(1) }

  const getRiskClass = (score) => {
    if (score > 70) return 'tr-high-risk'
    if (score > 30) return 'tr-medium-risk'
    return 'tr-low-risk'
  }

  return (
    <>
      <div className="page-header">
        <h2>Interaction Logs</h2>
        <p>Every LLM call captured, analyzed, and scored</p>
      </div>
      <div className="page-body">
        <div className="filter-bar">
          <input className="filter-input" placeholder="Filter by user ID" value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} />
          <input className="filter-input" placeholder="Model (e.g. gpt-4)" value={filters.model} onChange={e => setFilters({ ...filters, model: e.target.value })} />
          <input className="filter-input" placeholder="Min risk" type="number" style={{ width: 100 }} value={filters.minRisk} onChange={e => setFilters({ ...filters, minRisk: e.target.value })} />
          <input className="filter-input" placeholder="Max risk" type="number" style={{ width: 100 }} value={filters.maxRisk} onChange={e => setFilters({ ...filters, maxRisk: e.target.value })} />
          <button className="btn btn-primary" onClick={applyFilters}>Apply filters</button>
          <button className="btn btn-ghost" onClick={clearFilters}>Clear</button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? <div className="loading"><div className="spinner" /> Loading logs...</div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Model</th>
                    <th>Tokens</th>
                    <th>Cost</th>
                    <th>Risk</th>
                    <th>Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {!data?.logs?.length && (
                    <tr><td colSpan={7}><div className="empty-state">No logs found</div></td></tr>
                  )}
                  {data?.logs?.map((log) => (
                    <>
                      <tr key={log._id} className={getRiskClass(log.riskScore)}
                        onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                        style={{ cursor: 'pointer' }}>
                        <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ color: 'var(--accent)', fontWeight: 500 }}>{log.userId}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{log.model}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{log.tokens?.total?.toLocaleString()}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>${log.cost?.toFixed(4)}</td>
                        <td><RiskBadge score={log.riskScore} /></td>
                        <td>{log.flags?.map(f => <span key={f} className={`flag-chip flag-${f}`}>{f}</span>)}</td>
                      </tr>
                      {expanded === log._id && <ExpandedRow key={`exp-${log._id}`} log={log} />}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {data?.pagination && (
          <div className="pagination">
            <span style={{ marginRight: 8 }}>{data.pagination.total} total logs</span>
            <button className="btn btn-ghost" style={{ padding: '5px 12px' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span>Page {page} of {data.pagination.pages}</span>
            <button className="btn btn-ghost" style={{ padding: '5px 12px' }} onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages}>Next →</button>
          </div>
        )}
      </div>
    </>
  )
}