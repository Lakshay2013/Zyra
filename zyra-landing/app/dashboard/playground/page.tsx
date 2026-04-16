'use client'

import { useState, useRef } from "react"
import toast from 'react-hot-toast'
import api from "@/lib/api"

export default function PlaygroundPage() {
  const [model, setModel] = useState('auto')
  const [streaming, setStreaming] = useState(false)
  const [debug, setDebug] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [latency, setLatency] = useState(0)
  const responseRef = useRef<HTMLDivElement>(null)

  const models = [
    { value: 'auto', label: 'AUTO (ZYRA PICKS)' },
    { value: 'gpt-4o', label: 'GPT-4O' },
    { value: 'gpt-4o-mini', label: 'GPT-4O-MINI' },
    { value: 'claude-3-5-sonnet-20241022', label: 'CLAUDE-3.5-SONNET' },
    { value: 'claude-3-haiku-20240307', label: 'CLAUDE-3-HAIKU' },
    { value: 'llama-3.3-70b-versatile', label: 'LLAMA-3.3-70B' },
    { value: 'gemini-1.5-flash', label: 'GEMINI-1.5-FLASH' },
  ]

  const handleExecute = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setResponse('')
    setDebugInfo(null)
    const start = Date.now()

    try {
      const token = localStorage.getItem('zyra_token')
      const orgData = JSON.parse(localStorage.getItem('zyra_org') || '{}')
      
      const res = await api.post('/proxy/openai', {
        model,
        prompt: prompt.trim(),
        userId: 'playground-user',
        maxTokens: 1024
      })

      setLatency(Date.now() - start)
      const data = res.data

      if (data.choices?.[0]?.message?.content) {
        setResponse(data.choices[0].message.content)
      } else if (data.response) {
        setResponse(data.response)
      } else if (data.text) {
        setResponse(data.text)
      } else {
        setResponse(JSON.stringify(data, null, 2))
      }

      setDebugInfo({
        provider: data.provider || data.debug?.provider || 'unknown',
        model: data.model || data.debug?.model || model,
        complexity: data.debug?.complexity || 'unknown',
        cost: data.debug?.estimatedCost || data.usage?.estimatedCost || 0,
        originalCost: data.debug?.originalCost || 0,
        savings: data.debug?.savings || 0,
        latency: Date.now() - start,
        cached: data.debug?.cached || false,
        qualityCheck: data.debug?.qualityRetry ? 'retried' : 'passed',
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0,
        }
      })
    } catch (err: any) {
      setResponse(`Error: ${err.response?.data?.error || err.message}`)
      setLatency(Date.now() - start)
    } finally {
      setLoading(false)
    }
  }

  const debugLines = debugInfo ? [
    { key: 'provider', value: `"${debugInfo.provider}"` },
    { key: 'model', value: `"${debugInfo.model}"` },
    { key: 'complexity', value: `"${debugInfo.complexity}"` },
    { key: 'cost', value: `"$${debugInfo.cost?.toFixed(6) || '0.000000'}"` },
    { key: 'original_cost', value: `"$${debugInfo.originalCost?.toFixed(6) || '0.000000'}"` },
    { key: 'savings', value: `"$${debugInfo.savings?.toFixed(6) || '0.000000'}"` },
    { key: 'latency_ms', value: `${debugInfo.latency}` },
    { key: 'cached', value: `${debugInfo.cached}` },
    { key: 'quality_check', value: `"${debugInfo.qualityCheck}"` },
    { key: 'tokens_in', value: `${debugInfo.tokens?.prompt || 0}` },
    { key: 'tokens_out', value: `${debugInfo.tokens?.completion || 0}` },
  ] : []

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
        <div>
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#e5e2e3', lineHeight: 1 }}>
            SANDBOX
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#71717a', marginTop: 8 }}>
            INTERACTIVE_PROXY_TEST // SESSION: <span style={{ color: '#9be8cb' }}>EPHEMERAL</span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: loading ? '#ffa69e' : '#9be8cb', animation: loading ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {loading ? 'PROCESSING...' : 'READY'}
          </span>
        </div>
      </div>

      {/* ── CONTROLS BAR ── */}
      <div className="flex items-center gap-4 mt-6 p-4 flex-wrap" style={{ background: '#1c1b1c', borderRadius: 12 }}>
        {/* Model Selector */}
        <div className="flex flex-col">
          <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>Model</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              background: '#0e0e0f', border: 'none', color: '#e5e2e3',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: '8px 12px',
              borderRadius: 8, outline: 'none', minWidth: 200,
            }}
          >
            {models.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Streaming Toggle */}
        <div className="flex flex-col">
          <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>Streaming</span>
          <button
            onClick={() => setStreaming(!streaming)}
            style={{
              background: streaming ? 'rgba(255,166,158,0.15)' : '#0e0e0f',
              color: streaming ? '#ffa69e' : '#71717a',
              fontSize: 11, fontWeight: 700, padding: '8px 16px', borderRadius: 8,
              border: streaming ? '1px solid rgba(255,166,158,0.3)' : '1px solid transparent',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >{streaming ? 'ON' : 'OFF'}</button>
        </div>

        {/* Debug Toggle */}
        <div className="flex flex-col">
          <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>Debug</span>
          <button
            onClick={() => setDebug(!debug)}
            style={{
              background: debug ? 'rgba(255,166,158,0.15)' : '#0e0e0f',
              color: debug ? '#ffa69e' : '#71717a',
              fontSize: 11, fontWeight: 700, padding: '8px 16px', borderRadius: 8,
              border: debug ? '1px solid rgba(255,166,158,0.3)' : '1px solid transparent',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >{debug ? 'ON' : 'OFF'}</button>
        </div>
      </div>

      {/* ── SPLIT LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        {/* ── LEFT: INPUT ── */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col" style={{ background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
            <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Prompt Input</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#71717a' }}>{prompt.length} chars</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleExecute()
              }}
              style={{
                background: 'transparent', color: '#e5e2e3', border: 'none', outline: 'none',
                fontFamily: "'Inter', sans-serif", fontSize: 14, padding: 20, resize: 'none',
                minHeight: 200, flex: 1, lineHeight: 1.6,
              }}
            />
          </div>

          <button
            onClick={handleExecute}
            disabled={loading || !prompt.trim()}
            style={{
              background: loading ? '#71717a' : '#ffa69e',
              color: '#3b0908', padding: '14px 0', borderRadius: 12,
              fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
              opacity: loading || !prompt.trim() ? 0.6 : 1,
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'EXECUTING...' : 'EXECUTE'}
          </button>

          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#71717a', textAlign: 'center' }}>
            CMD+ENTER TO SEND // MODEL: {model.toUpperCase()}
          </div>
        </div>

        {/* ── RIGHT: RESPONSE + DEBUG ── */}
        <div className="flex flex-col gap-6">

          {/* Response */}
          <div style={{ background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)' }}>
            <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Response</span>
              {response && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(response)
                    toast.success('Response copied to clipboard')
                  }}
                  style={{ fontSize: 10, color: '#ffa69e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                >Copy</button>
              )}
            </div>
            <div ref={responseRef} className="p-5 overflow-y-auto" style={{ minHeight: 120, maxHeight: 300 }}>
              {response ? (
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#e5e2e3', whiteSpace: 'pre-wrap' }}>{response}</p>
              ) : (
                <p style={{ fontSize: 13, color: '#534341', fontStyle: 'italic' }}>Awaiting response...</p>
              )}
            </div>
          </div>

          {/* Debug Panel — JSON viewer style matching LOG_STREAM reference */}
          {debug && (
            <div style={{ background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)', overflow: 'hidden' }}>
              <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#534341' }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#534341' }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#534341' }} />
                  </div>
                  <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Routing Debug</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#534341', textTransform: 'uppercase' }}>JSON_FORMAT</span>
              </div>
              <div className="p-5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                {debugLines.length > 0 ? (
                  <div>
                    <span style={{ color: '#71717a' }}>{'{'}</span>
                    {debugLines.map((line, i) => (
                      <div key={i} className="flex" style={{ paddingLeft: 16, lineHeight: 2 }}>
                        <span style={{ color: '#534341', width: 28, display: 'inline-block', textAlign: 'right', marginRight: 16, userSelect: 'none' }}>{String(i + 1).padStart(2, '0')}</span>
                        <span style={{ color: '#ffa69e' }}>"{line.key}"</span>
                        <span style={{ color: '#71717a' }}>: </span>
                        <span style={{ color: line.key === 'savings' || line.key === 'cached' ? '#9be8cb' : '#e5e2e3' }}>{line.value}</span>
                        {i < debugLines.length - 1 && <span style={{ color: '#71717a' }}>,</span>}
                      </div>
                    ))}
                    <span style={{ color: '#71717a' }}>{'}'}</span>
                  </div>
                ) : (
                  <div style={{ color: '#534341' }}>
                    <span>{'{'}</span><br/>
                    <span style={{ paddingLeft: 16, display: 'inline-block' }}>"status": "awaiting_execution"</span><br/>
                    <span>{'}'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom metric strip */}
          {debugInfo && (
            <div className="flex items-center gap-8 p-4" style={{ background: '#1c1b1c', borderRadius: 12 }}>
              {[
                { label: 'Latency', value: `${debugInfo.latency}ms` },
                { label: 'Tokens In', value: debugInfo.tokens?.prompt || 0 },
                { label: 'Tokens Out', value: debugInfo.tokens?.completion || 0 },
                { label: 'Cost', value: `$${debugInfo.cost?.toFixed(6) || '—'}` },
                { label: 'Savings', value: `$${debugInfo.savings?.toFixed(6) || '—'}`, accent: true },
              ].map((m, i) => (
                <div key={i} className="flex flex-col">
                  <span style={{ fontSize: 9, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: m.accent ? '#9be8cb' : '#e5e2e3' }}>{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
