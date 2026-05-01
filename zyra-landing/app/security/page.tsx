'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Server, Key, AlertTriangle } from 'lucide-react'

const PRACTICES = [
  { icon: Lock, title: 'Encryption at Rest', desc: 'All provider API keys are encrypted using AES-256 before storage. Keys are only decrypted at the moment of request forwarding and never logged or cached in plaintext.' },
  { icon: Shield, title: 'Encryption in Transit', desc: 'All communication between your application and Zyra, and between Zyra and AI providers, is encrypted via TLS 1.3. No data is transmitted in plaintext.' },
  { icon: Key, title: 'Authentication', desc: 'JWT-based authentication with configurable expiration. API keys use cryptographically secure random generation with bcrypt-hashed storage. Brute-force protection on all auth endpoints.' },
  { icon: Eye, title: 'Zero Prompt Logging', desc: 'Zyra does NOT store, log, or retain the content of your prompts or AI model responses. Only metadata (model, tokens, cost, latency) is logged for analytics purposes.' },
  { icon: Server, title: 'Infrastructure Security', desc: 'Hosted on SOC 2 compliant infrastructure. Database access restricted to application-level service accounts. No direct SSH access to production servers.' },
  { icon: AlertTriangle, title: 'Rate Limiting & Abuse Prevention', desc: 'Per-organization rate limits based on plan tier. IP-based throttling to prevent DDoS. Request validation to block malformed or oversized payloads.' },
]

export default function SecurityPage() {
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
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" /> SECURITY
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-tight mb-6">Security</h1>
          <p className="text-gray-400 text-[16px] leading-relaxed max-w-2xl">
            Security is foundational to Zyra. Your API keys, traffic, and data are protected at every layer of the stack.
          </p>
        </div>

        {/* Trust Banner */}
        <div className="mb-16 p-6 bg-brand-surface border border-brand-accent/20 rounded-xl flex flex-col sm:flex-row items-start gap-6">
          <Shield className="w-8 h-8 text-brand-accent shrink-0 mt-1" strokeWidth={1.5} />
          <div>
            <h3 className="font-bold text-[15px] mb-2">Our Security Promise</h3>
            <p className="text-gray-400 text-[14px] leading-relaxed">
              Zyra is a pass-through proxy. We never store prompt content or model responses. Your provider keys are encrypted at rest. 
              We operate on a zero-trust architecture where every request is authenticated and every action is logged.
            </p>
          </div>
        </div>

        {/* Practices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {PRACTICES.map((p, i) => (
            <div key={i} className="p-6 bg-brand-surface border border-white/[0.06] rounded-xl hover:border-brand-accent/20 transition-all">
              <p.icon className="w-5 h-5 text-brand-accent mb-4" strokeWidth={1.5} />
              <h3 className="text-[15px] font-bold mb-2">{p.title}</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Compliance */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Compliance & Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'GDPR', desc: 'Data minimization, right to deletion, and DPA available on request.' },
              { label: 'SOC 2 Type II', desc: 'Infrastructure hosted on SOC 2 compliant cloud providers.' },
              { label: 'OWASP Top 10', desc: 'Application security tested against OWASP Top 10 vulnerabilities.' },
            ].map((c, i) => (
              <div key={i} className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-brand-accent font-bold text-[14px] mb-2">{c.label}</div>
                <p className="text-gray-400 text-[13px] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Responsible Disclosure */}
        <div className="p-8 bg-brand-surface border border-white/[0.06] rounded-xl">
          <h3 className="font-bold text-[15px] mb-3">Responsible Disclosure</h3>
          <p className="text-gray-400 text-[14px] leading-relaxed mb-4">
            If you discover a security vulnerability, please report it responsibly. We appreciate the security research community 
            and will acknowledge valid reports.
          </p>
          <p className="text-gray-400 text-[13px]">
            Email: <a href="mailto:security@zyra.dev" className="text-brand-accent hover:underline">security@zyra.dev</a>
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
