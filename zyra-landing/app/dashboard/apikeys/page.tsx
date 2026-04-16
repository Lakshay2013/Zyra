'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, KeyRound, Plus, Trash2, X } from "lucide-react"
import toast from 'react-hot-toast'
import api from "@/lib/api"

export default function ApiKeys() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal creation state
  const [showModal, setShowModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  useEffect(() => {
    fetchKeys()
  }, [])

  async function fetchKeys() {
    try {
      const res = await api.get('/api/keys')
      setKeys(res.data.keys || [])
    } catch (err) {
      console.error("Failed to load keys", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName) return
    try {
      const res = await api.post('/api/keys', { name: newKeyName })
      setGeneratedKey(res.data.key)
      setNewKeyName("")
      fetchKeys()
    } catch (err) {
      console.error("Failed to create key", err)
      toast.error("Failed to create key.")
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm("Are you sure you want to revoke this key? Traffic using it will immediately fail.")) return
    try {
      await api.delete(`/api/keys/${id}`)
      fetchKeys()
    } catch (err) {
      console.error("Failed to delete key", err)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 relative flex flex-col font-body">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-headline font-bold text-[#032416] mb-2 tracking-tight">API Keys</h1>
          <p className="text-[#424843] font-medium text-sm">Manage proxy keys to authenticate SDK requests to Zyra.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#1a3a2a] hover:bg-[#032416] text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_rgba(26,58,42,0.4)]"
        >
          <Plus className="w-4 h-4 ml-[-4px]" />
          <span>Create new key</span>
        </button>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] flex flex-col overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#424843] font-body text-sm">Loading keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center text-[#424843] font-body text-sm">You don't have any keys yet. Create one to get started!</div>
        ) : (
          <table className="w-full text-left font-body text-sm">
            <thead className="text-[11px] text-[#424843] uppercase bg-[#fdfaea] border-b border-[#f1eedf] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Prefix</th>
                <th className="px-6 py-4">Created By</th>
                <th className="px-6 py-4">Last Used</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eedf]">
              {keys.map((key) => (
                <tr key={key._id} className="hover:bg-[#fdfaea]/60 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <KeyRound className="w-[18px] h-[18px] text-[#a99cfe]" />
                      <span className={`font-bold ${key.isActive !== false ? 'text-[#032416]' : 'text-[#424843] line-through'}`}>
                        {key.name || "Unnamed Key"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="font-mono text-[13px] bg-[#fdfaea] border border-[#f1eedf] px-2 py-1 rounded-md text-[#032416] font-semibold">
                      {key.prefix}••••••••••••••••
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-[#424843] font-semibold">
                    {key.createdBy?.name || 'Admin'}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-[#424843]">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border 
                      ${key.isActive !== false 
                        ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]' 
                        : 'bg-[#ffebee] text-[#c62828] border-[#ffcdd2]'}`}
                    >
                      {key.isActive !== false ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                    {key.isActive !== false && (
                      <button onClick={() => handleRevokeKey(key._id)} className="text-[#c1c8c2] hover:text-[#d32f2f] hover:bg-red-50 p-2 rounded-lg transition-colors" title="Revoke Key">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Creating Key */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => !generatedKey && setShowModal(false)}
              className="absolute inset-0 bg-[#032416]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-[#f1eedf] shadow-[0_20px_60px_rgb(0,0,0,0.08)] rounded-[20px] w-full max-w-md relative z-10 overflow-hidden font-body"
            >
              <div className="p-6 border-b border-[#f1eedf] flex items-center justify-between bg-[#fdfaea]/50">
                <h3 className="text-xl font-bold font-headline text-[#032416]">Generate API Key</h3>
                {!generatedKey && (
                  <button onClick={() => setShowModal(false)} className="text-[#424843] hover:text-[#032416] transition-colors bg-white rounded-full p-1 border border-[#f1eedf] shadow-sm">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="p-8">
                {!generatedKey ? (
                  <form onSubmit={handleCreateKey} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#032416] mb-2">Key Name</label>
                      <input 
                        type="text" 
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        placeholder="e.g. Production Traffic"
                        required
                        autoFocus
                        className="w-full bg-white border border-[#c1c8c2] rounded-xl px-4 py-3.5 text-[#032416] placeholder-[#c1c8c2] focus:outline-none focus:border-[#5e51ad] focus:ring-1 focus:ring-[#5e51ad] transition-all text-sm font-semibold"
                      />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-[#1a3a2a] text-white font-bold rounded-xl hover:bg-[#032416] transition-colors shadow-lg">
                      Create Key
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-[#e8f5e9] border border-[#c8e6c9] text-[#2e7d32] rounded-xl text-sm leading-relaxed font-medium">
                      <strong>Success!</strong> Your API key has been generated. Please copy it now as you will <strong>never</strong> be able to view it again.
                    </div>
                    
                    <div className="flex items-center bg-[#fdfaea] border border-[#f1eedf] rounded-xl overflow-hidden p-2">
                      <code className="flex-1 px-3 py-2 text-[#032416] font-mono text-sm break-all font-bold select-all">
                        {generatedKey}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(generatedKey)}
                        className="p-3 bg-white border border-[#f1eedf] hover:bg-[#5e51ad]/5 text-[#5e51ad] rounded-lg transition-colors shadow-sm ml-2"
                      >
                        <Copy className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setGeneratedKey(null)
                        setShowModal(false)
                      }} 
                      className="w-full py-3.5 bg-white text-[#1a3a2a] border border-[#c1c8c2] font-bold rounded-xl hover:bg-[#f1eedf] transition-colors"
                    >
                      I have saved it
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
