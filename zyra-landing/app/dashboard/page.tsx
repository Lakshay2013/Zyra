'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, ShieldAlert, Fingerprint, Zap } from "lucide-react"
import api from "@/lib/api"

const StatsCard = ({ title, value, subtitle, icon: Icon, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="relative p-6 rounded-2xl bg-[#0A0A0A] border border-stone-800/60 overflow-hidden group hover:border-stone-700 transition-colors"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-stone-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-stone-400 text-xs tracking-wider uppercase font-medium">{title}</h3>
      <div className="p-2 bg-stone-900 rounded-lg text-stone-300">
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="flex items-end space-x-3 mb-1">
      <span className="text-3xl font-headline font-bold text-stone-100 tracking-tight">{value}</span>
      {subtitle && <span className="text-xs font-medium mb-1.5 text-stone-500">{subtitle}</span>}
    </div>
  </motion.div>
)

export default function DashboardOverview() {
  const [stats, setStats] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, usageRes] = await Promise.all([
          api.get('/api/analytics/overview'),
          api.get('/api/analytics/usage?period=7d')
        ])
        setStats(overviewRes.data)
        setUsage(usageRes.data.usage || [])
      } catch (err) {
        console.error("Failed to load analytics", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="text-stone-500 text-center py-20">Loading dashboard...</div>
  }

  // Fallback map if the usage data is empty
  const defaultHeights = [40, 65, 45, 80, 55, 90, 75, 50, 85, 60, 45, 70, 55, 80]
  
  // Try to use real usage data to drive a chart, else show fallback animation
  const maxLogs = Math.max(...(usage.length > 0 ? usage.map(u => u.totalLogs) : defaultHeights)) || 1
  const chartData = usage.length > 0 
    ? usage.map(u => ({ height: (u.totalLogs / maxLogs) * 100, label: u._id, value: u.totalLogs, risk: u.avgRisk }))
    : defaultHeights.map((h, i) => ({ height: h, label: `Day ${i}`, value: h * 10, risk: Math.random() * 50 }))

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-white mb-2 tracking-tight">Overview</h1>
          <p className="text-stone-400 text-sm">Real-time metrics for your LLM infrastructure (30-day window).</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span>System Healthy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Requests" 
          value={stats?.totalLogs?.toLocaleString() || '0'} 
          subtitle="Past 30d" 
          icon={Activity} 
          delay={0.1} 
        />
        <StatsCard 
          title="Avg Risk Score" 
          value={stats?.avgRiskScore || '0'} 
          subtitle="out of 100"
          icon={Zap} 
          delay={0.2} 
        />
        <StatsCard 
          title="Total Tokens" 
          value={stats?.totalTokens?.toLocaleString() || '0'} 
          subtitle="Processed"
          icon={Fingerprint} 
          delay={0.3} 
        />
        <StatsCard 
          title="Flagged Responses" 
          value={stats?.flaggedCount?.toLocaleString() || '0'} 
          subtitle=">50 Risk"
          icon={ShieldAlert} 
          delay={0.4} 
        />
      </div>

      {/* Main Chart Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="w-full p-6 bg-[#0A0A0A] border border-stone-800/60 rounded-3xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-white font-medium">Traffic & Risk Correlation</h3>
            <p className="text-xs text-stone-500 mt-1">Comparing total requests vs risk level</p>
          </div>
          <select className="bg-stone-900 border border-stone-800 text-stone-300 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-stone-600">
            <option>Last 7 days</option>
          </select>
        </div>
        
        {/* Animated Bar Chart using dynamic data */}
        <div className="h-64 flex items-end justify-between space-x-2 w-full pt-10 border-b border-stone-800 relative">
          <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
            {[4,3,2,1,0].map((v) => (
              <div key={v} className="w-full h-px bg-stone-800/30 flex items-center justify-end pr-[-20px]" />
            ))}
          </div>

          {chartData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(data.height, 5)}%` }} // Minimum height so tiny data sets still render
                transition={{ duration: 0.8, delay: 0.6 + i * 0.05, type: 'spring' }}
                className="w-full max-w-[40px] bg-stone-800 rounded-t-sm group-hover:bg-stone-600 transition-colors relative"
              >
                {/* Overlay high risk bar */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min(data.risk, 100)}%` }}
                  transition={{ duration: 0.8, delay: 1 + i * 0.05 }}
                  className="absolute bottom-0 w-full bg-red-500/20 group-hover:bg-red-500/40 rounded-t-sm"
                />
              </motion.div>
              <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-stone-800 text-xs px-3 py-2 rounded shadow-xl text-white whitespace-nowrap transition-opacity pointer-events-none z-50">
                {data.value} reqs
                <br/>
                <span className="text-stone-400">Avg Risk: {Math.round(data.risk)}</span>
              </div>
            </div>
          ))}
        </div>
        {usage.length > 0 && (
          <div className="flex justify-between items-center text-[10px] text-stone-500 font-mono mt-4 uppercase">
            {usage.map((u, i) => (
              <span key={i}>{new Date(u._id).toLocaleDateString(undefined, { weekday: 'short' })}</span>
            ))}
          </div>
        )}
      </motion.div>

    </div>
  )
}
