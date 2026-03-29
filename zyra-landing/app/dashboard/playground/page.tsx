'use client'

import { useState } from "react"
import { Send, Terminal } from "lucide-react"

// Model to provider+path mapping
const MODEL_CONFIG: Record<string, { provider: string, label: string }> = {
  'gpt-3.5-turbo': { provider: 'openai', label: 'gpt-3.5-turbo (OpenAI)' },
  'gpt-4o': { provider: 'openai', label: 'gpt-4o (OpenAI)' },
  'gpt-4o-mini': { provider: 'openai', label: 'gpt-4o-mini (OpenAI)' },
  'claude-3-haiku-20240307': { provider: 'anthropic', label: 'claude-3-haiku (Anthropic)' },
  'claude-3-5-sonnet-20241022': { provider: 'anthropic', label: 'claude-3.5-sonnet (Anthropic)' },
  'llama3-70b-8192': { provider: 'groq', label: 'llama3-70b (Groq)' },
  'mixtral-8x7b-32768': { provider: 'groq', label: 'mixtral-8x7b (Groq)' },
}

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [model, setModel] = useState("gpt-3.5-turbo")
  const [zyraKey, setZyraKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState<any>(null)

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt || !zyraKey) return

    setLoading(true)
    setResponse("Sending request through Zyra Proxy...")
    setMeta(null)

    const config = MODEL_CONFIG[model] || { provider: 'openai' }
    const provider = config.provider

    // Build provider-specific request body
    let body: any
    let path: string

    if (provider === 'anthropic') {
      body = {
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      }
      path = `/proxy/anthropic/v1/messages`
    } else {
      // OpenAI-compatible (openai, groq)
      body = {
        model,
        messages: [{ role: 'user', content: prompt }]
      }
      path = `/proxy/${provider}/v1/chat/completions`
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const startTime = Date.now()

      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-zyra-api-key': zyraKey
        },
        body: JSON.stringify(body)
      })

      const latency = Date.now() - startTime
      const data = await res.json()

      if (!res.ok) {
        setResponse(JSON.stringify(data, null, 2))
        setMeta({ status: res.status, latency })
        return
      }

      // Extract response text based on provider
      let responseText = ''
      let tokens: any = null

      if (provider === 'anthropic') {
        responseText = data.content?.[0]?.text || ''
        tokens = {
          prompt: data.usage?.input_tokens || 0,
          completion: data.usage?.output_tokens || 0
        }
      } else {
        responseText = data.choices?.[0]?.message?.content || ''
        tokens = {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0
        }
      }

      setResponse(responseText || JSON.stringify(data, null, 2))
      setMeta({
        status: res.status,
        latency,
        model: data.model || model,
        tokens,
        provider
      })
    } catch (err) {
      setResponse("Error connecting to proxy: " + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-body h-full flex flex-col">
      <div>
        <h1 className="text-[32px] font-headline font-bold text-[#032416] mb-2 tracking-tight">API Playground</h1>
        <p className="text-[#424843] font-medium text-sm">Test your proxy configuration and verify your Firewall Policies in real-time.</p>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] flex flex-col lg:flex-row overflow-hidden flex-1 min-h-[600px]">
        
        {/* Left Side: Input Configuration */}
        <div className="w-full lg:w-[400px] border-r border-[#f1eedf] bg-[#fdfaea]/30 p-6 flex flex-col">
          <form onSubmit={handleTest} className="space-y-6 flex-1 flex flex-col">
            
            <div>
              <label className="block text-xs font-bold text-[#032416] uppercase tracking-wider mb-2">Zyra API Key</label>
              <input 
                type="password"
                value={zyraKey}
                onChange={e => setZyraKey(e.target.value)}
                placeholder="sk-live-..."
                required
                className="w-full bg-white border border-[#c1c8c2] rounded-xl px-4 py-2.5 text-[#032416] placeholder-[#c1c8c2] focus:outline-none focus:border-[#5e51ad] transition-all text-sm font-semibold shadow-sm"
              />
              <p className="text-[#8b918d] text-xs mt-1.5 font-medium">Generate this on the API Keys page.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#032416] uppercase tracking-wider mb-2">Model</label>
              <select 
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-white border border-[#c1c8c2] rounded-xl px-4 py-2.5 text-[#032416] focus:outline-none focus:border-[#5e51ad] transition-all text-sm font-semibold shadow-sm appearance-none cursor-pointer"
              >
                {Object.entries(MODEL_CONFIG).map(([modelId, config]) => (
                  <option key={modelId} value={modelId}>{config.label}</option>
                ))}
              </select>
              <p className="text-[#8b918d] text-xs mt-1.5 font-medium">
                Routes via <span className="font-bold text-[#5e51ad]">{MODEL_CONFIG[model]?.provider || 'openai'}</span> provider
              </p>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-bold text-[#032416] uppercase tracking-wider mb-2">Prompt</label>
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Write a testing prompt..."
                required
                className="w-full flex-1 bg-white border border-[#c1c8c2] rounded-xl px-4 py-3 text-[#032416] placeholder-[#c1c8c2] focus:outline-none focus:border-[#5e51ad] transition-all text-sm font-medium shadow-sm resize-none min-h-[150px]"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !prompt || !zyraKey}
              className="w-full py-3.5 bg-[#1a3a2a] text-white font-bold rounded-xl hover:bg-[#032416] disabled:opacity-50 transition-colors shadow-[0_4px_14px_rgba(26,58,42,0.4)] flex items-center justify-center gap-2"
            >
              {loading ? <Terminal className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5" />}
              <span>{loading ? 'Proxying...' : 'Send Request'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Output */}
        <div className="flex-1 p-6 flex flex-col bg-[#1e1e1e]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              <span className="text-[#8b918d] text-xs font-mono ml-2 tracking-wider uppercase">Proxy Response</span>
            </div>
            {meta && (
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className={`px-2 py-0.5 rounded ${meta.status < 400 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {meta.status}
                </span>
                <span className="text-[#8b918d]">{meta.latency}ms</span>
                {meta.tokens && (
                  <span className="text-[#8b918d]">{meta.tokens.prompt + meta.tokens.completion} tok</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-4 overflow-auto">
            {response ? (
              <pre className="text-[#a99cfe] font-mono text-sm whitespace-pre-wrap break-words">
                {response}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-[#8b918d] font-mono text-xs opacity-50">
                Awaiting proxy execution...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
