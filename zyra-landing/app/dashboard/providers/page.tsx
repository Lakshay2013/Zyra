'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Brain, Zap, Sparkles, ArrowUp, ArrowDown } from 'lucide-react'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'

type TestResult = { provider: string; ok: boolean; status: number | null; latencyMs: number; error: string | null }

const PROVIDER_META = [
  { id: 'openai', name: 'OpenAI', model: 'GPT-4o / GPT-4o-mini', icon: Bot },
  { id: 'anthropic', name: 'Anthropic', model: 'Claude Sonnet 4.6 / Haiku 4.5', icon: Brain },
  { id: 'groq', name: 'Groq', model: 'Llama 3.3 70B / 3.1 8B', icon: Zap },
  { id: 'gemini', name: 'Google Gemini', model: 'Gemini 2.0 Flash / 1.5 Pro', icon: Sparkles },
]
const PROVIDER_IDS = PROVIDER_META.map((p) => p.id)

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
      const merged = [...savedOrder.filter((p) => PROVIDER_IDS.includes(p)), ...PROVIDER_IDS.filter((p) => !savedOrder.includes(p))]
      setFallbackOrder(merged)
    } catch (err) {
      console.error('Failed to load providers', err)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaveKey = async (provider: string) => {
    const toastId = toast.loading('Saving key securely...')
    try {
      await api.put('/api/org/providers', { [provider]: keyInput })
      setShowKeyModal(null); setKeyInput('')
      await load()
      toast.success('Key connected. Run "Test all" to verify it works.', { id: toastId })
    } catch (err) {
      console.error('Failed to save provider key', err)
      toast.error('Save failed', { id: toastId })
    }
  }

  const handleRemoveKey = async (provider: string) => {
    const toastId = toast.loading('Removing key...')
    try {
      await api.put('/api/org/providers', { [provider]: '' })
      setShowKeyModal(null); setKeyInput('')
      setResults((r) => { const n = { ...r }; delete n[provider]; return n })
      await load()
      toast.success('Key removed', { id: toastId })
    } catch {
      toast.error('Failed to remove key', { id: toastId })
    }
  }

  const runTests = async () => {
    if (testing) return
    setTesting(true); setResults({})
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
    } finally { setTesting(false) }
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
    } finally { setSavingOrder(false) }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-text-tertiary"><span className="type-meta">Loading providers…</span></div>
  }

  const providerList = PROVIDER_META.map((p) => ({ ...p, configured: !!configured[p.id] }))
  const configuredCount = providerList.filter((p) => p.configured).length

  const statusOf = (p: { id: string; configured: boolean }) => {
    if (!p.configured) return { text: 'Not configured', tone: 'neutral' as const }
    const r = results[p.id]
    if (!r) return { text: 'Configured', tone: 'neutral' as const }
    if (r.ok) return { text: `Connected · ${r.latencyMs}ms`, tone: 'success' as const }
    return { text: 'Failed', tone: 'danger' as const }
  }

  return (
    <div>
      <PageHeader
        title="Providers"
        subtitle={`${configuredCount}/${providerList.length} configured · fallback chain ${fallbackOrder.filter((p) => configured[p]).length} deep`}
        right={
          <Button onClick={runTests} disabled={testing || configuredCount === 0}>
            {testing ? 'Testing…' : 'Test all'}
          </Button>
        }
      />

      <Card padding="none" className="overflow-hidden">
        {providerList.map((p) => {
          const s = statusOf(p)
          const r = results[p.id]
          const Icon = p.icon
          return (
            <div key={p.id} className="border-b border-border px-6 py-4 last:border-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Icon size={18} className={p.configured ? 'text-accent' : 'text-text-tertiary'} strokeWidth={1.75} />
                  <div>
                    <div className="text-[14px] font-medium text-text">{p.name}</div>
                    <div className="text-[12px] text-text-tertiary">{p.model}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={s.tone}>{s.text}</Badge>
                  <Button variant="outline" size="sm" onClick={() => { setShowKeyModal(p.id); setKeyInput('') }}>
                    {p.configured ? 'Update' : 'Configure'}
                  </Button>
                </div>
              </div>
              {r && !r.ok && r.error && r.error !== 'not configured' && (
                <div className="mt-2 pl-8 font-mono text-[12px] text-danger">↳ {r.error}</div>
              )}
            </div>
          )
        })}
      </Card>

      {/* ── FALLBACK ORDER ── */}
      <Card padding="none" className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="type-h3 text-text">Fallback order</h3>
          <Button size="sm" disabled={!fallbackDirty || savingOrder} onClick={saveFallbackOrder}>
            {savingOrder ? 'Saving…' : 'Save order'}
          </Button>
        </div>
        {fallbackOrder.map((pid, i) => {
          const meta = PROVIDER_META.find((m) => m.id === pid)!
          const isConfigured = !!configured[pid]
          return (
            <div key={pid} className="flex items-center gap-4 border-b border-border px-6 py-3.5 last:border-0" style={{ opacity: isConfigured ? 1 : 0.45 }}>
              <span className="w-7 font-mono text-[13px] font-semibold text-text-tertiary">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-[13px] font-medium text-text">{meta.name}</span>
              <Badge tone={!isConfigured ? 'neutral' : i === 0 ? 'accent' : 'neutral'}>
                {!isConfigured ? 'No key' : i === 0 ? 'Primary' : 'Fallback'}
              </Badge>
              <div className="flex gap-1">
                <IconButton onClick={() => moveFallback(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={15} /></IconButton>
                <IconButton onClick={() => moveFallback(i, 1)} disabled={i === fallbackOrder.length - 1} aria-label="Move down"><ArrowDown size={15} /></IconButton>
              </div>
            </div>
          )
        })}
        <div className="px-6 py-3 text-[12px] text-text-tertiary">
          When a provider fails after its retries, Zyra tries the next configured provider in this order.
        </div>
      </Card>

      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowKeyModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-6 shadow-[var(--shadow-lg)]"
            >
              <h3 className="type-h2 mb-4 text-text">Configure {PROVIDER_META.find((p) => p.id === showKeyModal)?.name}</h3>
              <Input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Paste your API key…" className="mb-4" autoFocus />
              <div className="flex items-center justify-between">
                {configured[showKeyModal] ? (
                  <Button variant="ghost" className="text-danger hover:bg-[var(--color-danger-subtle)]" onClick={() => handleRemoveKey(showKeyModal)}>Remove</Button>
                ) : <span />}
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { setShowKeyModal(null); setKeyInput('') }}>Cancel</Button>
                  <Button disabled={!keyInput.trim()} onClick={() => handleSaveKey(showKeyModal)}>Save key</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
