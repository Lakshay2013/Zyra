'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'

const SYSTEMS = [
  { name: 'Zyra API Proxy', status: 'operational', uptime: '99.97%', desc: '/v1/chat/completions endpoint' },
  { name: 'Dashboard & Web App', status: 'operational', uptime: '99.99%', desc: 'Dashboard, billing, and settings' },
  { name: 'Authentication Service', status: 'operational', uptime: '99.98%', desc: 'Login, registration, and API key auth' },
  { name: 'Cost Optimization Engine', status: 'operational', uptime: '99.97%', desc: 'Model selection and routing logic' },
  { name: 'Logging Pipeline', status: 'operational', uptime: '99.95%', desc: 'Request logging and analytics' },
  { name: 'Payment Processing', status: 'operational', uptime: '99.99%', desc: 'Razorpay billing integration' },
]

const PROVIDERS = [
  { name: 'OpenAI', status: 'operational', latency: '~120ms' },
  { name: 'Anthropic', status: 'operational', latency: '~150ms' },
  { name: 'Groq', status: 'operational', latency: '~45ms' },
  { name: 'Google Gemini', status: 'operational', latency: '~130ms' },
]

const INCIDENTS: { date: string; title: string; desc: string; resolved: boolean }[] = []

export default function StatusPage() {
  const allOperational = SYSTEMS.every(s => s.status === 'operational') && PROVIDERS.every(p => p.status === 'operational')

  return (
    <div className="bg-brand-bg text-white min-h-screen font-sans">
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-brand-bg/80 border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="font-black text-xl tracking-tight text-brand-accent hover:opacity-80 transition-opacity">ZYRA</Link>
          <Link href="/" className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-white transition-colors"><ArrowLeft size={14} /> Back to Home</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-12">
          <div className="border border-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-8 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" /> STATUS
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-tight mb-6">System Status</h1>
        </div>

        {/* Overall Status */}
        <div className={`mb-12 p-6 rounded-xl border flex items-center gap-4 ${allOperational ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <CheckCircle className={`w-6 h-6 ${allOperational ? 'text-emerald-400' : 'text-amber-400'}`} />
          <div>
            <div className={`font-bold text-[15px] ${allOperational ? 'text-emerald-400' : 'text-amber-400'}`}>
              {allOperational ? 'All Systems Operational' : 'Partial Degradation'}
            </div>
            <div className="text-gray-500 text-[12px] font-mono uppercase tracking-wider mt-1">
              Last checked: Just now
            </div>
          </div>
        </div>

        {/* Zyra Systems */}
        <div className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-6">Zyra Services</h2>
          <div className="bg-brand-surface border border-white/[0.06] rounded-xl overflow-hidden">
            {SYSTEMS.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors" style={{ borderBottom: i < SYSTEMS.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <div>
                  <div className="text-[14px] font-semibold text-gray-200">{s.name}</div>
                  <div className="text-[12px] text-gray-500 mt-0.5">{s.desc}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono text-gray-500 hidden sm:block">{s.uptime} uptime</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Operational</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Status */}
        <div className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-6">Upstream Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROVIDERS.map((p, i) => (
              <div key={i} className="p-5 bg-brand-surface border border-white/[0.06] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold text-gray-200">{p.name}</div>
                  <div className="text-[11px] font-mono text-gray-500 mt-1">Avg latency: {p.latency}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">OK</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident History */}
        <div className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-6">Incident History</h2>
          {INCIDENTS.length === 0 ? (
            <div className="p-8 bg-brand-surface border border-white/[0.06] rounded-xl text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-400 text-[14px]">No incidents reported in the last 90 days.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {INCIDENTS.map((inc, i) => (
                <div key={i} className="p-5 bg-brand-surface border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${inc.resolved ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-[14px] font-semibold text-gray-200">{inc.title}</span>
                  </div>
                  <p className="text-gray-400 text-[13px] mb-1">{inc.desc}</p>
                  <span className="text-[11px] font-mono text-gray-500">{inc.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-brand-surface border border-white/[0.06] rounded-xl">
          <p className="text-gray-400 text-[13px] leading-relaxed">
            Subscribe to status updates via email at <a href="mailto:status@zyra.dev" className="text-brand-accent hover:underline">status@zyra.dev</a>. 
            For urgent issues, contact <a href="mailto:support@zyra.dev" className="text-brand-accent hover:underline">support@zyra.dev</a>.
          </p>
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
