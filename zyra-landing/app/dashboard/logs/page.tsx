'use client'

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Filter, Search } from "lucide-react"
import api from "@/lib/api"

export default function LogsExplorer() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await api.get('/api/logs?limit=50')
        setLogs(res.data.logs || [])
      } catch (err) {
        console.error("Failed to load logs", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const getRiskColor = (score: number) => {
    if (score <= 30) return "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]"
    if (score <= 70) return "bg-[#fff8e1] text-[#f57f17] border-[#ffecb3]"
    return "bg-[#ffebee] text-[#c62828] border-[#ffcdd2]"
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-headline font-bold text-[#032416] mb-2 tracking-tight">Logs Explorer</h1>
          <p className="text-[#424843] font-body text-sm font-medium">Real-time stream of all LLM interactions.</p>
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] flex flex-col overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-[#f1eedf] flex flex-wrap gap-3 items-center bg-[#fdfaea]/30">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#424843]" />
            <input 
              type="text" 
              placeholder="Search by User ID..." 
              className="w-full bg-white border border-[#c1c8c2] rounded-xl pl-9 pr-4 py-2 text-sm text-[#032416] focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all placeholder-[#c1c8c2]"
            />
          </div>
          
          <select className="bg-white border border-[#c1c8c2] text-[#032416] text-sm font-semibold px-4 py-2 rounded-xl focus:outline-none focus:border-[#5e51ad]">
            <option>All Models</option>
            <option>gpt-4-turbo</option>
            <option>claude-3-haiku</option>
          </select>
          
          <select className="bg-white border border-[#c1c8c2] text-[#032416] text-sm font-semibold px-4 py-2 rounded-xl focus:outline-none focus:border-[#5e51ad]">
            <option>All Risk Levels</option>
            <option>High (71-100)</option>
            <option>Medium (31-70)</option>
            <option>Low (0-30)</option>
          </select>

          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-[#c1c8c2] rounded-xl text-sm font-bold text-[#424843] hover:text-[#032416] hover:bg-[#f1eedf]/50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-12 text-center text-[#424843] font-body text-sm">Loading logs stream...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-[#424843] font-body text-sm">No interactions logged yet.</div>
          ) : (
            <table className="w-full text-left font-body text-sm">
              <thead className="text-[11px] text-[#424843] uppercase bg-[#fdfaea] border-b border-[#f1eedf] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Model</th>
                  <th className="px-6 py-4">Risk</th >
                  <th className="px-6 py-4">Flags</th>
                  <th className="px-6 py-4">Tokens</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eedf]">
                {logs.map((log) => {
                  const isExpanded = expandedRow === log._id
                  const score = Number(log.riskScore || 0)
                  return (
                    <React.Fragment key={log._id}>
                      <tr 
                        onClick={() => setExpandedRow(isExpanded ? null : log._id)}
                        className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-[#fdfaea]' : 'hover:bg-[#fdfaea]/60'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-[#424843] font-medium">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-[#032416]">{log.userId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-[#f1eedf] text-[#424843] rounded-lg text-xs font-bold font-mono">
                            {log.model}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRiskColor(score)}`}>
                            {score.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            {(!log.flags || log.flags.length === 0) && (
                              <span className="text-[#c1c8c2] text-xs italic">none</span>
                            )}
                            {log.flags?.map((flag: string) => (
                              <span key={flag} className="px-2 py-0.5 bg-[#5e51ad]/10 text-[#5e51ad] rounded text-[10px] font-bold uppercase tracking-widest border border-[#5e51ad]/20">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#424843] font-semibold">{log.tokens?.total || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#424843] font-semibold">${Number(log.cost||0).toFixed(4)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <ChevronDown className={`w-4 h-4 inline-block transform transition-transform duration-300 text-[#424843] ${isExpanded ? 'rotate-180 text-[#032416]' : 'group-hover:text-[#032416]'}`} />
                        </td>
                      </tr>
                      
                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <td colSpan={8} className="bg-[#fdfaea] p-0 border-b border-[#f1eedf]">
                              <div className="p-6 md:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {/* Prompt */}
                                  <div className="space-y-3">
                                    <h4 className="text-[11px] uppercase tracking-widest text-[#5e51ad] font-bold">Prompt Payload</h4>
                                    <div className="p-4 bg-white border border-[#f1eedf] rounded-[12px] shadow-sm text-[#032416] text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono">
                                      {log.prompt}
                                    </div>
                                  </div>
                                  {/* Response */}
                                  <div className="space-y-3">
                                    <h4 className="text-[11px] uppercase tracking-widest text-[#5e51ad] font-bold">Model Response</h4>
                                    <div className="p-4 bg-white border border-[#f1eedf] rounded-[12px] shadow-sm text-[#032416] text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono">
                                      {log.response || <span className="text-[#c1c8c2] italic">No response logged</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
