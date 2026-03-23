'use client'

import { useState, useEffect } from "react"
import { Save, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"

export default function ProvidersPage() {
  const [configured, setConfigured] = useState<Record<string, boolean>>({
    openai: false, anthropic: false, gemini: false, groq: false
  })
  const [keys, setKeys] = useState({ openai: '', anthropic: '', gemini: '', groq: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  async function fetchProviders() {
    try {
      const res = await api.get('/api/org/providers')
      setConfigured(res.data.configured || {})
    } catch (err) {
      console.error("Failed to load providers", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(provider: string) {
    if (!keys[provider as keyof typeof keys]) return
    setSaving(true)
    try {
      await api.put('/api/org/providers', { [provider]: keys[provider as keyof typeof keys] })
      setKeys(prev => ({ ...prev, [provider]: '' }))
      fetchProviders()
    } catch (err) {
      alert("Failed to save provider key")
    } finally {
      setSaving(false)
    }
  }

  const providersList = [
    { id: 'openai', name: 'OpenAI', icon: '🤖', description: 'Used for GPT-4, GPT-3.5 models' },
    { id: 'anthropic', name: 'Anthropic', icon: '🧠', description: 'Used for Claude 3 Opus, Sonnet, Haiku' },
    { id: 'gemini', name: 'Google Gemini', icon: '✨', description: 'Used for Gemini 1.5 Pro and Flash' },
    { id: 'groq', name: 'Groq', icon: '⚡', description: 'Used for high-speed Llama 3 models' },
  ]

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 font-body">
      <div>
        <h1 className="text-[32px] font-headline font-bold text-[#032416] mb-2 tracking-tight">AI Providers</h1>
        <p className="text-[#424843] font-medium text-sm">Configure your Bring-Your-Own-Key (BYOK) settings. Keys are securely encrypted.</p>
      </div>

      <div className="space-y-4">
        {providersList.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-[#f1eedf] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-[#fdfaea] flex items-center justify-center text-2xl border border-[#f1eedf]">
                {p.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#032416] flex items-center gap-2">
                  {p.name}
                  {configured[p.id] && <CheckCircle2 className="w-[18px] h-[18px] text-[#2e7d32]" />}
                </h3>
                <p className="text-sm text-[#424843] font-medium">{p.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <input 
                type="password"
                placeholder={configured[p.id] ? "•••••••••••••••• (Configured)" : "Enter API Key"}
                value={keys[p.id as keyof typeof keys]}
                onChange={e => setKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                className="flex-1 md:w-64 bg-[#fdfaea] border border-[#f1eedf] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#5e51ad] text-[#032416]"
              />
              <button 
                onClick={() => handleSave(p.id)}
                disabled={saving || !keys[p.id as keyof typeof keys]}
                className="px-4 py-2.5 bg-[#1a3a2a] text-white rounded-xl text-sm font-bold hover:bg-[#032416] disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0 shadow-sm"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
