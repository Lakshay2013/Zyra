'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Check, ShieldCheck, Zap, FileText, ChevronRight } from 'lucide-react'
import { useMotionEngine, WordReveal, CopyButton, FAQItem } from './components/motion-engine'

const CODE_SNIPPET = `import Zyra from "zyra-sdk";

const client = new Zyra({ apiKey: process.env.ZYRA_KEY });

const res = await client.chat.completions.create({
  model: "auto",  // Zyra picks the cheapest capable model
  messages: [{ role: "user", content: "Hello" }],
});`

const FAQ_DATA = [
  { q: 'How does Zyra reduce costs without changing my code?', a: 'Zyra acts as a transparent proxy that intercepts your API calls and intelligently routes them to the most cost-effective model that can handle the task. Your code stays exactly the same — just swap the SDK client.' },
  { q: 'Will response quality degrade?', a: 'No. Zyra\'s Quality Guard evaluates task complexity and only downgrades the model when it determines the output quality will remain equivalent. Complex reasoning tasks stay on premium models.' },
  { q: 'What providers does Zyra support?', a: 'OpenAI, Anthropic, Groq, Mistral, and more. We continuously add new providers and models as they become available. You can also configure custom provider endpoints.' },
  { q: 'What happens if a provider goes down?', a: 'Zyra automatically fails over to backup providers with sub-second detection. Your requests are never lost — the fallback logic is built into the routing layer.' },
]

const TRAFFIC_DATA = [
  { id: 'REQ_99AD2X', from: 'GPT-4o', to: 'Claude Haiku', before: '$0.012', after: '$0.003', pct: '75%', status: 'Routed' },
  { id: 'REQ_88BBY', from: 'GPT-4o', to: 'Groq Llama 3', before: '$0.010', after: '$0.002', pct: '80%', status: 'Routed' },
  { id: 'REQ_77CCZ', from: 'GPT-4o', to: 'GPT-4o', before: '$0.018', after: '$0.018', pct: '0%', status: 'Maintained' },
  { id: 'REQ_82DK2', from: 'GPT-4o', to: 'Mixtral 8x7B', before: '$0.015', after: '$0.003', pct: '80%', status: 'Fallback' },
]

export default function HomePage() {
  const [isYearly, setIsYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useMotionEngine()

  return (
    <div className="bg-brand-bg text-white min-h-screen font-sans relative">
      {/* Page Load Curtain (#28) */}
      <div id="page-curtain"><div className="curtain-logo">ZYRA</div></div>

      {/* Canvas Starfield (#25) */}
      <canvas id="canvas-network" />

      {/* Mute Toggle (#40) */}
      <div id="mute-toggle">🔇</div>

      {/* ============ NAVIGATION (#6) ============ */}
      <header className="nav-bar px-6 md:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="logo-glitch font-black text-xl tracking-tight" data-magnetic>ZYRA</Link>
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-gray-400">
            <a onClick={() => toast('Platform overview — coming in Beta v2', { icon: '🚀' })} className="text-white hover:text-brand-accent transition-colors cursor-pointer">Platform</a>
            <a onClick={() => toast('Solutions page — coming in Beta v2', { icon: '🚀' })} className="hover:text-white transition-colors cursor-pointer">Solutions</a>
            <a onClick={() => toast('Integrations catalog — coming in Beta v2', { icon: '🚀' })} className="hover:text-white transition-colors cursor-pointer">Integrations</a>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </nav>
          <Link href="/login" className="text-[13px] font-medium text-gray-300 hover:text-white transition-colors" data-magnetic>Log in</Link>
        </div>
      </header>

      <main className="w-full flex flex-col items-center flex-grow relative z-10">

        {/* ============ HERO (#6.2) ============ */}
        <section className="flex flex-col items-center text-center pt-32 pb-28 px-6 max-w-4xl relative w-full">
          <div className="bg-blob" style={{ top: '-15%', left: '-10%', width: 500, height: 500, background: '#FFA69E' }} />
          <div className="bg-blob" style={{ top: '10%', right: '-8%', width: 400, height: 400, background: '#8b5cf6', animationDelay: '-6s' }} />

          <div className="border border-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-10 flex items-center gap-2 reveal">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
            BETA — EARLY ACCESS
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-[-0.03em] leading-[1.05] mb-7 max-w-3xl reveal" data-scramble>
            Reduce your <span className="gradient-text">AI costs</span><br />without changing your<br />code.
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mb-12 leading-relaxed mx-auto reveal" style={{ transitionDelay: '200ms' }}>
            <WordReveal text="Route every request intelligently and save up to 90% across providers." delay={400} />
          </p>

          <div className="flex items-center gap-4 reveal" style={{ transitionDelay: '400ms' }}>
            <Link href="/register" className="shimmer-btn bg-brand-accent text-black px-7 py-3.5 rounded-lg text-[13px] font-bold hover:bg-white transition-all" data-magnetic>
              GET STARTED
            </Link>
            <Link href="#docs" className="shimmer-btn bg-brand-surface-high border border-white/10 text-white px-7 py-3.5 rounded-lg text-[13px] font-medium hover:bg-white/5 transition-all flex items-center gap-2" data-magnetic>
              VIEW DOCUMENTATION <ChevronRight size={14} className="text-gray-500" />
            </Link>
          </div>
        </section>

        {/* ============ PROBLEM SECTION (#6.3) ============ */}
        <section className="w-full max-w-7xl mx-auto px-6 mb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center reveal">
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-4">THE PROBLEM</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 leading-snug">
              AI infrastructure is<br />fragmented and costly.
            </h2>
            <div className="space-y-8">
              {[
                { t: 'Cost Explosion', d: 'Overusing expensive models like GPT-4 across the board leads to out-of-control monthly spend.' },
                { t: 'Unpredictable Billing', d: 'No clear cost breakdown per feature or user. It\'s difficult to track waste and optimize.' },
                { t: 'Vendor Lock-in', d: 'Single provider dependency means API downtime breaks your production apps.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 reveal-stagger" style={{ '--stagger': `${i * 100}ms` } as React.CSSProperties}>
                  <div className="mt-1 text-brand-accent shrink-0"><Check size={20} strokeWidth={2.5} /></div>
                  <div>
                    <h4 className="font-bold text-[15px] mb-2">{item.t}</h4>
                    <p className="text-gray-400 text-[14px] leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tilt-card bg-brand-surface border border-white/[0.06] rounded-xl p-8 flex flex-col justify-between h-[320px] spotlight-card relative">
            <div className="tilt-glare" />
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-[0.2em]">
              <span className="text-brand-accent">MONTHLY SPEND</span><span className="text-gray-600">USD</span>
            </div>
            <div className="flex flex-col gap-6 h-full justify-center">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[12px] font-medium text-gray-500">Without Zyra</span>
                  <span className="text-lg font-bold font-mono text-gray-300" data-counter>$200</span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-sm" />
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[12px] font-medium text-brand-accent">With Zyra (Optimized)</span>
                  <span className="text-lg font-bold font-mono text-brand-accent" data-counter>$120</span>
                </div>
                <div className="w-[60%] bg-brand-accent h-3 rounded-sm" />
              </div>
              <div className="text-right text-[11px] font-bold tracking-[0.15em] text-brand-accent mt-2 border-t border-white/[0.06] pt-4">SAVINGS: $80.00</div>
            </div>
          </div>
        </section>

        {/* ============ ARCHITECTURE (#6.4) ============ */}
        <section className="w-full py-28 bg-brand-surface border-y border-white/[0.06] flex flex-col items-center px-6 overflow-hidden reveal">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-4">THE PIPELINE</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-center">Smart Proxy Architecture.</h2>
          <p className="text-gray-400 text-[15px] text-center max-w-xl mb-20 leading-relaxed">
            One endpoint. Infinite possibilities. Zyra intercepts requests, runs cost analysis, and routes seamlessly.
          </p>

          <div className="w-full max-w-5xl relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 px-4">
            {/* Left: App */}
            <div className="tilt-card bg-brand-surface-high border border-white/10 rounded-xl p-6 z-10 w-full md:w-64 text-center shadow-lg relative">
              <div className="tilt-glare" />
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Zap className="w-5 h-5 text-gray-300" />
              </div>
              <div className="font-bold mb-1">Your Application</div>
              <div className="text-[11px] font-mono text-gray-500">api.zyra.dev/v1/chat</div>
            </div>

            {/* Connecting line */}
            <div className="hidden md:block absolute left-[15rem] right-[50%] h-[1px] bg-gradient-to-r from-white/20 to-brand-accent-dim z-0 top-1/2">
              <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-2 h-2 bg-brand-accent rounded-full shadow-[0_0_10px_rgba(255,166,158,0.8)] animate-ping" />
            </div>

            {/* Center: Zyra */}
            <div className="bg-[#0A0A0B] border border-brand-border-accent rounded-2xl p-8 z-10 w-full md:w-80 shadow-[0_0_40px_rgba(255,166,158,0.08)] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-accent text-black text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                ZYRA COST OPTIMIZER
              </div>
              <div className="flex flex-col gap-3 font-mono text-[11px]">
                <div className="flex justify-between items-center border border-white/5 bg-white/5 p-3 rounded">
                  <span className="text-gray-400">1. Firewall & Auth</span>
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <div className="flex justify-between items-center border border-brand-accent/20 bg-brand-accent/5 p-3 rounded">
                  <span className="text-brand-accent">2. Cost Engine</span>
                  <span className="text-brand-accent animate-pulse text-[10px]">Running...</span>
                </div>
                <div className="flex justify-between items-center border border-white/5 bg-white/5 p-3 rounded">
                  <span className="text-gray-400">3. Quality Guard</span>
                  <span className="text-gray-600 text-[10px]">Pending</span>
                </div>
              </div>
            </div>

            {/* Connecting lines */}
            <div className="hidden md:block absolute left-[50%] right-[16rem] top-1/2 -translate-y-1/2 z-0 h-32">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10 origin-left transform -rotate-12 translate-y-16" />
              <div className="absolute top-[48%] left-0 w-full h-[1px] bg-brand-accent/40" />
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 origin-left transform rotate-12 -translate-y-16" />
            </div>

            {/* Right: Providers */}
            <div className="flex flex-col gap-4 z-10 w-full md:w-64">
              <div className="bg-brand-surface-high border border-white/5 p-4 rounded-xl opacity-50 flex justify-between items-center">
                <div><div className="font-bold text-[13px]">GPT-4o</div><div className="text-gray-500 text-[11px] font-mono">$0.02 / 1K</div></div>
                <div className="text-[9px] text-gray-500 uppercase tracking-[0.15em] border border-gray-600 rounded px-2 py-1">Skipped</div>
              </div>
              <div className="bg-brand-surface-high border border-brand-accent p-4 rounded-xl shadow-[0_0_20px_rgba(255,166,158,0.12)] flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent" />
                <div className="pl-2"><div className="font-bold text-[13px]">Claude 3 Haiku</div><div className="text-brand-accent text-[11px] font-mono">$0.005 / 1K</div></div>
                <div className="text-[10px] text-black bg-brand-accent font-bold uppercase tracking-[0.15em] rounded px-2 py-1">Routed</div>
              </div>
              <div className="bg-brand-surface-high border border-white/5 p-4 rounded-xl opacity-50 flex justify-between items-center">
                <div><div className="font-bold text-[13px]">Groq Llama 3</div><div className="text-gray-500 text-[11px] font-mono">Fallback</div></div>
                <div className="text-[9px] text-gray-500 uppercase tracking-[0.15em] border border-gray-600 rounded px-2 py-1">Standby</div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ COST COMPARISON (#6.5 Premium Tax) ============ */}
        <section className="w-full max-w-7xl mx-auto py-32 px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center reveal">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 leading-snug">
              Stop paying &ldquo;The Premium Tax&rdquo; for<br />simple reasoning tasks.
            </h2>
            <p className="text-gray-400 text-[14px] mb-10 leading-relaxed max-w-lg">
              Zyra evaluates intent and automatically routes to cheaper models when possible, maintaining quality whilst tracking savings per request.
            </p>
            <ul className="space-y-5">
              {['Automatic cost reduction & intelligent routing', 'Retry mechanism with fallback providers', 'Granular cost tracking and observability'].map((t, i) => (
                <li key={i} className="flex items-center gap-4 text-[14px] font-medium text-gray-300">
                  <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center shrink-0"><div className="w-2 h-2 bg-white rounded-full" /></div>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="tilt-card bg-brand-surface border border-white/[0.06] rounded-xl p-10 spotlight-card relative">
            <div className="tilt-glare" />
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-10 border-b border-white/[0.06] pb-4">Cost per 1M Tokens</div>
            <div className="mb-10">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[12px] font-medium text-gray-300">Standard LLM API</span>
                <span className="text-2xl font-bold font-mono" data-counter>$16.20</span>
              </div>
              <div className="w-full bg-brand-accent h-4 rounded-sm" />
            </div>
            <div className="mb-12">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[12px] font-medium text-gray-300">Zyra Optimized</span>
                <span className="text-2xl font-bold font-mono" data-counter>$1.40</span>
              </div>
              <div className="w-[10%] bg-white h-4 rounded-sm" />
            </div>
            <div className="pt-6 border-t border-white/[0.06] text-[9px] text-gray-500 font-mono tracking-[0.15em] uppercase">
              ANALYZING 100M+ API CALLS / DAY • STATE_ROUTING_ON
            </div>
          </div>
        </section>

        <div className="w-full max-w-7xl h-[1px] bg-white/[0.04]" />

        {/* ============ CODE INTEGRATION (#6.5) ============ */}
        <section className="w-full max-w-7xl mx-auto py-32 px-6 reveal">
          <div className="mb-20">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-4">THE WORKFLOW</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-snug">Drop-in replacement.<br />No refactor.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            {[
              { n: '01', t: 'Drop-in SDK', d: 'Simply swap in the Zyra client which replicates native integrations perfectly.' },
              { n: '02', t: 'Transparent Intelligence', d: 'We intercept the .create() call to inject latency optimizations and dynamic routing.' },
              { n: '03', t: 'Seamless Execution', d: 'Metrics and tokens are logged asynchronously to your dashboard, with sub-ms overhead.' },
            ].map((s, i) => (
              <div key={i} className="reveal-stagger" style={{ '--stagger': `${i * 120}ms` } as React.CSSProperties}>
                <div className="text-gray-600 text-3xl font-light mb-6 tracking-tighter">{s.n}</div>
                <h4 className="font-bold text-[16px] mb-3 text-gray-200">{s.t}</h4>
                <p className="text-gray-400 text-[14px] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="bg-brand-surface border border-white/[0.06] rounded-xl p-8 font-mono text-[13px] text-gray-300 w-full overflow-x-auto shadow-2xl relative">
            <CopyButton text={CODE_SNIPPET} />
            <div className="absolute top-0 right-20 bg-white/10 text-white text-[10px] px-3 py-1 font-sans rounded-b-md">Node.js</div>
            <div className="flex gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-white/10" /><div className="w-3 h-3 rounded-full bg-white/10" /><div className="w-3 h-3 rounded-full bg-white/10" />
            </div>
            <pre className="leading-loose"><code>{CODE_SNIPPET}</code></pre>
          </div>
        </section>

        <div className="w-full max-w-7xl h-[1px] bg-white/[0.04]" />

        {/* ============ TRAFFIC OBSERVER (#6.6) ============ */}
        <section className="w-full max-w-7xl mx-auto py-32 px-6 flex flex-col lg:flex-row gap-16 justify-between items-start reveal">
          <div className="w-full lg:w-1/3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 leading-snug">Observe your<br />intelligence<br />in real-time.</h2>
            <p className="text-gray-400 text-[14px] mb-12 leading-relaxed">Full visibility into which models were chosen and why. Track exact savings and execution paths.</p>
            <div className="flex gap-4">
              <div className="tilt-card bg-brand-surface border border-white/[0.06] p-6 rounded-xl w-1/2 spotlight-card relative">
                <div className="tilt-glare" />
                <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-[0.15em] mb-4">TOTAL SAVINGS</div>
                <div className="text-3xl font-bold" data-counter>$4,230</div>
              </div>
              <div className="border border-white/10 p-6 rounded-xl w-1/2 bg-white/5">
                <div className="text-[10px] uppercase font-semibold text-brand-accent tracking-[0.15em] mb-4">COST REDUCTION</div>
                <div className="text-3xl font-bold text-brand-accent" data-counter>60.0%</div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-2/3">
            <div className="border-t border-white/10 overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-gray-500 tracking-[0.15em] uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-4 pb-6 font-semibold">REQUEST</th>
                    <th className="py-4 pb-6 font-semibold">ORIGINAL → ROUTED</th>
                    <th className="py-4 pb-6 font-semibold text-right">BEFORE</th>
                    <th className="py-4 pb-6 font-semibold text-right">AFTER</th>
                    <th className="py-4 pb-6 font-semibold text-right">SAVED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {TRAFFIC_DATA.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 text-gray-200">{r.id}</td>
                      <td className="py-4">
                        <span className="text-gray-400">{r.from}</span>
                        <span className="text-gray-600 mx-2">→</span>
                        <span className="text-white">{r.to}</span>
                      </td>
                      <td className="py-4 text-right text-gray-400">{r.before}</td>
                      <td className="py-4 text-right text-brand-accent font-bold">{r.after}</td>
                      <td className="py-4 text-right">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${r.status === 'Maintained' ? 'text-gray-500 bg-white/5' : 'text-brand-accent bg-brand-accent/10'}`}>
                          {r.pct}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="w-full max-w-7xl h-[1px] bg-white/[0.04]" />

        {/* ============ PRICING (#6.7) ============ */}
        <section id="pricing" className="w-full py-32 text-center flex flex-col items-center px-6 reveal">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-6">PRICING</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Zyra is not a cost. It reduces spend.</h2>
          <p className="text-gray-400 text-[14px] mb-10">Choose the plan that fits your scale.</p>

          {/* Toggle (#32) */}
          <div className="flex items-center gap-3 mb-16 text-[13px] font-medium text-gray-400">
            <span className={!isYearly ? 'text-white' : ''}>Monthly</span>
            <div className={`toggle-track ${isYearly ? 'active' : ''}`} onClick={() => setIsYearly(!isYearly)}>
              <div className="toggle-thumb" />
            </div>
            <span className={isYearly ? 'text-white' : ''}>Yearly <span className="text-brand-accent text-[11px]">-20%</span></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full max-w-6xl">
            {[
              { icon: ShieldCheck, name: 'Builder', price: 'Free', sub: 'Forever', items: ['1,000 requests/mo', 'Basic cost optimizer', 'Standard logging', 'Community support'], highlight: false },
              { icon: Zap, name: 'Pro', price: isYearly ? '₹799' : '₹999', sub: '/month', items: ['50,000 requests/mo', 'Full contextual optimizer', 'Real-time dashboard', 'Priority support'], highlight: true },
              { icon: FileText, name: 'Growth', price: isYearly ? '₹3,199' : '₹3,999', sub: '/month', items: ['Unlimited requests', 'Custom routing logic', 'Team sharing & SSO', 'Dedicated SLA'], highlight: false },
            ].map((plan, i) => (
              <div key={i} className={`tilt-card spotlight-card relative border ${plan.highlight ? 'border-brand-accent shadow-[0_0_15px_rgba(255,166,158,0.08)]' : 'border-white/[0.06]'} p-8 rounded-xl ${plan.highlight ? 'bg-gradient-to-b from-brand-accent/5 to-transparent' : 'bg-brand-surface'}`}>
                <div className="tilt-glare" />
                <plan.icon className="w-5 h-5 mb-5 text-brand-accent" strokeWidth={1.5} />
                <h4 className="font-bold text-[18px] mb-1">{plan.name}</h4>
                <p className="text-brand-accent font-medium text-[13px] mb-4">
                  <span data-counter>{plan.price}</span> {plan.sub}
                </p>
                <p className="text-gray-400 text-[13px] leading-relaxed mb-6">{plan.highlight ? 'Designed for scale.' : plan.name === 'Builder' ? 'Perfect for prototyping.' : 'For enterprise teams.'}</p>
                <ul className="text-[13px] text-gray-400 space-y-2.5">
                  {plan.items.map((it, j) => (
                    <li key={j} className="flex items-center gap-2"><Check size={14} className="text-brand-accent shrink-0" />{it}</li>
                  ))}
                </ul>
                <Link href={plan.name === 'Builder' ? '/register' : '/register'} className={`shimmer-btn mt-8 block text-center px-6 py-3 rounded-lg text-[13px] font-bold transition-all ${plan.highlight ? 'bg-brand-accent text-black hover:bg-white' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`} data-magnetic>
                  {plan.name === 'Builder' ? 'Get Started Free' : plan.name === 'Pro' ? 'Start Pro Trial' : 'Get Growth'}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <div className="w-full max-w-7xl h-[1px] bg-white/[0.04]" />

        {/* ============ FAQ (#34) ============ */}
        <section className="w-full max-w-3xl mx-auto py-32 px-6 reveal">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-4 text-center">FAQ</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">Common questions.</h2>
          <div className="space-y-3">
            {FAQ_DATA.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </section>

        {/* ============ FINAL CTA (#6.8) ============ */}
        <section className="w-full max-w-7xl mx-auto py-24 px-6 md:pb-40 reveal">
          <div className="bg-[#050505] border border-white/[0.04] rounded-[1.5rem] px-8 py-24 md:p-32 text-center relative overflow-hidden flex flex-col items-center">
            <div className="aurora-mesh" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-white opacity-20" />
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-10 border border-white/10 rounded-full px-4 py-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" /> THE AI COST OPTIMIZER
              </div>
              <h2 className="text-5xl md:text-[72px] font-black tracking-[-0.04em] leading-[0.95] mb-10 uppercase max-w-4xl">
                Start optimizing your<br />AI spend today.
              </h2>
              <p className="text-gray-400 text-[15px] max-w-lg mx-auto mb-12 leading-relaxed font-medium">
                Zyra sits between your app and AI models and automatically reduces costs without changing your code.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/register" className="shimmer-btn bg-brand-accent text-black px-8 py-4 rounded-lg text-[13px] font-bold hover:bg-white transition-all" data-magnetic>
                  GET STARTED NOW
                </Link>
                <Link href="#docs" className="shimmer-btn bg-transparent border border-white/10 text-white px-8 py-4 rounded-lg text-[13px] font-bold hover:bg-white/5 transition-all" data-magnetic>
                  VIEW DOCUMENTATION
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="w-full border-t border-white/[0.04] pt-24 pb-12 px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16 md:gap-0">
          <div className="max-w-xs">
            <div className="logo-glitch font-black text-xl tracking-tight mb-4">ZYRA</div>
            <p className="text-gray-500 text-[13px] leading-relaxed">Accelerating intelligence, efficiency, and scale for modern operators.</p>
          </div>
          <div className="flex flex-wrap gap-16 md:gap-32">
            {[
              { title: 'PLATFORM', links: [
                { label: 'Semantic Proxy', href: null },
                { label: 'API Architecture', href: null },
                { label: 'Observability', href: null },
              ]},
              { title: 'COMPANY', links: [
                { label: 'Pricing', href: '#pricing' },
                { label: 'Documentation', href: null },
                { label: 'Terms of Service', href: '/terms' },
              ]},
              { title: 'LEGAL', links: [
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Security', href: null },
                { label: 'Status', href: null },
              ]},
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-6">{col.title}</h4>
                <ul className="space-y-4 text-[13px] text-gray-400 font-medium">
                  {col.links.map((l, j) => (
                    <li key={j}>
                      {l.href ? (
                        <Link href={l.href} className="fill-underline hover:text-white transition-colors">{l.label}</Link>
                      ) : (
                        <a onClick={() => toast(`${l.label} page coming soon`, { icon: '🚀' })} className="fill-underline hover:text-white transition-colors cursor-pointer">{l.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-600 font-mono">
          <div>© 2026 ZYRA. ALL RIGHTS RESERVED.</div>
          <div>v0.1.0-BETA</div>
        </div>
      </footer>
    </div>
  )
}