import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../lib/api'

const StatCard = ({ label, value, sub, accent }) => (
  <div className="card">
    <div className="card-label">{label}</div>
    <div className="card-value" style={accent ? { color: accent } : {}}>{value}</div>
    {sub && <div className="card-sub">{sub}</div>}
  </div>
)

const RiskBadge = ({ score }) => {
  if (score > 70) return <span className="risk-badge risk-high risk-pulse">{score}</span>
  if (score > 30) return <span className="risk-badge risk-medium">{score}</span>
  return <span className="risk-badge risk-low">{score}</span>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', fontSize: '11px' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState('7d')

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data)
  })

  const { data: usage, isLoading: loadingUsage } = useQuery({
    queryKey: ['usage', period],
    queryFn: () => api.get(`/analytics/usage?period=${period}`).then(r => r.data)
  })

  const { data: topUsers } = useQuery({
    queryKey: ['top-users'],
    queryFn: () => api.get('/analytics/top-users').then(r => r.data)
  })

  const { data: highRisk } = useQuery({
    queryKey: ['high-risk'],
    queryFn: () => api.get('/analytics/high-risk').then(r => r.data)
  })

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Last 30 days · Real-time risk monitoring</p>
      </div>
      <div className="page-body">

        {loadingOverview ? <div className="loading"><div className="spinner" /> Loading...</div> : (
          <div className="stats-grid">
            <StatCard label="Total Logs" value={overview?.totalLogs?.toLocaleString() || 0} sub="interactions captured" />
            <StatCard label="Avg Risk Score" value={overview?.avgRiskScore || 0} sub="out of 100" accent={overview?.avgRiskScore > 50 ? 'var(--red)' : overview?.avgRiskScore > 25 ? 'var(--yellow)' : 'var(--green)'} />
            <StatCard label="Total Cost" value={`$${overview?.totalCost || 0}`} sub="USD spent on LLMs" />
            <StatCard label="Total Tokens" value={(overview?.totalTokens || 0).toLocaleString()} sub="tokens processed" />
            <StatCard label="Flagged" value={overview?.flaggedCount || 0} sub="high risk interactions" accent={overview?.flaggedCount > 0 ? 'var(--red)' : undefined} />
          </div>
        )}

        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">Token Usage & Cost</div>
            <div className="period-toggle">
              <button className={`period-btn ${period === '7d' ? 'active' : ''}`} onClick={() => setPeriod('7d')}>7D</button>
              <button className={`period-btn ${period === '30d' ? 'active' : ''}`} onClick={() => setPeriod('30d')}>30D</button>
            </div>
          </div>
          {loadingUsage ? <div className="loading"><div className="spinner" /></div> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={usage?.usage || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'IBM Plex Mono' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="totalTokens" stroke="var(--cyan)" strokeWidth={2} dot={false} name="Tokens" />
                <Line type="monotone" dataKey="totalLogs" stroke="var(--green)" strokeWidth={2} dot={false} name="Logs" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="two-col">
          <div className="chart-card" style={{margin:0}}>
            <div className="chart-header">
              <div className="chart-title">Top Users by Token Usage</div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Tokens</th>
                    <th>Cost</th>
                    <th>Avg Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers?.topUsers?.length === 0 && (
                    <tr><td colSpan={4} style={{textAlign:'center', color:'var(--text-secondary)'}}>No data</td></tr>
                  )}
                  {topUsers?.topUsers?.map((u) => (
                    <tr key={u._id}>
                      <td style={{color:'var(--cyan)', fontFamily:'var(--font-mono)'}}>{u._id}</td>
                      <td>{u.totalTokens.toLocaleString()}</td>
                      <td>${u.totalCost.toFixed(4)}</td>
                      <td><RiskBadge score={Math.round(u.avgRisk)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="chart-card" style={{margin:0}}>
            <div className="chart-header">
              <div className="chart-title">High Risk Interactions</div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Risk</th>
                    <th>Flags</th>
                    <th>Model</th>
                  </tr>
                </thead>
                <tbody>
                  {highRisk?.highRisk?.length === 0 && (
                    <tr><td colSpan={4}><div className="empty-state">✓ No high risk interactions</div></td></tr>
                  )}
                  {highRisk?.highRisk?.map((log) => (
                    <tr key={log._id} className="tr-high-risk">
                      <td style={{color:'var(--text-primary)'}}>{log.userId}</td>
                      <td><RiskBadge score={log.riskScore} /></td>
                      <td>{log.flags?.map(f => <span key={f} className={`flag-chip flag-${f}`}>{f}</span>)}</td>
                      <td style={{color:'var(--text-secondary)'}}>{log.model}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}