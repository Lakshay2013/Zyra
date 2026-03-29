'use client'

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Filter, Search, TrendingDown, RefreshCw } from "lucide-react"
import api from "@/lib/api"

export default function LogsExplorer() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  
  // Filter state
  const [searchUserId, setSearchUserId] = useState("")
  const [filterModel, setFilterModel] = useState("")
  const [filterRisk, setFilterRisk] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '50')
      params.set('page', String(page))
      if (searchUserId) params.set('userId', searchUserId)
      if (filterModel) params.set('model', filterModel)
      if (filterRisk === 'high') { params.set('minRisk', '71') }
      else if (filterRisk === 'medium') { params.set('minRisk', '31'); params.set('maxRisk', '70') }
      else if (filterRisk === 'low') { params.set('maxRisk', '30') }
      
      const res = await api.get(`/api/logs?${params.toString()}`)
      setLogs(res.data.logs || [])
      setPagination(res.data.pagination || null)
    } catch (err) {
      console.error("Failed to load logs", err)
    } finally {
      setLoading(false)
    }
  }, [page, searchUserId, filterModel, filterRisk])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<any>(null)
  const handleSearchChange = (val: string) => {
    setSearchUserId(val)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(setTimeout(() => {
      setPage(1)
    }, 500))
  }

  const handleFilterChange = (type: 'model' | 'risk', val: string) => {
    if (type === 'model') setFilterModel(val)
    if (type === 'risk') setFilterRisk(val)
    setPage(1)
  }

  // Unique models from loaded logs for the filter dropdown
  const uniqueModels = [...new Set(logs.map(l => l.model).filter(Boolean))]

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
          <p className="text-[#424843] font-body text-sm font-medium">
            Real-time stream of all LLM interactions.
            {pagination && <span className="ml-2 text-[#5e51ad] font-bold">{pagination.total} total logs</span>}
          </p>
        </div>
        <button 
          onClick={() => fetchLogs()} 
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-[#c1c8c2] rounded-xl text-sm font-bold text-[#424843] hover:text-[#032416] hover:bg-[#f1eedf]/50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] flex flex-col overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-[#f1eedf] flex flex-wrap gap-3 items-center bg-[#fdfaea]/30">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#424843]" />
            <input 
              type="text" 
              placeholder="Search by User ID..." 
              value={searchUserId}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full bg-white border border-[#c1c8c2] rounded-xl pl-9 pr-4 py-2 text-sm text-[#032416] focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all placeholder-[#c1c8c2]"
            />
          </div>
          
          <select 
            value={filterModel}
            onChange={e => handleFilterChange('model', e.target.value)}
            className="bg-white border border-[#c1c8c2] text-[#032416] text-sm font-semibold px-4 py-2 rounded-xl focus:outline-none focus:border-[#5e51ad]"
          >
            <option value="">All Models</option>
            {uniqueModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          
          <select 
            value={filterRisk}
            onChange={e => handleFilterChange('risk', e.target.value)}
            className="bg-white border border-[#c1c8c2] text-[#032416] text-sm font-semibold px-4 py-2 rounded-xl focus:outline-none focus:border-[#5e51ad]"
          >
            <option value="">All Risk Levels</option>
            <option value="high">High (71-100)</option>
            <option value="medium">Medium (31-70)</option>
            <option value="low">Low (0-30)</option>
          </select>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-12 text-center text-[#424843] font-body text-sm">Loading logs stream...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-[#424843] font-body text-sm">
              {searchUserId || filterModel || filterRisk ? 'No logs match your filters.' : 'No interactions logged yet.'}
            </div>
          ) : (
            <table className="w-full text-left font-body text-sm">
              <thead className="text-[11px] text-[#424843] uppercase bg-[#fdfaea] border-b border-[#f1eedf] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Model</th>
                  <th className="px-6 py-4">Risk</th>
                  <th className="px-6 py-4">Flags</th>
                  <th className="px-6 py-4">Tokens</th>
                  <th className="px-6 py-4">Cost</th>
                  <th className="px-6 py-4">Saved</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eedf]">
                {logs.map((log) => {
                  const isExpanded = expandedRow === log._id
                  const score = Number(log.riskScore || 0)
                  const savings = log.optimizer?.savings || 0
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
                        <td className="px-6 py-4 whitespace-nowrap text-[#424843] font-semibold">{(log.tokens?.total || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#424843] font-semibold">${Number(log.cost||0).toFixed(4)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {savings > 0 ? (
                            <span className="text-[#2e7d32] font-bold text-xs flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />${savings.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-[#c1c8c2] text-xs">—</span>
                          )}
                        </td>
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
                            <td colSpan={9} className="bg-[#fdfaea] p-0 border-b border-[#f1eedf]">
                              <div className="p-6 md:p-8 space-y-6">
                                {/* Optimizer Info */}
                                {log.optimizer?.wasOptimized && (
                                  <div className="flex items-center gap-3 p-3 bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl text-sm">
                                    <TrendingDown className="w-5 h-5 text-[#2e7d32]" />
                                    <span className="text-[#2e7d32] font-bold">
                                      Optimizer routed from <span className="font-mono">{log.optimizer.originalModel}</span> → <span className="font-mono">{log.optimizer.optimizedModel}</span> 
                                      {' '}(saved ${log.optimizer.savings?.toFixed(4)})
                                    </span>
                                  </div>
                                )}
                                {log.reliability?.fallbackUsed && (
                                  <div className="flex items-center gap-3 p-3 bg-[#fff8e1] border border-[#ffecb3] rounded-xl text-sm">
                                    <span className="text-[#f57f17] font-bold">
                                      ⚡ Fallback used: switched to {log.reliability.fallbackProvider}
                                      {log.reliability.retryCount > 0 && ` after ${log.reliability.retryCount} retries`}
                                    </span>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {/* Prompt */}
                                  <div className="space-y-3">
                                    <h4 className="text-[11px] uppercase tracking-widest text-[#5e51ad] font-bold">Prompt Payload</h4>
                                    <div className="p-4 bg-white border border-[#f1eedf] rounded-[12px] shadow-sm text-[#032416] text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto">
                                      {log.prompt}
                                    </div>
                                  </div>
                                  {/* Response */}
                                  <div className="space-y-3">
                                    <h4 className="text-[11px] uppercase tracking-widest text-[#5e51ad] font-bold">Model Response</h4>
                                    <div className="p-4 bg-white border border-[#f1eedf] rounded-[12px] shadow-sm text-[#032416] text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto">
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

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-[#f1eedf] flex items-center justify-between bg-[#fdfaea]/30">
            <span className="text-sm text-[#424843] font-medium">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 bg-white border border-[#c1c8c2] rounded-xl text-sm font-bold text-[#424843] hover:bg-[#f1eedf]/50 disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-4 py-2 bg-white border border-[#c1c8c2] rounded-xl text-sm font-bold text-[#424843] hover:bg-[#f1eedf]/50 disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
