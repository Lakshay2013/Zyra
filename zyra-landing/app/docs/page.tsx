'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const SECTIONS = [
  { title: 'Getting Started', items: [
    { label: 'Quick Start Guide', desc: 'Go from zero to your first optimized request in under 5 minutes.' },
    { label: 'Installation', desc: 'Install the Zyra SDK via npm: npm install zyra-sdk' },
    { label: 'Authentication', desc: 'Generate an API key from your dashboard and pass it to the SDK client.' },
  ]},
  { title: 'Core Concepts', items: [
    { label: 'Proxy Architecture', desc: 'Understand how Zyra intercepts, optimizes, and routes your API calls.', link: '/architecture' },
    { label: 'Cost Optimization', desc: 'How the cost engine evaluates task complexity and selects models.' },
    { label: 'Quality Guard', desc: 'How Zyra prevents quality degradation when downgrading models.' },
    { label: 'Fallback Chains', desc: 'Configure automatic failover between providers for high availability.' },
  ]},
  { title: 'API Reference', items: [
    { label: 'POST /v1/chat/completions', desc: 'OpenAI-compatible chat completions endpoint. Supports all standard parameters.' },
    { label: 'GET /api/logs', desc: 'Retrieve paginated request logs with cost and routing metadata.' },
    { label: 'GET /api/org', desc: 'Get organization details, plan info, and usage statistics.' },
    { label: 'PUT /api/org/providers', desc: 'Configure provider API keys (OpenAI, Anthropic, Groq, Gemini).' },
    { label: 'POST /api/keys', desc: 'Create a new API key for SDK authentication.' },
    { label: 'DELETE /api/keys/:id', desc: 'Revoke an existing API key.' },
  ]},
  { title: 'SDK Reference', items: [
    { label: 'Node.js SDK', desc: 'npm install zyra-sdk — drop-in replacement for the OpenAI client.' },
    { label: 'REST API', desc: 'Use any HTTP client. Set x-zyra-api-key header and point to your Zyra endpoint.' },
    { label: 'Python (Coming Soon)', desc: 'Python SDK with full async support and LangChain integration.' },
  ]},
  { title: 'Dashboard', items: [
    { label: 'Overview', desc: 'Real-time metrics, cost savings, and request volume at a glance.' },
    { label: 'Providers', desc: 'Configure and manage API keys for all supported AI providers.' },
    { label: 'Logs', desc: 'Browse, filter, and export detailed request logs.' },
    { label: 'Billing', desc: 'View plan details, usage, and upgrade options.' },
  ]},
]

export default function DocsPage() {
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
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" /> DOCS
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-tight mb-6">Documentation</h1>
          <p className="text-gray-400 text-[16px] leading-relaxed max-w-2xl">
            Everything you need to integrate, configure, and optimize with Zyra.
          </p>
        </div>

        {/* Quick Start Code Block */}
        <div className="mb-16 bg-brand-surface border border-white/[0.06] rounded-xl p-6 overflow-x-auto">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-4">QUICK START</div>
          <pre className="font-mono text-[13px] text-gray-300 leading-loose"><code>{`npm install zyra-sdk

import Zyra from "zyra-sdk";

const client = new Zyra({ apiKey: process.env.ZYRA_KEY });

const res = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Hello" }],
});`}</code></pre>
        </div>

        {/* Sections */}
        <div className="space-y-16">
          {SECTIONS.map((section, i) => (
            <div key={i}>
              <h2 className="text-xl font-bold tracking-tight mb-6 text-gray-100">{section.title}</h2>
              <div className="space-y-3">
                {section.items.map((item, j) => (
                  <div key={j} className="group">
                    {item.link ? (
                      <Link href={item.link} className="block p-5 bg-brand-surface border border-white/[0.06] rounded-xl hover:border-brand-accent/20 transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-[14px] font-bold text-gray-200 group-hover:text-brand-accent transition-colors">{item.label}</h4>
                            <p className="text-gray-500 text-[13px] mt-1">{item.desc}</p>
                          </div>
                          <span className="text-gray-600 text-[13px]">→</span>
                        </div>
                      </Link>
                    ) : (
                      <div className="p-5 bg-brand-surface border border-white/[0.06] rounded-xl">
                        <h4 className="text-[14px] font-bold text-gray-200">{item.label}</h4>
                        <p className="text-gray-500 text-[13px] mt-1">{item.desc}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {i < SECTIONS.length - 1 && <div className="mt-12 h-[1px] bg-white/[0.04]" />}
            </div>
          ))}
        </div>

        <div className="mt-20 p-8 bg-brand-surface border border-white/[0.06] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-[15px] mb-1">Need help?</h3>
            <p className="text-gray-400 text-[13px]">Reach out to us at <a href="mailto:support@zyra.dev" className="text-brand-accent hover:underline">support@zyra.dev</a></p>
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
