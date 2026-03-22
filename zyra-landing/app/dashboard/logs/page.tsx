'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Filter, Search, ShieldAlert, ShieldCheck } from "lucide-react"
import api from "@/lib/api"
import React from "react"

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-white mb-2 tracking-tight">Logs Explorer</h1>
          <p className="text-stone-400 text-sm">Real-time stream of all LLM interactions.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input 
              type="text" 
              placeholder="Search by ID or user..." 
              className="bg-[#0A0A0A] border border-stone-800 rounded-lg pl-9 pr-4 py-2 text-sm text-stone-200 focus:outline-none focus:border-stone-600 w-64"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-[#0A0A0A] border border-stone-800 rounded-lg text-sm text-stone-300 hover:bg-stone-900 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-stone-800/60 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-stone-500 font-mono text-sm">Loading logs stream...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-stone-500 font-mono text-sm">No interactions logged yet. Time to test your proxy!</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-stone-500 uppercase bg-stone-900/50 border-b border-stone-800 font-mono tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Status/Score</th>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Model</th>
                  <th className="px-6 py-4 font-medium">User ID</th>
                  <th className="px-6 py-4 font-medium">Tokens</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {logs.map((log) => {
                  const isExpanded = expandedRow === log._id
                  const isHighRisk = log.riskScore > 50
                  return (
                    <React.Fragment key={log._id}>
                      <tr 
                        onClick={() => setExpandedRow(isExpanded ? null : log._id)}
                        className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-stone-900/40' : 'hover:bg-stone-900/30'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {isHighRisk ? (
                              <ShieldAlert className="w-4 h-4 text-red-500" />
                            ) : (
                              <ShieldCheck className="w-4 h-4 text-green-500" />
                            )}
                            <span className={`font-mono ${isHighRisk ? 'text-red-400 font-bold' : 'text-stone-300'}`}>
                              {Number(log.riskScore || 0).toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-stone-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-stone-800 text-stone-300 rounded-md text-xs font-mono border border-stone-700">
                            {log.model}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-stone-300 font-mono text-xs">{log.userId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-stone-400">{log.tokens?.total || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-stone-500">
                          <ChevronDown className={`w-4 h-4 inline-block transform transition-transform duration-300 ${isExpanded ? 'rotate-180 text-stone-200' : 'group-hover:text-stone-300'}`} />
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
                            <td colSpan={6} className="bg-stone-900/40 p-0 border-b border-stone-800/60">
                              <div className="p-6 md:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {/* Prompt */}
                                  <div className="space-y-2">
                                    <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Prompt Payload</h4>
                                    <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl text-stone-300 text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono">
                                      {log.prompt}
                                    </div>
                                  </div>
                                  {/* Response */}
                                  <div className="space-y-2">
                                    <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">Model Response</h4>
                                    <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl text-stone-300 text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono">
                                      {log.response || <span className="text-stone-600 italic">No response logged</span>}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-stone-800/50">
                                  {log.flags && log.flags.length > 0 && log.flags.map((flag: string) => (
                                    <span key={flag} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                      Flag: {flag}
                                    </span>
                                  ))}
                                  {(!log.flags || log.flags.length === 0) && (
                                    <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                      Clean
                                    </span>
                                  )}
                                  <span className="px-3 py-1 bg-stone-800 text-stone-400 border border-stone-700/50 rounded-full text-xs font-mono ml-auto">
                                    ID: {log._id}
                                  </span>
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
