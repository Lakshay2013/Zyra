'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const METRICS = [
  { label: 'Request Volume', desc: 'Total requests, broken down by model, provider, and status code. Track growth patterns and identify usage spikes.', icon: '📊' },
  { label: 'Cost Tracking', desc: 'Per-request cost before and after optimization. Cumulative savings over time. Cost by model, by feature, by user.', icon: '💰' },
  { label: 'Latency Distribution', desc: 'P50, P95, P99 latency per provider and model. Identify slow routes and optimize provider selection.', icon: '⚡' },
  { label: 'Routing Decisions', desc: 'Full audit trail of every routing decision — which model was selected, why, and what the alternative cost would have been.', icon: '🔀' },
  { label: 'Provider Health', desc: 'Real-time availability and error rates per provider. Circuit breaker state and failover events logged.', icon: '🏥' },
  { label: 'Token Usage', desc: 'Input/output token counts per request. Aggregate token consumption by model and time period.', icon: '🔢' },
]

const LOG_FIELDS = [
  { field: 'requestId', type: 'string', desc: 'Unique identifier for the request' },
  { field: 'model', type: 'string', desc: 'Model used for completion' },
  { field: 'provider', type: 'string', desc: 'Provider that served the request' },
  { field: 'inputTokens', type: 'number', desc: 'Number of input tokens' },
  { field: 'outputTokens', type: 'number', desc: 'Number of output tokens' },
  { field: 'costBefore', type: 'number', desc: 'Cost if original model was used' },
  { field: 'costAfter', type: 'number', desc: 'Actual cost after optimization' },
  { field: 'latency', type: 'number', desc: 'Total request latency in ms' },
  { field: 'routingDecision', type: 'string', desc: 'Routed | Maintained | Fallback' },
  { field: 'timestamp', type: 'ISO 8601', desc: 'When the request was processed' },
]

export default function ObservabilityPage() {
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
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-tight mb-6">Observability</h1>
          <p className="text-gray-400 text-[16px] leading-relaxed max-w-2xl">
            Full visibility into every request. Track costs, latency, routing decisions, and provider health — all from one dashboard.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {METRICS.map((m, i) => (
            <div key={i} className="p-6 bg-brand-surface border border-white/[0.06] rounded-xl hover:border-brand-accent/20 transition-all">
              <div className="text-2xl mb-3">{m.icon}</div>
              <h3 className="text-[15px] font-bold mb-2">{m.label}</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Log Schema */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Log Schema</h2>
          <p className="text-gray-400 text-[14px] leading-relaxed mb-8">Every request generates a structured log entry with the following fields, queryable via the dashboard and API.</p>
          <div className="bg-brand-surface border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
              <div className="col-span-3">Field</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-7">Description</div>
            </div>
            {LOG_FIELDS.map((f, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <div className="col-span-3 font-mono text-[13px] text-brand-accent">{f.field}</div>
                <div className="col-span-2 font-mono text-[12px] text-gray-500">{f.type}</div>
                <div className="col-span-7 text-[13px] text-gray-400">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-brand-surface border border-white/[0.06] rounded-xl mb-20">
          <h3 className="font-bold text-[15px] mb-3">Data Retention</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { plan: 'Builder', retention: '7 days', export: 'JSON' },
              { plan: 'Pro', retention: '90 days', export: 'JSON / CSV' },
              { plan: 'Growth', retention: 'Unlimited', export: 'JSON / CSV / Webhook' },
            ].map((p, i) => (
              <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-accent mb-2">{p.plan}</div>
                <div className="text-gray-300 text-[13px]">{p.retention} retention</div>
                <div className="text-gray-500 text-[12px]">Export: {p.export}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-brand-surface border border-white/[0.06] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-[15px] mb-1">See your AI spend in real-time</h3>
            <p className="text-gray-400 text-[13px]">Sign up and start logging requests immediately.</p>
          </div>
          <Link href="/register" className="bg-brand-accent text-black px-6 py-3 rounded-lg text-[13px] font-bold hover:bg-white transition-all shrink-0">Get Started →</Link>
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
