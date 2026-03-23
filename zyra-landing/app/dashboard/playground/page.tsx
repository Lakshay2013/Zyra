'use client'

import { useState } from "react"
import { Send, Terminal } from "lucide-react"

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [model, setModel] = useState("gpt-3.5-turbo")
  const [zyraKey, setZyraKey] = useState("")
  const [loading, setLoading] = useState(false)

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt || !zyraKey) return

    setLoading(true)
    setResponse("Sending request through Zyra Proxy...")

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const res = await fetch(`${baseUrl}/proxy/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-zyra-api-key': zyraKey
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
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
                <option value="gpt-3.5-turbo">gpt-3.5-turbo (OpenAI)</option>
                <option value="gpt-4o">gpt-4o (OpenAI)</option>
                <option value="claude-3-haiku">claude-3-haiku (Anthropic)</option>
                <option value="llama3-8b-8192">llama3-8b-8192 (Groq)</option>
              </select>
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
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            <span className="text-[#8b918d] text-xs font-mono ml-2 tracking-wider uppercase">Proxy Response</span>
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
