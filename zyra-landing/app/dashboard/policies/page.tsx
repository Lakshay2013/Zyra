'use client'

import { useState, useEffect } from "react"
import { Shield, Save } from "lucide-react"
import api from "@/lib/api"

export default function PoliciesPage() {
  const [policies, setPolicies] = useState({ blockPII: false, blockInjection: true, maxTokensPerRequest: 2000 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPolicies()
  }, [])

  async function fetchPolicies() {
    try {
      const res = await api.get('/api/org/policies')
      if (res.data.policies) setPolicies(res.data.policies)
    } catch (err) {
      console.error("Failed to load policies", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.put('/api/org/policies', policies)
      alert("Policies updated successfully!")
    } catch (err) {
      alert("Failed to save policies")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 font-body">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-headline font-bold text-[#032416] mb-2 tracking-tight">Firewall Policies</h1>
          <p className="text-[#424843] font-medium text-sm">Configure AI security rules and limits for your organization.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#1a3a2a] text-white rounded-xl text-sm font-bold hover:bg-[#032416] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(26,58,42,0.4)]"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] divide-y divide-[#f1eedf]">
        <div className="p-8 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#032416] mb-1">Block Prompt Injection</h3>
            <p className="text-sm text-[#424843] font-medium">Automatically detect and block adversarial inputs before they reach the model.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={policies.blockInjection} onChange={e => setPolicies({...policies, blockInjection: e.target.checked})} />
            <div className="w-11 h-6 bg-[#f1eedf] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5e51ad]"></div>
          </label>
        </div>

        <div className="p-8 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#032416] mb-1">Data Loss Prevention (PII)</h3>
            <p className="text-sm text-[#424843] font-medium">Detect and redact Personally Identifiable Information from prompts.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={policies.blockPII} onChange={e => setPolicies({...policies, blockPII: e.target.checked})} />
            <div className="w-11 h-6 bg-[#f1eedf] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5e51ad]"></div>
          </label>
        </div>

        <div className="p-8 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#032416] mb-1">Max Tokens Per Request</h3>
            <p className="text-sm text-[#424843] font-medium">Hard limit on tokens to prevent accidental high-cost queries.</p>
          </div>
          <input 
            type="number" 
            value={policies.maxTokensPerRequest}
            onChange={e => setPolicies({...policies, maxTokensPerRequest: Number(e.target.value)})}
            className="bg-[#fdfaea] border border-[#f1eedf] rounded-xl px-4 py-2.5 w-32 text-center font-bold text-[#032416] focus:outline-none focus:border-[#5e51ad] transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
