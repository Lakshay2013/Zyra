'use client'

import Link from 'next/link'

const NAV_LINKS = [
  { href: '#features',     label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing',      label: 'Pricing' },
  { href: '#docs',         label: 'Docs' },
]

export default function HeroSection() {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-white"
      style={{ background: '#050d1a', fontFamily: 'Figtree, sans-serif' }}
    >
      {/* Radial glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(99,102,241,0.38) 0%, transparent 68%)' }} />

      {/* Grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.6) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Side glows */}
      <div aria-hidden className="pointer-events-none absolute -left-48 top-1/3 h-96 w-96 rounded-full"
        style={{ background: 'rgba(99,102,241,0.1)', filter: 'blur(90px)' }} />
      <div aria-hidden className="pointer-events-none absolute -right-48 top-1/2 h-80 w-80 rounded-full"
        style={{ background: 'rgba(139,92,246,0.09)', filter: 'blur(90px)' }} />

      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-20 px-6 py-6 md:px-12 md:py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.45)' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="#a5b4fc" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight">zyra</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-semibold text-slate-400 transition-colors hover:text-white">
              Sign in
            </Link>
            <Link href="/register"
              className="rounded-full px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 0 22px rgba(99,102,241,0.4)' }}>
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero body */}
      <main className="relative z-10 flex min-h-screen items-center px-6 md:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">

            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.28)' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                LLM Observability &amp; Risk Monitoring
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-5 text-5xl font-black leading-[1.07] tracking-tight md:text-6xl lg:text-[72px]">
              Every LLM call,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                logged
              </span>{' '}
              and{' '}
              <span style={{
                background: 'linear-gradient(135deg, #a78bfa, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                scored.
              </span>
            </h1>

            {/* Sub */}
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-400">
              Proxy your LLM traffic through Zyra. Get instant visibility into every call —
              PII leaks, prompt injections, abuse patterns, cost, and latency.
              All in one dashboard.
            </p>

            {/* CTAs */}
            <div className="mb-12 flex flex-wrap items-center gap-4">
              <Link href="/register"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 0 32px rgba(99,102,241,0.45)' }}>
                Start for free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-slate-300 transition-colors hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.11)' }}>
                See how it works
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['#4f46e5', '#7c3aed', '#6d28d9'].map((bg, i) => (
                  <div key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: bg, outline: '2px solid #050d1a' }}>
                    {['A', 'B', 'C'][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500">
                Trusted by early teams shipping AI products
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer strip */}
      <footer className="absolute inset-x-0 bottom-0 z-10 px-6 py-5 md:px-12"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-xs text-slate-700">© 2026 Zyra · v1.0</p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'GitHub'].map(t => (
              <a key={t} href="#" className="text-xs text-slate-700 hover:text-slate-400 transition-colors">{t}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}