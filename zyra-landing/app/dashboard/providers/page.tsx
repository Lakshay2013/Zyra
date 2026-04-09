'use client'

import { useState, useEffect } from "react"
import api from "@/lib/api"

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showKeyModal, setShowKeyModal] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await api.get('/api/org/providers')
        setProviders(res.data)
      } catch (err) {
        console.error('Failed to load providers', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProviders()
  }, [])

  const handleSaveKey = async (provider: string) => {
    try {
      await api.post('/api/org/providers', { provider, apiKey: keyInput })
      setShowKeyModal(null)
      setKeyInput('')
      // Refresh
      const res = await api.get('/api/org/providers')
      setProviders(res.data)
    } catch (err) {
      console.error('Failed to save provider key', err)
    }
  }

  if (loading) {
    return (
      <div className="flex gap-3 items-center justify-center min-h-[50vh]" style={{ color: '#ffa69e' }}>
        <span className="material-symbols-outlined animate-pulse">dns</span>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>Loading Provider Mesh...</span>
      </div>
    )
  }

  const providerList = [
    { id: 'openai', name: 'OPENAI', model: 'GPT-4O / GPT-4O-MINI', icon: 'smart_toy', configured: providers?.openai },
    { id: 'anthropic', name: 'ANTHROPIC', model: 'CLAUDE-3-SONNET / HAIKU', icon: 'psychology', configured: providers?.anthropic },
    { id: 'groq', name: 'GROQ', model: 'LLAMA-3.3-70B / MIXTRAL', icon: 'bolt', configured: providers?.groq },
    { id: 'gemini', name: 'GOOGLE_GEMINI', model: 'GEMINI-1.5-FLASH / PRO', icon: 'auto_awesome', configured: providers?.gemini },
  ]

  const configuredCount = providerList.filter(p => p.configured).length

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
        <div>
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#e5e2e3', lineHeight: 1 }}>
            INFRASTRUCTURE
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-2 px-3 py-1" style={{ background: 'rgba(155,232,203,0.1)', borderRadius: 99, border: '1px solid rgba(155,232,203,0.2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9be8cb' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9be8cb' }}>Systems Operational</span>
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#71717a' }}>
              PROVIDERS: {configuredCount}/{providerList.length} // FALLBACK_CHAIN: {configuredCount} DEEP
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button style={{
            background: '#2a2a2b', padding: '8px 16px', borderRadius: 12,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#e5e2e3', border: '1px solid rgba(83,67,65,0.15)'
          }}>Export Report</button>
          <button style={{
            background: '#ffa69e', padding: '8px 16px', borderRadius: 12,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#3b0908'
          }}>Test All</button>
        </div>
      </div>

      {/* ── METRIC STRIP ── */}
      <div className="flex items-center gap-8 mt-6 p-4 flex-wrap" style={{ background: '#1c1b1c', borderRadius: 12 }}>
        <div className="flex flex-col">
          <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>Provider</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#e5e2e3' }}>ALL_PROVIDERS</span>
        </div>
        <div className="flex flex-col">
          <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>Region</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#e5e2e3' }}>GLOBAL_VIEW</span>
        </div>
        <div className="flex flex-col">
          <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>Environment</span>
          <div className="flex gap-2">
            <span style={{ background: '#ffa69e', color: '#3b0908', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, letterSpacing: '0.1em' }}>PROD</span>
            <span style={{ background: '#353436', color: '#a1a1aa', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, letterSpacing: '0.1em' }}>STAGING</span>
          </div>
        </div>
      </div>

      {/* ── PROVIDER TABLE ── */}
      <div className="mt-6 overflow-hidden" style={{ background: '#1c1b1c', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
          {['Service Name', 'Model Range', 'Region', 'Status', ''].map((h, i) => (
            <div key={h} className={i === 0 ? 'col-span-3' : i === 4 ? 'col-span-2' : 'col-span-2'} style={{
              fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase'
            }}>{h}</div>
          ))}
        </div>

        {/* Provider Rows */}
        {providerList.map((p, i) => (
          <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center transition-colors hover:bg-[#201f20]" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
            <div className="col-span-3 flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: p.configured ? '#ffa69e' : '#534341' }}>{p.icon}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: '#e5e2e3' }}>{p.name.toLowerCase().replace('_', '-')}</span>
            </div>
            <div className="col-span-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#a1a1aa' }}>{p.model}</div>
            <div className="col-span-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#71717a' }}>global</div>
            <div className="col-span-3 flex items-center gap-2">
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: p.configured ? '#9be8cb' : '#71717a'
              }}>
                {p.configured ? 'OPERATIONAL' : 'NOT CONFIGURED'}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.configured ? '#9be8cb' : '#534341' }} />
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => setShowKeyModal(p.id)}
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#ffa69e', background: 'rgba(255,166,158,0.1)', padding: '6px 12px', borderRadius: 8,
                  border: '1px solid rgba(255,166,158,0.2)'
                }}
              >
                {p.configured ? 'Update' : 'Configure'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── FALLBACK ORDER ── */}
      <div className="mt-6" style={{ background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
        <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
          <h3 style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#e5e2e3', textTransform: 'uppercase' }}>Fallback_Order</h3>
          <span style={{ fontSize: 10, color: '#71717a', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>Drag to reorder</span>
        </div>
        {providerList.filter(p => p.configured).map((p, i) => (
          <div key={p.id} className="px-6 py-4 flex items-center gap-4 transition-colors hover:bg-[#2a2a2b]" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 900, color: '#353436', width: 40 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="material-symbols-outlined" style={{ color: '#534341', fontSize: 18, cursor: 'grab' }}>drag_indicator</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#e5e2e3', flex: 1 }}>{p.name}</span>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 6,
              background: i === 0 ? 'rgba(255,166,158,0.15)' : '#353436',
              color: i === 0 ? '#ffa69e' : '#71717a'
            }}>
              {i === 0 ? 'PRIMARY' : 'FALLBACK'}
            </span>
          </div>
        ))}
        {providerList.filter(p => p.configured).length === 0 && (
          <div className="px-6 py-8 text-center">
            <p style={{ fontSize: 13, color: '#534341' }}>No providers configured. Add provider keys above to enable routing.</p>
          </div>
        )}
      </div>

      {/* ── KEY MODAL ── */}
      {showKeyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md p-6" style={{ background: '#201f20', borderRadius: 16, border: '1px solid rgba(83,67,65,0.2)' }}>
            <h3 style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, color: '#ffa69e', textTransform: 'uppercase', marginBottom: 16 }}>
              Configure {showKeyModal.toUpperCase()}
            </h3>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste your API key..."
              style={{
                width: '100%', background: '#0e0e0f', border: 'none', outline: 'none',
                color: '#e5e2e3', fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                padding: '12px 16px', borderRadius: 8, marginBottom: 16,
              }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowKeyModal(null); setKeyInput('') }}
                style={{ fontSize: 10, fontWeight: 700, color: '#71717a', padding: '8px 16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >Cancel</button>
              <button
                onClick={() => handleSaveKey(showKeyModal)}
                style={{
                  background: '#ffa69e', color: '#3b0908', padding: '8px 20px', borderRadius: 8,
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase'
                }}
              >Save Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
