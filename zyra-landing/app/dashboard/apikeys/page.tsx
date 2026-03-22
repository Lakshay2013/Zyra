'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Eye, EyeOff, KeyRound, Plus, Trash2, X } from "lucide-react"
import api from "@/lib/api"

export default function ApiKeys() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleKey, setVisibleKey] = useState<string | null>(null)
  
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
      fetchKeys() // Refresh table
    } catch (err) {
      console.error("Failed to create key", err)
      alert("Failed to create key.")
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
    alert("Copied to clipboard!")
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-white mb-2 tracking-tight">API Keys</h1>
          <p className="text-stone-400 text-sm">Manage proxy keys to authenticate SDK requests to Zyra.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-primary-container hover:bg-white text-on-primary-container hover:text-black rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-stone-500 font-mono text-sm">Loading keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-stone-500 font-mono text-sm bg-[#0A0A0A] border border-stone-800/60 rounded-2xl">
            You don't have any keys yet. Create one to get started!
          </div>
        ) : (
          keys.map((key, i) => (
            <motion.div
              key={key._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#0A0A0A] border border-stone-800/60 rounded-2xl group hover:border-stone-700 transition-colors"
            >
              <div className="flex items-start space-x-5 mb-4 md:mb-0">
                <div className={`p-3 rounded-xl ${key.isActive !== false ? 'bg-stone-900 text-stone-300' : 'bg-red-500/10 text-red-500'}`}>
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-medium text-lg ${key.isActive !== false ? 'text-white' : 'text-stone-500 line-through'}`}>
                    {key.name || "Unnamed Key"}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2 text-xs font-mono text-stone-500">
                    <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                    {key.isActive === false && (
                      <>
                        <span className="w-1 h-1 bg-stone-700 rounded-full"></span>
                        <span className="text-red-400">Revoked</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {key.isActive !== false && (
                <div className="flex items-center justify-between md:justify-end space-x-4 w-full md:w-auto">
                  {/* Key Reveal Input */}
                  <div className="flex items-center bg-stone-950 border border-stone-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 text-sm font-mono text-stone-300 border-r border-stone-800 w-48 truncate select-all">
                      {visibleKey === key._id ? `${key.prefix}••••••••••••••••` : `${key.prefix}••••••••••••••••`}
                    </div>
                    <button 
                      onClick={() => setVisibleKey(visibleKey === key._id ? null : key._id)}
                      className="px-3 py-2 text-stone-400 hover:text-white hover:bg-stone-900 transition-colors"
                      title={visibleKey === key._id ? "Hide key" : "Show prefix"}
                    >
                      {visibleKey === key._id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(`${key.prefix}••••••••••••••••`)}
                      className="px-3 py-2 text-stone-400 hover:text-white hover:bg-stone-900 transition-colors"
                      title="Copy prefix to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Delete */}
                  <button onClick={() => handleRevokeKey(key._id)} className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Revoke Key">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
      
      {keys.length > 0 && (
        <div className="p-6 bg-stone-900/30 border border-stone-800/50 rounded-xl mt-8">
          <h4 className="text-sm font-bold text-white mb-2">Integration Snippet</h4>
          <p className="text-sm text-stone-400 mb-4">Update your SDK base URL to proxy traffic through Zyra.</p>
          <pre className="p-4 bg-stone-950 rounded-lg border border-stone-800 overflow-x-auto">
            <code className="text-xs font-mono text-stone-300">
              <span className="text-stone-500">// Example using OpenAI Python SDK</span><br/>
              import openai<br/><br/>
              client = openai.Client(<br/>
              &nbsp;&nbsp;api_key="your_openai_key",<br/>
              &nbsp;&nbsp;<span className="text-green-400">base_url="https://api.zyra.dev/v1/proxy/openai"</span>,<br/>
              &nbsp;&nbsp;<span className="text-green-400">default_headers={"X-Zyra-Api-Key": "{keys.find(k => k.isActive !== false)?.prefix || 'sk-live-'}••••••••••••••••"}</span><br/>
              )
            </code>
          </pre>
        </div>
      )}

      {/* Modal for Creating Key */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => !generatedKey && setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0A0A0A] border border-stone-800 shadow-2xl rounded-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-stone-800/60 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Generate API Key</h3>
                {!generatedKey && (
                  <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="p-6">
                {!generatedKey ? (
                  <form onSubmit={handleCreateKey} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1.5">Key Name</label>
                      <input 
                        type="text" 
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        placeholder="e.g. Production Traffic"
                        required
                        autoFocus
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-colors"
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-white text-black font-bold rounded-xl mt-4 hover:bg-stone-200 transition-colors">
                      Generate
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm leading-relaxed">
                      <strong>Success!</strong> Your API key has been generated. Please copy it now as you will <strong>never</strong> be able to view it again.
                    </div>
                    <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg overflow-hidden p-2">
                      <code className="flex-1 px-2 text-stone-200 font-mono text-sm break-all">{generatedKey}</code>
                      <button 
                        onClick={() => copyToClipboard(generatedKey)}
                        className="p-2 bg-stone-800 hover:bg-stone-700 text-white rounded-md transition-colors shadow-sm"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        setGeneratedKey(null)
                        setShowModal(false)
                      }} 
                      className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl mt-4 hover:bg-stone-700 transition-colors border border-stone-700"
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
