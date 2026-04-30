'use client'

import { useState, useEffect } from "react"
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
      toast.success('Key revoked successfully')
    } catch (err) {
      console.error("Failed to delete key", err)
      toast.error('Failed to revoke key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const cardStyle: React.CSSProperties = {
    background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)',
  }

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
        <div>
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#e5e2e3', lineHeight: 1 }}>
            API_KEYS
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#71717a', marginTop: 8 }}>
            PROXY_AUTHENTICATION // KEYS: <span style={{ color: '#9be8cb' }}>{keys.filter(k => k.isActive !== false).length} ACTIVE</span>
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{
            background: '#ffa69e', padding: '8px 20px', borderRadius: 12, cursor: 'pointer',
            fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#3b0908', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Create New Key
        </button>
      </div>

      {/* ── METRIC STRIP ── */}
      <div className="flex items-center gap-8 mt-6 p-4 flex-wrap" style={{ background: '#1c1b1c', borderRadius: 12 }}>
        {[
          { label: 'Total Keys', value: `${keys.length}` },
          { label: 'Active', value: `${keys.filter(k => k.isActive !== false).length}`, accent: true },
          { label: 'Revoked', value: `${keys.filter(k => k.isActive === false).length}` },
        ].map((m, i) => (
          <div key={i} className="flex flex-col">
            <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: m.accent ? '#9be8cb' : '#e5e2e3' }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* ── KEY TABLE ── */}
      <div className="mt-6 overflow-hidden" style={{ ...cardStyle }}>
        {loading ? (
          <div className="flex gap-3 items-center justify-center py-20" style={{ color: '#ffa69e' }}>
            <span className="material-symbols-outlined animate-pulse">vpn_key</span>
            <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>Loading keys...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#353436' }}>vpn_key</span>
            <p style={{ fontSize: 14, color: '#534341', marginTop: 12 }}>No API keys created yet.</p>
            <p style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>Create a key to authenticate SDK requests to Zyra.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)', background: '#1c1b1c' }}>
              {['Name', 'Prefix', 'Created', 'Status', ''].map((h, i) => (
                <div key={h || 'actions'} className={i === 0 ? 'col-span-3' : i === 4 ? 'col-span-2' : 'col-span-2'} style={{
                  fontSize: 10, letterSpacing: '0.15em', fontWeight: 700, color: '#71717a', textTransform: 'uppercase'
                }}>{h}</div>
              ))}
            </div>

            {/* Key Rows */}
            {keys.map((key) => (
              <div key={key._id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center transition-colors hover:bg-[#2a2a2b]" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
                <div className="col-span-3 flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: key.isActive !== false ? '#ffa69e' : '#534341' }}>vpn_key</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600,
                    color: key.isActive !== false ? '#e5e2e3' : '#71717a',
                    textDecoration: key.isActive === false ? 'line-through' : 'none',
                  }}>{key.name || "Unnamed Key"}</span>
                </div>
                <div className="col-span-2">
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                    background: '#131314', padding: '4px 8px', borderRadius: 6,
                    color: '#a1a1aa', border: '1px solid rgba(83,67,65,0.1)',
                  }}>{key.prefix}••••••</span>
                </div>
                <div className="col-span-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#71717a' }}>
                  {key.createdBy?.name || 'Admin'}
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: key.isActive !== false ? '#9be8cb' : '#ffb4ab'
                  }}>
                    {key.isActive !== false ? 'ACTIVE' : 'REVOKED'}
                  </span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: key.isActive !== false ? '#9be8cb' : '#ffb4ab' }} />
                </div>
                <div className="col-span-2 flex justify-end">
                  {key.isActive !== false && (
                    <button
                      onClick={() => handleRevokeKey(key._id)}
                      style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: '#ffb4ab', background: 'rgba(255,180,171,0.1)', padding: '6px 12px', borderRadius: 8,
                        border: '1px solid rgba(255,180,171,0.2)',
                      }}
                    >Revoke</button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── CREATE KEY MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="create-key-title" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md p-6" style={{ background: '#201f20', borderRadius: 16, border: '1px solid rgba(83,67,65,0.2)' }}>
            <h3 id="create-key-title" style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, color: '#ffa69e', textTransform: 'uppercase', marginBottom: 16 }}>
              {generatedKey ? 'Key Generated Successfully' : 'Generate API Key'}
            </h3>

            {!generatedKey ? (
              <form onSubmit={handleCreateKey}>
                <label htmlFor="key-name-input" style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Key Name</label>
                <input
                  id="key-name-input"
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Traffic"
                  required
                  autoFocus
                  style={{
                    width: '100%', background: '#0e0e0f', border: 'none', outline: 'none',
                    color: '#e5e2e3', fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                    padding: '12px 16px', borderRadius: 8, marginBottom: 16,
                  }}
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setNewKeyName('') }}
                    style={{ fontSize: 10, fontWeight: 700, color: '#71717a', padding: '8px 16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  >Cancel</button>
                  <button
                    type="submit"
                    style={{
                      background: '#ffa69e', color: '#3b0908', padding: '8px 20px', borderRadius: 8,
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase'
                    }}
                  >Create Key</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3" style={{ background: 'rgba(155,232,203,0.08)', border: '1px solid rgba(155,232,203,0.2)', borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: '#9be8cb', lineHeight: 1.5 }}>
                    <strong>Copy this key now.</strong> You will not be able to view it again after closing this dialog.
                  </p>
                </div>
                <div className="flex items-center gap-2 p-3" style={{ background: '#131314', borderRadius: 8 }}>
                  <code className="flex-1 break-all select-all" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#e5e2e3' }}>
                    {generatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="shrink-0 p-2 transition-colors hover:bg-[#2a2a2b]"
                    style={{ borderRadius: 6, color: '#ffa69e' }}
                    aria-label="Copy key"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
                  </button>
                </div>
                <button
                  onClick={() => { setGeneratedKey(null); setShowModal(false) }}
                  className="w-full py-3"
                  style={{
                    background: '#2a2a2b', color: '#e5e2e3', borderRadius: 8,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: '1px solid rgba(83,67,65,0.15)',
                  }}
                >I Have Saved It</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
