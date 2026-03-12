import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../lib/api'

const StatCard = ({ label, value, sub, color = 'accent', icon }) => (
  <div className={`stat-card ${color} fade-up`}>
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
)

const RiskBadge = ({ score }) => {
  if (score > 70) return <span className="risk-badge risk-high">{score}</span>
  if (score > 30) return <span className="risk-badge risk-medium">{score}</span>
  return <span className="risk-badge risk-low">{score}</span>
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value?.toLocaleString()}</div>
      ))}
    </div>
  )
}

const icons = {
  logs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>,
  risk: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
  cost: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>,
  tokens: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  flag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>
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

  const avgRisk = overview?.avgRiskScore || 0
  const riskColor = avgRisk > 70 ? 'red' : avgRisk > 30 ? 'yellow' : 'green'

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Last 30 days · Real-time LLM monitoring</p>
      </div>
      <div className="page-body">

        {loadingOverview ? (
          <div className="loading"><div className="spinner" /> Loading...</div>
        ) : (
          <div className="stats-grid">
            <StatCard label="Total Logs" value={overview?.totalLogs?.toLocaleString() || 0} sub="interactions captured" color="accent" icon={icons.logs} />
            <StatCard label="Avg Risk Score" value={avgRisk} sub="weighted risk" color={riskColor} icon={icons.risk} />
            <StatCard label="Total Cost" value={`$${overview?.totalCost || 0}`} sub="USD on LLMs" color="green" icon={icons.cost} />
            <StatCard label="Total Tokens" value={(overview?.totalTokens || 0).toLocaleString()} sub="tokens processed" color="blue" icon={icons.tokens} />
            <StatCard label="Flagged" value={overview?.flaggedCount || 0} sub="high risk interactions" color={overview?.flaggedCount > 0 ? 'red' : 'accent'} icon={icons.flag} />
          </div>
        )}

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Token Usage Over Time</div>
              <div className="chart-sub">Daily token consumption and log volume</div>
            </div>
            <div className="period-toggle">
              <button className={`period-btn ${period === '7d' ? 'active' : ''}`} onClick={() => setPeriod('7d')}>7 days</button>
              <button className={`period-btn ${period === '30d' ? 'active' : ''}`} onClick={() => setPeriod('30d')}>30 days</button>
            </div>
          </div>
          {loadingUsage ? <div className="loading"><div className="spinner" /></div> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={usage?.usage || []} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="totalTokens" stroke="var(--accent)" strokeWidth={2.5} dot={false} name="Tokens" />
                <Line type="monotone" dataKey="totalLogs" stroke="var(--green)" strokeWidth={2.5} dot={false} name="Logs" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="two-col">
          <div className="chart-card" style={{ margin: 0 }}>
            <div className="chart-header">
              <div>
                <div className="chart-title">Top Users</div>
                <div className="chart-sub">By token consumption</div>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Tokens</th>
                    <th>Cost</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {!topUsers?.topUsers?.length && (
                    <tr><td colSpan={4}><div className="empty-state">No data yet</div></td></tr>
                  )}
                  {topUsers?.topUsers?.map((u) => (
                    <tr key={u._id}>
                      <td style={{ color: 'var(--accent)', fontWeight: 500 }}>{u._id}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.totalTokens.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>${u.totalCost.toFixed(4)}</td>
                      <td><RiskBadge score={Math.round(u.avgRisk)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="chart-card" style={{ margin: 0 }}>
            <div className="chart-header">
              <div>
                <div className="chart-title">High Risk Interactions</div>
                <div className="chart-sub">Risk score above 50</div>
              </div>
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
                  {!highRisk?.highRisk?.length && (
                    <tr><td colSpan={4}><div className="empty-state">✓ No high risk interactions</div></td></tr>
                  )}
                  {highRisk?.highRisk?.map((log) => (
                    <tr key={log._id} className="tr-high-risk">
                      <td style={{ fontWeight: 500 }}>{log.userId}</td>
                      <td><RiskBadge score={log.riskScore} /></td>
                      <td>{log.flags?.map(f => <span key={f} className={`flag-chip flag-${f}`}>{f}</span>)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.model}</td>
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