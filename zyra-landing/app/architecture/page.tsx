'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const LAYERS = [
  { name: 'SDK / Client Layer', tag: 'INGRESS', desc: 'OpenAI-compatible SDK that acts as a drop-in replacement. Sends requests to Zyra instead of directly to providers.', tech: ['zyra-sdk (npm)', 'REST API', 'WebSocket'] },
  { name: 'Auth & Rate Limiting', tag: 'MIDDLEWARE', desc: 'Every request is authenticated via API key or JWT. Rate limits enforced per-org based on plan tier.', tech: ['JWT', 'Redis rate limiter', 'API key rotation'] },
  { name: 'Cost Optimization Engine', tag: 'CORE', desc: 'Analyzes prompt complexity — classification, summarization, reasoning — and selects the cheapest capable model using a scoring matrix.', tech: ['Task classifier', 'Cost matrix', 'Model map'] },
  { name: 'Quality Guard', tag: 'VALIDATION', desc: 'Prevents quality degradation by comparing the selected model against minimum thresholds. If a downgrade would compromise quality, the original model is preserved.', tech: ['Quality scoring', 'Threshold config', 'Override rules'] },
  { name: 'Provider Router', tag: 'ROUTING', desc: 'Normalizes request format for the target provider and dispatches it. Handles response normalization back to OpenAI-compatible format.', tech: ['Provider adapters', 'Connection pooling', 'Normalization'] },
  { name: 'Reliability Layer', tag: 'RESILIENCE', desc: 'Automatic retry with exponential backoff. Fallback chain execution when a provider is down. Circuit breaker prevents cascading failures.', tech: ['Circuit breaker', 'Fallback chains', 'Health monitoring'] },
  { name: 'Observability Pipeline', tag: 'LOGGING', desc: 'Every request logged asynchronously with full metadata: model, tokens, cost, latency, routing decision. 90-day retention.', tech: ['Async logging', 'MongoDB', 'Dashboard API'] },
]

export default function ArchitecturePage() {
  return (
    <div className="bg-brand-bg text-white min-h-screen font-sans">
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-brand-bg/80 border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="font-black text-xl tracking-tight text-brand-accent hover:opacity-80 transition-opacity">ZYRA</Link>
          <Link href="/" className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-white transition-colors"><ArrowLeft size={14} /> Back to Home</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-20">
          <div className="border border-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-8 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" /> PLATFORM
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-tight mb-6">API Architecture</h1>
          <p className="text-gray-400 text-[16px] leading-relaxed max-w-2xl">
            A deep dive into Zyra&apos;s seven-layer proxy architecture — from SDK ingress to provider egress.
          </p>
        </div>

        <div className="mb-16 p-6 bg-brand-surface border border-white/[0.06] rounded-xl">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-4">BASE ENDPOINT</div>
          <div className="font-mono text-[15px] text-brand-accent mb-3">POST /v1/chat/completions</div>
          <p className="text-gray-400 text-[13px] leading-relaxed">
            Fully OpenAI-compatible. Drop-in replacement for <code className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded text-[12px]">api.openai.com</code>.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-white/[0.06] hidden md:block" />
          <div className="space-y-6">
            {LAYERS.map((layer, i) => (
              <div key={i} className="relative md:pl-16 group">
                <div className="hidden md:block absolute left-[18px] top-8 w-3 h-3 rounded-full border-2 border-brand-accent/40 bg-brand-bg group-hover:bg-brand-accent transition-all" />
                <div className="p-6 md:p-8 bg-brand-surface border border-white/[0.06] rounded-xl group-hover:border-brand-accent/20 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <h3 className="text-lg font-bold tracking-tight">{layer.name}</h3>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-full w-fit">{layer.tag}</span>
                  </div>
                  <p className="text-gray-400 text-[14px] leading-[1.8] mb-5">{layer.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {layer.tech.map((t, j) => (
                      <span key={j} className="text-[11px] font-mono text-gray-500 bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-md">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 p-8 bg-brand-surface border border-white/[0.06] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-[15px] mb-1">See it in action</h3>
            <p className="text-gray-400 text-[13px]">Try the Zyra proxy with your own API keys — free tier available.</p>
          </div>
          <Link href="/register" className="bg-brand-accent text-black px-6 py-3 rounded-lg text-[13px] font-bold hover:bg-white transition-all shrink-0">Start Building →</Link>
        </div>
      </main>

      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 font-mono">
          <div>© 2026 ZYRA INC. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6 mt-3 sm:mt-0">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
