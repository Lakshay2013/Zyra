'use client'

import Link from 'next/link'
import { ArrowLeft, Zap, Shield, BarChart3, RefreshCw, Layers, Globe } from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'Intelligent Cost Routing',
    desc: 'Zyra evaluates the complexity of every incoming request and routes it to the cheapest model capable of producing an equivalent-quality response. GPT-4o class tasks stay on GPT-4o. Simple classification? Routed to Haiku or Llama 3 — saving up to 90%.',
    stats: [
      { label: 'Avg. Savings', value: '60%' },
      { label: 'Routing Latency', value: '<5ms' },
    ],
  },
  {
    icon: Shield,
    title: 'Quality Guard',
    desc: 'Every downgrade decision passes through the Quality Guard — a real-time evaluation layer that compares task requirements against model capabilities. If a cheaper model cannot maintain the expected output fidelity, Zyra keeps the original routing. No compromises.',
    stats: [
      { label: 'Quality Retention', value: '99.7%' },
      { label: 'False Downgrade Rate', value: '<0.3%' },
    ],
  },
  {
    icon: RefreshCw,
    title: 'Automatic Failover',
    desc: 'Provider outages are detected in under 200ms. Zyra automatically retries the request against your configured fallback chain — OpenAI → Anthropic → Groq → Gemini — with zero code changes. Your users never see an error.',
    stats: [
      { label: 'Detection Time', value: '<200ms' },
      { label: 'Failover Success', value: '99.9%' },
    ],
  },
  {
    icon: BarChart3,
    title: 'Real-Time Observability',
    desc: 'Every request is logged with full metadata: model used, tokens consumed, latency, cost before and after optimization, and routing decision rationale. The dashboard surfaces trends, anomalies, and savings in real-time.',
    stats: [
      { label: 'Log Retention', value: '90 days' },
      { label: 'Dashboard Refresh', value: 'Live' },
    ],
  },
  {
    icon: Layers,
    title: 'Multi-Provider Abstraction',
    desc: 'Configure OpenAI, Anthropic, Google Gemini, Groq, and Mistral from a single control plane. Zyra normalizes request/response formats across providers so you write one integration and access all models.',
    stats: [
      { label: 'Providers', value: '5+' },
      { label: 'Models Available', value: '20+' },
    ],
  },
  {
    icon: Globe,
    title: 'OpenAI-Compatible API',
    desc: 'Zyra exposes a /v1/chat/completions endpoint that is fully compatible with the OpenAI SDK. Swap your base URL, and every existing integration — LangChain, LlamaIndex, custom agents — works instantly.',
    stats: [
      { label: 'SDK Compatibility', value: '100%' },
      { label: 'Migration Time', value: '<5 min' },
    ],
  },
]

export default function SemanticProxyPage() {
  return (
    <div className="bg-brand-bg text-white min-h-screen font-sans">
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-brand-bg/80 border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="font-black text-xl tracking-tight text-brand-accent hover:opacity-80 transition-opacity">
            ZYRA
          </Link>
          <Link href="/" className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="mb-20">
          <div className="border border-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-8 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
            PLATFORM
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-tight mb-6">
            Semantic Proxy
          </h1>
          <p className="text-gray-400 text-[16px] leading-relaxed max-w-2xl">
            Zyra is a transparent AI proxy that sits between your application and LLM providers. 
            It intercepts every request, analyzes intent, optimizes cost, and routes intelligently — 
            all with sub-5ms overhead.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="mb-20 p-8 md:p-12 bg-brand-surface border border-white/[0.06] rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-8">REQUEST LIFECYCLE</div>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0 justify-between">
            {[
              { label: 'Your App', sub: 'SDK / REST', accent: false },
              { label: 'Firewall', sub: 'Auth + Rate Limit', accent: false },
              { label: 'Cost Engine', sub: 'Model Selection', accent: true },
              { label: 'Quality Guard', sub: 'Fidelity Check', accent: false },
              { label: 'Provider', sub: 'OpenAI / Claude / Groq', accent: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 md:gap-0">
                <div className={`p-4 md:p-5 rounded-lg border text-center min-w-[130px] ${step.accent ? 'border-brand-accent/40 bg-brand-accent/5' : 'border-white/10 bg-white/[0.02]'}`}>
                  <div className={`text-[13px] font-bold mb-1 ${step.accent ? 'text-brand-accent' : 'text-gray-200'}`}>{step.label}</div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{step.sub}</div>
                </div>
                {i < 4 && <div className="hidden md:block w-8 h-[1px] bg-white/10 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="space-y-8">
          {FEATURES.map((feature, i) => (
            <div key={i} className="group p-8 bg-brand-surface border border-white/[0.06] rounded-xl hover:border-brand-accent/20 transition-all">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <feature.icon className="w-5 h-5 text-brand-accent" strokeWidth={1.5} />
                    <h3 className="text-xl font-bold tracking-tight">{feature.title}</h3>
                  </div>
                  <p className="text-gray-400 text-[14px] leading-[1.8]">{feature.desc}</p>
                </div>
                <div className="flex md:flex-col gap-6 md:gap-4 md:min-w-[160px] md:border-l md:border-white/[0.06] md:pl-8">
                  {feature.stats.map((stat, j) => (
                    <div key={j}>
                      <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-[0.15em] mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold font-mono text-brand-accent">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 p-8 bg-brand-surface border border-white/[0.06] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-[15px] mb-1">Ready to optimize your AI spend?</h3>
            <p className="text-gray-400 text-[13px]">Get started with the free Builder plan. No credit card required.</p>
          </div>
          <Link
            href="/register"
            className="bg-brand-accent text-black px-6 py-3 rounded-lg text-[13px] font-bold hover:bg-white transition-all shrink-0"
          >
            Get Started Free →
          </Link>
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
