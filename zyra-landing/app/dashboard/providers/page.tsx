'use client'

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import toast from "react-hot-toast"

type TestResult = { provider: string; ok: boolean; status: number | null; latencyMs: number; error: string | null }

const PROVIDER_META = [
  { id: 'openai', name: 'openai', model: 'GPT-4O / GPT-4O-MINI', icon: 'smart_toy' },
  { id: 'anthropic', name: 'anthropic', model: 'CLAUDE-SONNET-4-6 / HAIKU-4-5', icon: 'psychology' },
  { id: 'groq', name: 'groq', model: 'LLAMA-3.3-70B / LLAMA-3.1-8B', icon: 'bolt' },
  { id: 'gemini', name: 'google-gemini', model: 'GEMINI-2.0-FLASH / 1.5-PRO', icon: 'auto_awesome' },
]
const PROVIDER_IDS = ['openai', 'anthropic', 'groq', 'gemini']

export default function ProvidersPage() {
  const [configured, setConfigured] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [showKeyModal, setShowKeyModal] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState('')

  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<Record<string, TestResult>>({})

  const [fallbackOrder, setFallbackOrder] = useState<string[]>([])
  const [fallbackDirty, setFallbackDirty] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  const load = useCallback(async () => {
    try {
      const [prov, rel] = await Promise.all([
        api.get('/api/org/providers'),
        api.get('/api/org/reliability'),
      ])
      setConfigured(prov.data.configured || {})
      const savedOrder: string[] = rel.data.reliability?.fallbackOrder || []
      // Ensure every provider appears exactly once: saved order first, then the rest.
      const merged = [...savedOrder.filter((p) => PROVIDER_IDS.includes(p)), ...PROVIDER_IDS.filter((p) => !savedOrder.includes(p))]
      setFallbackOrder(merged)
    } catch (err) {
      console.error('Failed to load providers', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaveKey = async (provider: string) => {
    const toastId = toast.loading('Saving key securely...')
    try {
      await api.put('/api/org/providers', { [provider]: keyInput })
      setShowKeyModal(null)
      setKeyInput('')
      await load()
      toast.success('Key connected. Run "Test All" to verify it works.', { id: toastId })
    } catch (err) {
      console.error('Failed to save provider key', err)
      toast.error('Save failed', { id: toastId })
    }
  }

  const handleRemoveKey = async (provider: string) => {
    const toastId = toast.loading('Removing key...')
    try {
      await api.put('/api/org/providers', { [provider]: '' })
      setShowKeyModal(null)
      setKeyInput('')
      setResults((r) => { const n = { ...r }; delete n[provider]; return n })
      await load()
      toast.success('Key removed', { id: toastId })
    } catch {
      toast.error('Failed to remove key', { id: toastId })
    }
  }

  const runTests = async () => {
    if (testing) return
    setTesting(true)
    setResults({})
    const toastId = toast.loading('Testing configured providers...')
    try {
      const res = await api.post('/api/org/providers/test')
      const byId: Record<string, TestResult> = {}
      for (const r of res.data.results as TestResult[]) byId[r.provider] = r
      setResults(byId)
      const { passed, tested } = res.data.summary
      if (tested === 0) toast('No providers configured to test.', { id: toastId, icon: 'ℹ️' })
      else if (passed === tested) toast.success(`All ${tested} provider(s) connected`, { id: toastId })
      else toast.error(`${passed}/${tested} providers connected`, { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Provider test failed', { id: toastId })
    } finally {
      setTesting(false)
    }
  }

  const moveFallback = (index: number, dir: -1 | 1) => {
    setFallbackOrder((order) => {
      const next = [...order]
      const target = index + dir
      if (target < 0 || target >= next.length) return order
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setFallbackDirty(true)
  }

  const saveFallbackOrder = async () => {
    setSavingOrder(true)
    try {
      await api.put('/api/org/reliability', { fallbackOrder })
      setFallbackDirty(false)
      toast.success('Fallback order saved')
    } catch {
      toast.error('Failed to save fallback order')
    } finally {
      setSavingOrder(false)
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

  const providerList = PROVIDER_META.map((p) => ({ ...p, configured: !!configured[p.id] }))
  const configuredCount = providerList.filter((p) => p.configured).length

  const statusLabel = (p: { id: string; configured: boolean }) => {
    if (!p.configured) return { text: 'NOT CONFIGURED', color: '#71717a', dot: '#534341' }
    const r = results[p.id]
    if (!r) return { text: 'CONFIGURED', color: '#a1a1aa', dot: '#a1a1aa' }
    if (r.ok) return { text: `CONNECTED · ${r.latencyMs}MS`, color: '#9be8cb', dot: '#9be8cb' }
    return { text: 'FAILED', color: '#ffb4ab', dot: '#ffb4ab' }
  }

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
        <div>
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#e5e2e3', lineHeight: 1 }}>
            INFRASTRUCTURE
          </h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="flex items-center gap-2 px-3 py-1" style={{ background: 'rgba(155,232,203,0.1)', borderRadius: 99, border: '1px solid rgba(155,232,203,0.2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9be8cb' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9be8cb' }}>
                {configuredCount > 0 ? `${configuredCount} Provider${configuredCount > 1 ? 's' : ''} Configured` : 'No Providers Yet'}
              </span>
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#71717a' }}>
              PROVIDERS: {configuredCount}/{providerList.length} {'//'} FALLBACK_CHAIN: {fallbackOrder.filter((p) => configured[p]).length} DEEP
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runTests}
            disabled={testing || configuredCount === 0}
            style={{
              background: '#ffa69e', padding: '8px 16px', borderRadius: 12,
              cursor: testing || configuredCount === 0 ? 'not-allowed' : 'pointer', opacity: testing || configuredCount === 0 ? 0.5 : 1,
              fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3b0908',
            }}
          >{testing ? 'Testing…' : 'Test All'}</button>
        </div>
      </div>

      {/* ── PROVIDER TABLE ── */}
      <div className="mt-6 overflow-hidden" style={{ background: '#1c1b1c', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
        <div className="grid grid-cols-12 gap-4 px-6 py-3" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
          {['Service', 'Model Range', 'Status', ''].map((h, i) => (
            <div key={h} className={i === 0 ? 'col-span-3' : i === 1 ? 'col-span-4' : i === 2 ? 'col-span-3' : 'col-span-2'} style={{
              fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase'
            }}>{h}</div>
          ))}
        </div>

        {providerList.map((p) => {
          const s = statusLabel(p)
          const r = results[p.id]
          return (
            <div key={p.id} className="px-6 py-5" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3 flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: p.configured ? '#ffa69e' : '#534341' }}>{p.icon}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: '#e5e2e3' }}>{p.name}</span>
                </div>
                <div className="col-span-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#a1a1aa' }}>{p.model}</div>
                <div className="col-span-3 flex items-center gap-2">
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color }}>{s.text}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => { setShowKeyModal(p.id); setKeyInput('') }}
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: '#ffa69e', background: 'rgba(255,166,158,0.1)', padding: '6px 12px', borderRadius: 8,
                      border: '1px solid rgba(255,166,158,0.2)'
                    }}
                  >{p.configured ? 'Update' : 'Configure'}</button>
                </div>
              </div>
              {r && !r.ok && r.error && r.error !== 'not configured' && (
                <div className="mt-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#ffb4ab', paddingLeft: 30 }}>
                  ↳ {r.error}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── FALLBACK ORDER ── */}
      <div className="mt-6" style={{ background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
        <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
          <h3 style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#e5e2e3', textTransform: 'uppercase' }}>Fallback_Order</h3>
          <button
            onClick={saveFallbackOrder}
            disabled={!fallbackDirty || savingOrder}
            style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: fallbackDirty ? '#3b0908' : '#71717a', background: fallbackDirty ? '#ffa69e' : '#2a2a2b',
              padding: '6px 14px', borderRadius: 8, cursor: fallbackDirty ? 'pointer' : 'default',
            }}
          >{savingOrder ? 'Saving…' : 'Save Order'}</button>
        </div>
        {fallbackOrder.map((pid, i) => {
          const meta = PROVIDER_META.find((m) => m.id === pid)!
          const isConfigured = !!configured[pid]
          return (
            <div key={pid} className="px-6 py-4 flex items-center gap-4" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)', opacity: isConfigured ? 1 : 0.45 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 900, color: '#353436', width: 32 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#e5e2e3', flex: 1 }}>{meta.name}</span>
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 6,
                background: !isConfigured ? '#2a2a2b' : i === 0 ? 'rgba(255,166,158,0.15)' : '#353436',
                color: !isConfigured ? '#71717a' : i === 0 ? '#ffa69e' : '#71717a',
              }}>
                {!isConfigured ? 'NO KEY' : i === 0 ? 'PRIMARY' : 'FALLBACK'}
              </span>
              <div className="flex gap-1">
                <button onClick={() => moveFallback(i, -1)} disabled={i === 0} className="p-1" style={{ color: i === 0 ? '#3f3f46' : '#a1a1aa', cursor: i === 0 ? 'default' : 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_upward</span>
                </button>
                <button onClick={() => moveFallback(i, 1)} disabled={i === fallbackOrder.length - 1} className="p-1" style={{ color: i === fallbackOrder.length - 1 ? '#3f3f46' : '#a1a1aa', cursor: i === fallbackOrder.length - 1 ? 'default' : 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_downward</span>
                </button>
              </div>
            </div>
          )
        })}
        <div className="px-6 py-3" style={{ fontSize: 11, color: '#71717a' }}>
          When a provider fails after its retries, Zyra tries the next configured provider in this order.
        </div>
      </div>

      {/* ── KEY MODAL ── */}
      {showKeyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md p-6" style={{ background: '#201f20', borderRadius: 16, border: '1px solid rgba(83,67,65,0.2)' }}>
            <h3 style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, color: '#ffa69e', textTransform: 'uppercase', marginBottom: 16 }}>
              Configure {showKeyModal}
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
            <div className="flex gap-3 justify-between">
              {configured[showKeyModal] ? (
                <button onClick={() => handleRemoveKey(showKeyModal)} style={{ fontSize: 10, fontWeight: 700, color: '#ffb4ab', padding: '8px 12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Remove</button>
              ) : <span />}
              <div className="flex gap-3">
                <button onClick={() => { setShowKeyModal(null); setKeyInput('') }} style={{ fontSize: 10, fontWeight: 700, color: '#71717a', padding: '8px 16px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cancel</button>
                <button
                  onClick={() => handleSaveKey(showKeyModal)}
                  disabled={!keyInput.trim()}
                  style={{ background: '#ffa69e', color: '#3b0908', padding: '8px 20px', borderRadius: 8, fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: keyInput.trim() ? 1 : 0.5 }}
                >Save Key</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
