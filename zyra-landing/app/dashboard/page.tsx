'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Terminal, Shield, Zap, Smartphone, Globe, ShieldAlert, Activity, Fingerprint, DollarSign, TrendingDown, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"

const StatsCard = ({ title, value, icon: Icon, delay, accent }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="bg-surface-container-low rounded-[16px] p-6 shadow-2xl border border-outline-variant/10 flex flex-col justify-between hover:border-outline-variant/30 transition-colors"
  >
    <div className="flex items-center justify-between xl:mb-6 mb-4">
      <h3 className="text-on-surface-variant text-[10px] font-label font-bold tracking-[0.15em] uppercase">{title}</h3>
      <div className={`p-2 rounded-full ${accent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
      </div>
    </div>
    <span className={`text-3xl font-headline font-semibold tracking-tight truncate ${accent ? 'text-emerald-400' : 'text-on-surface'}`}>
      {value}
    </span>
  </motion.div>
)

export default function DashboardObserver() {
  const [stats, setStats] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])
  const [highRisk, setHighRisk] = useState<any[]>([])
  const [costBreakdown, setCostBreakdown] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d'>('7d')

  const fetchData = async (p: string = period) => {
    try {
      const [overviewRes, usageRes, highRiskRes, costRes] = await Promise.all([
        api.get('/api/analytics/overview'),
        api.get(`/api/analytics/usage?period=${p}`),
        api.get('/api/analytics/high-risk'),
        api.get('/api/analytics/cost-breakdown')
      ])
      setStats(overviewRes.data)
      setUsage(usageRes.data.usage || [])
      setHighRisk(highRiskRes.data.highRisk || [])
      setCostBreakdown(costRes.data)
    } catch (err) {
      console.error("Failed to load analytics", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePeriodChange = (newPeriod: '7d' | '30d') => {
    setPeriod(newPeriod)
    fetchData(newPeriod)
  }

  if (loading) {
    return (
      <div className="flex gap-3 items-center justify-center font-body text-primary min-h-[50vh] animate-pulse">
        <Terminal className="w-5 h-5"/>
        <span className="font-label tracking-widest uppercase text-xs font-bold">Initializing Observer Link...</span>
      </div>
    )
  }

  // Compute provider distribution from real cost breakdown data
  const providerDistribution = (() => {
    if (!costBreakdown?.byModel || costBreakdown.byModel.length === 0) return []
    
    const providerMap: Record<string, number> = {}
    const modelToProvider: Record<string, string> = {
      'gpt-4o': 'OpenAI', 'gpt-4o-mini': 'OpenAI', 'gpt-4-turbo': 'OpenAI', 'gpt-3.5-turbo': 'OpenAI',
      'claude-3-5-sonnet': 'Anthropic', 'claude-3-opus': 'Anthropic', 'claude-3-haiku': 'Anthropic',
      'gemini-1.5-pro': 'Gemini', 'gemini-1.5-flash': 'Gemini',
      'llama3-70b-8192': 'Groq', 'mixtral-8x7b-32768': 'Groq'
    }

    let totalLogs = 0
    for (const m of costBreakdown.byModel) {
      const modelName = (m._id || '').toLowerCase()
      let provider = 'Other'
      for (const [key, prov] of Object.entries(modelToProvider)) {
        if (modelName.includes(key) || key.includes(modelName)) {
          provider = prov
          break
        }
      }
      providerMap[provider] = (providerMap[provider] || 0) + (m.totalLogs || 0)
      totalLogs += m.totalLogs || 0
    }

    if (totalLogs === 0) return []

    return Object.entries(providerMap)
      .map(([name, count]) => ({ name, percent: Math.round((count / totalLogs) * 100) }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4)
  })()

  // Compute provider status from cost breakdown
  const providerStatus = (() => {
    if (!costBreakdown?.byModel || costBreakdown.byModel.length === 0) return []
    
    const statusMap: Record<string, { logs: number, avgLatency: number }> = {}
    const modelToProviderLabel: Record<string, string> = {
      'gpt': 'OPENAI', 'claude': 'ANTHROPIC', 'gemini': 'GEMINI', 'llama': 'GROQ', 'mixtral': 'GROQ'
    }

    for (const m of costBreakdown.byModel) {
      const modelName = (m._id || '').toLowerCase()
      let label = modelName.toUpperCase().replace(/-/g, '_')
      
      statusMap[label] = {
        logs: m.totalLogs || 0,
        avgLatency: Math.round(m.avgLatency || 0)
      }
    }

    return Object.entries(statusMap)
      .map(([name, data]) => ({
        name,
        logs: data.logs,
        avgLatency: data.avgLatency,
        status: data.avgLatency > 5000 ? 'DEGRADED' : 'ONLINE'
      }))
      .sort((a, b) => b.logs - a.logs)
      .slice(0, 3)
  })()

  // Chart data from REAL usage — no fallback dummy data
  const hasUsageData = usage.length > 0
  const maxLogs = hasUsageData ? Math.max(...usage.map(u => u.totalLogs), 1) : 1
  const chartData = hasUsageData 
    ? usage.map(u => ({ height: (u.totalLogs / maxLogs) * 100, date: new Date(u._id), value: u.totalLogs, cost: u.totalCost || 0, savings: u.savings || 0 }))
    : []

  return (
    <div className="min-h-screen pb-16 pt-2">
      {/* 
        ==============================
        HERO: OBSERVER DECK
        ==============================
      */}
      <div className="grid grid-cols-12 grid-rows-6 gap-6 h-[700px] mb-12 relative z-10">
        
        {/* Header Section */}
        <div className="col-span-12 row-span-1 flex flex-col md:flex-row items-start md:items-end justify-between pb-4 border-b border-outline-variant/10">
          <div>
            <h2 className="font-headline text-4xl text-on-surface tracking-tight">Observer <span className="text-primary italic font-medium">Live</span></h2>
            <div className="flex items-center space-x-3 mt-3">
              <span className="flex items-center space-x-2 bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[10px] font-label text-primary font-bold uppercase tracking-[0.2em]">System Active</span>
              </span>
              <span className="text-[10px] font-label text-on-surface-variant font-medium tracking-widest uppercase">SECURE_TUNNEL: ESTABLISHED</span>
            </div>
          </div>

          {/* Quick Stats Row for Observer Header */}
          <div className="flex items-center space-x-6 mt-4 md:mt-0 bg-surface-container-low px-6 py-3 rounded-lg border border-outline-variant/10 shadow-2xl">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-label font-bold tracking-[0.2em] text-on-surface-variant/80 uppercase">Tokens Processed</span>
              <span className="text-2xl font-label text-on-surface font-light">
                {(stats?.totalTokens || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-px h-10 bg-outline-variant/20"></div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-label font-bold tracking-[0.2em] text-on-surface-variant/80 uppercase">Threats Blocked</span>
              <span className="text-2xl font-label text-secondary font-light">
                {(stats?.flaggedCount || 0).toLocaleString()}
              </span>
            </div>
            {(stats?.totalSavings || 0) > 0 && (
              <>
                <div className="w-px h-10 bg-outline-variant/20"></div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-label font-bold tracking-[0.2em] text-emerald-400/80 uppercase">Money Saved</span>
                  <span className="text-2xl font-label text-emerald-400 font-light">
                    ${(stats?.totalSavings || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center Visualization: Network/Map */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="col-span-12 lg:col-span-8 row-span-5 bg-surface-container-low rounded-xl relative overflow-hidden group border border-outline-variant/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
        >
          <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #c8bfff 0%, transparent 60%)' }}></div>
          
          {/* Map Decorative Layer */}
          <div className="absolute inset-0 z-0">
            <img 
              alt="Dark digital world map with network nodes" 
              className="w-full h-full object-cover opacity-[0.05] mix-blend-screen" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOa9azM2of5nmhY4KTYDUOp3qFNDGZXPOONxvGh3kul_bj-8rZc5fFcxy88VE3AJauuppTHiEmGo3BwhPCiUZ2xuqGQt9lBOz0UCyWd4Xt_S6LZ_Bdm1GzUYSeCSojS4GV9NRu2Bg6Gz5Ev3sBgV5O0dLM5Ss247_i9k1Qu7nuCZcEHYY6CK-ZZ_4wBoI_IY4qX4CR8DtCTzT3pkhjWjXky2JqW3deGaOXlhSmOZKmabOpb7mCX0xF7Y5LYwspJ7xCF0hN-p7qGtE"
            />
          </div>

          {/* Traffic Distribution — from REAL data */}
          <div className="absolute top-6 left-6 z-10 flex flex-col space-y-2">
            <div className="glass-effect p-4 rounded-lg border border-outline-variant/10 border-l-2 border-l-primary shadow-lg">
              <p className="text-[9px] font-label text-primary uppercase font-bold tracking-[0.2em] mb-4">Traffic Distribution</p>
              <div className="flex items-center space-x-6">
                {providerDistribution.length > 0 ? (
                  providerDistribution.map(p => (
                    <div key={p.name}>
                      <p className="text-[9px] font-label font-bold text-on-surface-variant uppercase tracking-wider">{p.name}</p>
                      <p className="text-sm font-label text-on-surface mt-1">{p.percent}%</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] font-label text-on-surface-variant italic">No traffic data yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Visualization Content Grid */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-8 overflow-hidden">
            <div className="w-full h-full max-w-3xl flex items-center justify-between relative mt-8 z-20">
              
              <div className="flex flex-col space-y-12">
                <div className="text-center group">
                  <div className="w-16 h-16 glass-effect flex items-center justify-center border border-primary/20 rounded-full hover:border-primary transition-colors hover:shadow-[0_0_20px_rgba(200,191,255,0.2)]">
                    <Smartphone className="text-primary w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-label mt-3 font-bold tracking-wider text-on-surface-variant">MOBILE_APP</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 glass-effect flex items-center justify-center border border-primary/20 rounded-full hover:border-primary transition-colors hover:shadow-[0_0_20px_rgba(200,191,255,0.2)]">
                    <Globe className="text-primary w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-label mt-3 font-bold tracking-wider text-on-surface-variant">WEB_CLIENT</p>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                <div className="w-56 h-56 rounded-full border border-primary/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-30" style={{ animationDuration: '3s' }}></div>
                  <div className="w-36 h-36 glass-effect rounded-full flex items-center justify-center border border-primary/40 shadow-[0_0_50px_rgba(200,191,255,0.2)] overflow-hidden relative backdrop-blur-xl">
                    <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-primary/30 to-transparent"></div>
                    <div className="text-center relative z-10">
                      <span className="text-4xl font-headline text-primary tracking-tight font-medium italic drop-shadow-[0_0_10px_rgba(200,191,255,0.8)]">Zyra</span>
                      <p className="text-[9px] font-label font-bold tracking-[0.2em] text-primary/80 mt-1">CORE_MESH</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Status — from REAL data */}
              <div className="flex flex-col space-y-6 w-52 z-20">
                {providerStatus.length > 0 ? (
                  providerStatus.map((ps, i) => (
                    <div key={ps.name} className={`flex items-center space-x-4 backdrop-blur-md p-3.5 rounded-lg border shadow-xl transition-all
                      ${ps.status === 'DEGRADED' 
                        ? 'bg-error-container/5 border-secondary/30 border-l-2 border-l-secondary' 
                        : 'bg-surface-container-low/90 border-outline-variant/20 hover:border-primary/50'}`}>
                      <div className="w-10 h-10 bg-surface flex items-center justify-center rounded-md border border-outline-variant/10">
                        {ps.status === 'DEGRADED' 
                          ? <ShieldAlert className="text-secondary w-5 h-5" />
                          : <Zap className="text-white w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-[11px] font-label font-bold text-white tracking-wider">{ps.name}</p>
                        <p className={`text-[9px] font-label font-bold mt-0.5 ${ps.status === 'DEGRADED' ? 'text-secondary' : 'text-emerald-400'}`}>
                          {ps.status === 'DEGRADED' ? 'DEGRADED' : 'ONLINE'} · {ps.avgLatency}ms
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center space-x-4 bg-surface-container-low/90 backdrop-blur-md p-3.5 rounded-lg border border-outline-variant/20 shadow-xl">
                      <div className="w-10 h-10 bg-surface flex items-center justify-center rounded-md border border-outline-variant/10">
                        <Zap className="text-on-surface-variant/40 w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-label font-bold text-on-surface-variant/50 tracking-wider">NO_PROVIDERS</p>
                        <p className="text-[9px] font-label font-bold text-on-surface-variant/30 mt-0.5">AWAITING_DATA</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Dynamic Path SVG */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
                <path d="M 60 180 Q 200 180 320 250" fill="none" stroke="rgba(200, 191, 255, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_30s_linear_infinite]"></path>
                <path d="M 60 320 Q 200 320 320 250" fill="none" stroke="rgba(200, 191, 255, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_30s_linear_infinite]"></path>
                <path d="M 430 250 Q 550 120 620 120" fill="none" stroke="rgba(200, 191, 255, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_30s_linear_infinite]"></path>
                <path d="M 430 250 Q 550 250 620 250" fill="none" stroke="rgba(200, 191, 255, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_30s_linear_infinite]"></path>
                <path d="M 430 250 Q 550 380 620 380" fill="none" stroke="rgba(200, 191, 255, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_30s_linear_infinite]"></path>
              </svg>
              <style jsx>{`@keyframes dash { to { stroke-dashoffset: -1000; } }`}</style>
            </div>
          </div>
        </motion.div>

        {/* Terminal Section: Live Intercepts */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="col-span-12 lg:col-span-4 row-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col relative overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10 bg-surface-container-low/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <Terminal className="text-primary w-4 h-4" />
              <span className="text-[10px] font-label text-on-surface-variant font-bold uppercase tracking-[0.2em]">Live Intercept Feed</span>
            </div>
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-surface-variant"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-surface-variant"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-surface-variant"></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 font-label text-xs leading-relaxed tracking-wide">
            {highRisk.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400/40 mx-auto" />
                  <p className="text-on-surface-variant/60 font-label text-[11px] font-bold uppercase tracking-[0.2em]">All Clear</p>
                  <p className="text-on-surface-variant/40 font-label text-[10px]">No high-risk events detected</p>
                </div>
              </div>
            ) : (
              highRisk.map((log, i) => (
                <div key={log._id || i} className="flex space-x-3 bg-error-container/10 p-3 -mx-2 border-l-2 border-secondary hover:bg-error-container/20 transition-colors">
                  <span className="text-secondary font-bold select-none">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</span>
                  <div className="flex-1">
                    <span className="text-secondary font-bold shadow-sm shadow-secondary/10">[BLOCKED]</span>
                    <span className="text-on-surface ml-2 font-medium">Risk Score {log.riskScore} detected</span>
                    <p className="text-on-surface-variant mt-1.5 italic font-body text-[11px]">User: {log.userId}</p>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[9px]">
                      {log.flags?.map((f: string) => (
                        <span key={f} className="bg-secondary/20 px-1.5 py-0.5 rounded text-secondary shadow-sm shadow-secondary/5 font-bold tracking-[0.1em] uppercase">
                          {f}
                        </span>
                      ))}
                      <span className="bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-bold tracking-[0.1em] uppercase">ACT: REJECT</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-outline-variant/10 bg-surface-container-low/80 flex items-center space-x-3 backdrop-blur-md">
            <span className="text-primary font-label text-sm font-bold">&gt;</span>
            <span className="w-1.5 h-4 bg-primary animate-pulse"></span>
            <span className="text-[10px] font-label text-on-surface-variant italic tracking-widest uppercase">
              {highRisk.length > 0 ? `${highRisk.length} threats intercepted` : 'Awaiting network streams...'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* 
        ==============================
        ANALYTICS: REAL DATA ONLY
        ==============================
      */}
      <div className="space-y-8 relative z-10 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mt-12 mb-2">
          <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Expanded Metrics</h2>
          <span className="px-3 py-1 bg-surface-container text-on-surface-variant font-label text-[10px] tracking-[0.2em] rounded-sm font-bold">ANALYTICS ENGINE</span>
        </div>

        {/* 6-Column Stats Row — now includes savings */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatsCard title="Total Logs" value={stats?.totalLogs?.toLocaleString() || '0'} icon={Activity} delay={0.05} />
          <StatsCard title="Avg Risk Score" value={stats?.avgRiskScore || '0'} icon={Zap} delay={0.1} />
          <StatsCard title="Total Cost" value={`$${stats?.totalCost || '0.00'}`} icon={DollarSign} delay={0.15} />
          <StatsCard title="Total Tokens" value={stats?.totalTokens?.toLocaleString() || '0'} icon={Fingerprint} delay={0.2} />
          <StatsCard title="Threats Flagged" value={stats?.flaggedCount?.toLocaleString() || '0'} icon={ShieldAlert} delay={0.25} />
          <StatsCard title="Money Saved" value={`$${(stats?.totalSavings || 0).toFixed(2)}`} icon={TrendingDown} delay={0.3} accent={true} />
        </div>

        {/* Daily Usage Render Chart — REAL data only */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-surface-container-low rounded-[16px] p-8 shadow-2xl border border-outline-variant/10 flex flex-col mt-8 hover:border-outline-variant/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-xl font-bold text-on-surface font-headline tracking-tight">Daily Usage Overview</h3>
              <p className="text-[10px] font-label text-on-surface-variant font-bold uppercase tracking-[0.2em] mt-1.5">
                Logs over the past {period === '7d' ? '7' : '30'} days
              </p>
            </div>
            <select 
              value={period === '7d' ? 'Last 7 days' : 'Last 30 days'}
              onChange={(e) => handlePeriodChange(e.target.value.includes('7') ? '7d' : '30d')}
              className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface text-sm font-label font-bold px-4 py-2.5 rounded-xl focus:outline-none focus:border-primary transition-colors hover:border-outline-variant/40"
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          
          <div className="flex-1 min-h-[340px] flex items-end justify-between space-x-6 w-full relative">
            {/* Grid lines Background Layer */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
              {[4,3,2,1,0].map((v) => (
                <div key={v} className="w-full h-[1px] bg-outline-variant/10 flex items-center justify-end" />
              ))}
            </div>

            {chartData.length > 0 ? (
              chartData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full pb-8">
                  <motion.div 
                    initial={{ height: 0 }}
                    whileInView={{ height: `${Math.max(data.height, 6)}%` }} 
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1, type: 'spring', bounce: 0.2 }}
                    className="w-full max-w-[56px] bg-primary/20 rounded-t-lg group-hover:bg-primary/40 transition-all relative flex items-end justify-center overflow-hidden"
                  >
                    <div className="w-full bg-primary rounded-t-sm" style={{ height: '4px' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </motion.div>
                  
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-1/2 bg-surface-container-highest text-sm font-label font-bold px-4 py-2.5 rounded-lg shadow-2xl border border-outline-variant/20 text-white whitespace-nowrap transition-all duration-200 pointer-events-none z-50 transform translate-y-1/2 scale-95 group-hover:scale-100 mb-4">
                    {data.value.toLocaleString()} logs · ${data.cost.toFixed(4)}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-container-highest border-b border-r border-outline-variant/20 rotate-45"></div>
                  </div>
                  
                  <span className="absolute bottom-0 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest transition-colors group-hover:text-primary">
                    {data.date.toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center z-10">
                <div className="text-center space-y-3">
                  <Activity className="w-10 h-10 text-on-surface-variant/20 mx-auto" />
                  <p className="text-on-surface-variant/40 font-label text-sm font-bold">No usage data yet</p>
                  <p className="text-on-surface-variant/30 font-label text-xs">Send requests through the proxy to see analytics</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
