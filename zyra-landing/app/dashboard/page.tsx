'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Activity, ShieldAlert, Fingerprint, Zap, DollarSign } from "lucide-react"
import api from "@/lib/api"

const StatsCard = ({ title, value, icon: Icon, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white rounded-[16px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] flex flex-col justify-between"
  >
    <div className="flex items-center justify-between xl:mb-6 mb-4">
      <h3 className="text-[#424843] text-sm font-semibold">{title}</h3>
      <div className="p-2 bg-[#fdfaea] rounded-full text-[#5e51ad]">
        <Icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
      </div>
    </div>
    <span className="text-3xl font-headline font-semibold text-[#032416] tracking-tight truncate">
      {value}
    </span>
  </motion.div>
)

export default function DashboardOverview() {
  const [stats, setStats] = useState<any>(null)
  const [usage, setUsage] = useState<any[]>([])
  const [highRisk, setHighRisk] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, usageRes, highRiskRes] = await Promise.all([
          api.get('/api/analytics/overview'),
          api.get('/api/analytics/usage?period=7d'),
          api.get('/api/analytics/high-risk')
        ])
        setStats(overviewRes.data)
        setUsage(usageRes.data.usage || [])
        setHighRisk(highRiskRes.data.highRisk || [])
      } catch (err) {
        console.error("Failed to load analytics", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center font-body text-[#424843] min-h-[50vh]">
        Loading dashboard metrics...
      </div>
    )
  }

  // Generate chart rendering values
  const defaultHeights = [40, 65, 45, 80, 55, 90, 75]
  const maxLogs = Math.max(...(usage.length > 0 ? usage.map(u => u.totalLogs) : defaultHeights)) || 1
  const chartData = usage.length > 0 
    ? usage.map(u => ({ height: (u.totalLogs / maxLogs) * 100, date: new Date(u._id), value: u.totalLogs }))
    : defaultHeights.map((h, i) => ({ height: h, date: new Date(Date.now() - (6-i)*86400000), value: h * 10 }))

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-headline font-bold text-[#032416] tracking-tight">Overview</h1>
        <div className="flex items-center space-x-2 text-sm font-bold text-[#032416] bg-white px-4 py-2 rounded-full shadow-sm border border-[#f1eedf]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5e51ad] opacity-40"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5e51ad]"></span>
          </span>
          <span>System Healthy</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Logs" value={stats?.totalLogs?.toLocaleString() || '0'} icon={Activity} delay={0.05} />
        <StatsCard title="Avg Risk Score" value={stats?.avgRiskScore || '0'} icon={Zap} delay={0.1} />
        <StatsCard title="Total Cost" value={`$${stats?.totalCost || '0.00'}`} icon={DollarSign} delay={0.15} />
        <StatsCard title="Total Tokens" value={stats?.totalTokens?.toLocaleString() || '0'} icon={Fingerprint} delay={0.2} />
        <StatsCard title="Flagged Count" value={stats?.flaggedCount?.toLocaleString() || '0'} icon={ShieldAlert} delay={0.25} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Line Chart Area (Visualized via overlapping gradient area layout) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="xl:col-span-2 bg-white rounded-[16px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] flex flex-col"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-[#032416] font-headline">Daily Usage</h3>
              <p className="text-sm text-[#424843] mt-1 font-medium">Logs and tokens over the past 7 days</p>
            </div>
            <select className="bg-[#fdfaea] border border-[#f1eedf] text-[#032416] text-sm font-bold px-4 py-2 rounded-xl focus:outline-none focus:border-[#5e51ad] transition-colors">
              <option>Last 7 days</option>
            </select>
          </div>
          
          <div className="flex-1 min-h-[240px] flex items-end justify-between space-x-4 w-full relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
              {[4,3,2,1,0].map((v) => (
                <div key={v} className="w-full h-[1px] bg-[#f1eedf] flex items-center justify-end" />
              ))}
            </div>

            {/* Bars */}
            {chartData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full pb-8">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(data.height, 4)}%` }} 
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.05, type: 'spring' }}
                  className="w-full max-w-[48px] bg-[#5e51ad]/20 rounded-t-lg group-hover:bg-[#5e51ad]/40 transition-colors relative flex items-end justify-center"
                >
                  <div className="w-full bg-[#5e51ad] rounded-t-sm" style={{ height: '4px' }} />
                </motion.div>
                
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-1/2 bg-[#1a3a2a] text-sm font-bold px-3 py-2 rounded-lg shadow-xl text-white whitespace-nowrap transition-opacity pointer-events-none z-50 transform translate-y-1/2">
                  {data.value} requests
                </div>
                
                <span className="absolute bottom-0 text-xs font-bold text-[#424843] uppercase tracking-wider">
                  {data.date.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* High Risk Logs Table Widget */}
        <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4, duration: 0.5 }}
           className="xl:col-span-1 bg-white rounded-[16px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#032416] font-headline">High Risk Logs</h3>
            <Link href="/dashboard/logs" className="text-sm font-bold text-[#5e51ad] hover:underline">View All</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {highRisk.length === 0 ? (
              <div className="text-sm text-[#424843] text-center pt-10">No high risk logs found.</div>
            ) : (
              highRisk.slice(0, 5).map(log => (
                <div key={log._id} className="p-4 rounded-xl border border-[#f1eedf] bg-[#fdfaea] hover:border-[#c1c8c2] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-[#032416] text-sm truncate max-w-[120px]">{log.userId}</span>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">Score: {log.riskScore}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex gap-1.5 flex-wrap">
                      {log.flags?.map((f: string) => (
                        <span key={f} className="text-[10px] uppercase tracking-wider font-bold text-[#5e51ad] bg-[#5e51ad]/10 px-1.5 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-[#424843]">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
