'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, KeyRound, Copy } from 'lucide-react'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Metric } from '@/components/ui/metric'
import { Badge } from '@/components/ui/badge'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState, LoadingScreen } from '@/components/ui/empty-state'
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/table'

export default function ApiKeys() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  useEffect(() => { fetchKeys() }, [])

  async function fetchKeys() {
    try {
      const res = await api.get('/api/keys')
      setKeys(res.data.keys || [])
    } catch (err) {
      console.error('Failed to load keys', err)
    } finally { setLoading(false) }
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName) return
    try {
      const res = await api.post('/api/keys', { name: newKeyName })
      setGeneratedKey(res.data.key)
      setNewKeyName('')
      fetchKeys()
    } catch (err) {
      console.error('Failed to create key', err)
      toast.error('Failed to create key.')
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm('Are you sure you want to revoke this key? Traffic using it will immediately fail.')) return
    try {
      await api.delete(`/api/keys/${id}`)
      fetchKeys()
      toast.success('Key revoked successfully')
    } catch (err) {
      console.error('Failed to delete key', err)
      toast.error('Failed to revoke key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const activeCount = keys.filter((k) => k.isActive !== false).length

  return (
    <div>
      <PageHeader
        title="API Keys"
        subtitle={`Proxy authentication — ${activeCount} active`}
        right={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={15} className="mr-1.5" /> Create new key
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-8">
        <Metric label="Total keys" value={keys.length} />
        <Metric label="Active" value={activeCount} tone="success" />
        <Metric label="Revoked" value={keys.filter((k) => k.isActive === false).length} />
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <LoadingScreen label="Loading keys" />
        ) : keys.length === 0 ? (
          <EmptyState icon={KeyRound} title="No API keys created yet" sub="Create a key to authenticate SDK requests to Zyra." />
        ) : (
          <Table>
            <THead>
              <tr><TH>Name</TH><TH>Prefix</TH><TH>Created by</TH><TH>Status</TH><TH /></tr>
            </THead>
            <TBody>
              {keys.map((key) => (
                <TR key={key._id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <KeyRound size={15} className={key.isActive !== false ? 'text-accent' : 'text-text-tertiary'} />
                      <span className={`font-medium ${key.isActive === false ? 'text-text-tertiary line-through' : 'text-text'}`}>{key.name || 'Unnamed key'}</span>
                    </div>
                  </TD>
                  <TD><code className="rounded-[var(--radius-sm)] bg-bg-subtle px-2 py-1 font-mono text-[12px] text-text-secondary">{key.prefix}••••••</code></TD>
                  <TD className="text-text-tertiary">{key.createdBy?.name || 'Admin'}</TD>
                  <TD><Badge tone={key.isActive !== false ? 'success' : 'danger'}>{key.isActive !== false ? 'Active' : 'Revoked'}</Badge></TD>
                  <TD align="right">
                    {key.isActive !== false && (
                      <Button variant="outline" size="sm" onClick={() => handleRevokeKey(key._id)} className="text-danger hover:bg-[var(--color-danger-subtle)]">
                        Revoke
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="create-key-title">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-6 shadow-[var(--shadow-lg)]"
            >
              <h3 id="create-key-title" className="type-h2 mb-4 text-text">
                {generatedKey ? 'Key generated successfully' : 'Generate API key'}
              </h3>

              {!generatedKey ? (
                <form onSubmit={handleCreateKey}>
                  <Label htmlFor="key-name-input">Key name</Label>
                  <Input id="key-name-input" type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production traffic" required autoFocus className="mb-4" />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => { setShowModal(false); setNewKeyName('') }}>Cancel</Button>
                    <Button type="submit">Create key</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[var(--radius-sm)] border border-[var(--color-success-subtle)] bg-[var(--color-success-subtle)] p-3">
                    <p className="text-[13px] leading-relaxed text-success">
                      <strong>Copy this key now.</strong> You will not be able to view it again after closing this dialog.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-bg-subtle p-3">
                    <code className="flex-1 select-all break-all font-mono text-[12px] text-text">{generatedKey}</code>
                    <button onClick={() => copyToClipboard(generatedKey)} className="press-feedback shrink-0 rounded-[var(--radius-sm)] p-2 text-accent transition-colors hover:bg-bg-elevated" aria-label="Copy key">
                      <Copy size={16} />
                    </button>
                  </div>
                  <Button variant="secondary" className="w-full" onClick={() => { setGeneratedKey(null); setShowModal(false) }}>
                    I have saved it
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
