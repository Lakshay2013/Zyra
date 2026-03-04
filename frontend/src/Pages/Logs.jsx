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
    <td colSpan={7} style={{ padding: '0', background: 'var(--bg-secondary)' }}>
      <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Prompt</div>
          <div style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--text-primary)', background: 'var(--bg-card)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            {log.prompt}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Response</div>
          <div style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--text-primary)', background: 'var(--bg-card)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            {log.response || '—'}
          </div>
        </div>
        {log.riskDetails && (
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: '12px', marginTop: '4px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              PII Score: <span style={{ color: 'var(--red)' }}>{log.riskDetails.piiScore}</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              Injection Score: <span style={{ color: 'var(--yellow)' }}>{log.riskDetails.injectionScore}</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              Abuse Score: <span style={{ color: '#a064ff' }}>{log.riskDetails.abuseScore}</span>
            </div>
            {log.riskDetails.piiTypes?.length > 0 && (
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                PII Types: <span style={{ color: 'var(--red)' }}>{log.riskDetails.piiTypes.join(', ')}</span>
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
    return ''
  }

  return (
    <>
      <div className="page-header">
        <h2>Interaction Logs</h2>
        <p>Every LLM call captured and analyzed</p>
      </div>
      <div className="page-body">
        <div className="filter-bar">
          <input className="filter-input" placeholder="Filter by user ID" value={filters.userId}
            onChange={e => setFilters({ ...filters, userId: e.target.value })} />
          <input className="filter-input" placeholder="Model (e.g. gpt-4)" value={filters.model}
            onChange={e => setFilters({ ...filters, model: e.target.value })} />
          <input className="filter-input" placeholder="Min risk" type="number" style={{ width: '90px' }}
            value={filters.minRisk} onChange={e => setFilters({ ...filters, minRisk: e.target.value })} />
          <input className="filter-input" placeholder="Max risk" type="number" style={{ width: '90px' }}
            value={filters.maxRisk} onChange={e => setFilters({ ...filters, maxRisk: e.target.value })} />
          <button className="btn btn-primary" onClick={applyFilters}>Apply</button>
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
                  {data?.logs?.length === 0 && (
                    <tr><td colSpan={7}><div className="empty-state">No logs found</div></td></tr>
                  )}
                  {data?.logs?.map((log) => (
                    <>
                      <tr key={log._id} className={getRiskClass(log.riskScore)}
                        onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                        style={{ cursor: 'pointer' }}>
                        <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ color: 'var(--cyan)' }}>{log.userId}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{log.model}</td>
                        <td>{log.tokens?.total?.toLocaleString()}</td>
                        <td>${log.cost?.toFixed(4)}</td>
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
            <span>{data.pagination.total} total logs</span>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span>Page {page} of {data.pagination.pages}</span>
            <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages}>Next →</button>
          </div>
        )}
      </div>
    </>
  )
}