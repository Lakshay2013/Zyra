'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Terminal, Shield, EyeOff, Route, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="bg-background text-on-background font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      
      {/* TopAppBar */}
      <header className="bg-[#131313]/90 backdrop-blur-md sticky top-0 z-50 w-full border-b border-outline-variant/10">
        <nav className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <span className="font-headline italic text-2xl text-[#c8bfff] tracking-tight">Zyra</span>
            <div className="hidden md:flex gap-6 items-center">
              <a className="text-[#c8bfff] border-b-2 border-[#c8bfff] pb-1 font-medium text-sm" href="#">Features</a>
              <a className="text-gray-400 font-medium hover:text-[#c8bfff] transition-colors duration-300 text-sm" href="#">Pricing</a>
              <a className="text-gray-400 font-medium hover:text-[#c8bfff] transition-colors duration-300 text-sm" href="#">Docs</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="p-2 text-on-surface-variant hover:text-[#c8bfff] transition-colors" title="Login via Terminal">
              <Terminal className="w-5 h-5" />
            </Link>
            <Link href="/register" className="bg-gradient-to-br from-primary-container to-primary text-on-primary-container px-5 py-2 rounded-sm font-label text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-8 bg-grid pt-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 max-w-5xl"
          >
            <span className="font-label text-primary text-[11px] font-bold tracking-[0.2em] uppercase mb-6 block border border-primary/20 bg-primary/5 py-1.5 px-3 rounded-full w-max mx-auto">
              Version 2.0 now in public beta
            </span>
            <h1 className="font-headline text-5xl md:text-[80px] text-on-surface leading-[1.05] mb-8 tracking-tight">
              The <span className="italic font-normal">Intelligence Layer</span> <br className="hidden md:block"/> for Your Infrastructure
            </h1>
            <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              A unified proxy to intercept, audit, and intelligently route every LLM request. High-performance infrastructure designed for the modern AI enterprise.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full md:w-auto px-8 py-4 bg-gradient-to-br from-primary-container to-primary text-on-primary-container font-label rounded-sm text-sm font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
                Get Started
              </Link>
              <a href="#docs" className="w-full md:w-auto px-8 py-4 bg-surface-container-high text-on-surface font-label rounded-sm text-sm font-bold hover:bg-surface-container-highest transition-colors">
                Read Docs
              </a>
            </div>
          </motion.div>

          {/* Hero Decorative Image */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="mt-24 w-full max-w-5xl rounded-lg overflow-hidden glass-effect p-1 border border-outline-variant/20 relative z-10"
          >
            <img 
              alt="Technical UI Preview" 
              className="w-full h-auto rounded-md opacity-80" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC17KAm9r-2e18cozD-CcbkicoGdrrNNabnvyQBfDwzWmH4O7W5tWQVhjdLDuchu-VJXWtW7bXOcRyD32gMADsp6qOVvOgiNulTxdCfMuQClY85_CrCz9KDBxA4PQ3Gu6p_7Wy8wdvntuGcEcSAVZbLtDC4V3xmHGKp6hImJ3L7ELnyQf2quL1GBWlvToEVsMqGgEmEr3BPKHzuVTWM3mI6sJ1yBv10y_9wJx0xSptIJD3SulKdNfTftxlmobEvTlawNqFvm3kihhI"
            />
          </motion.div>
        </section>

        {/* The Problem/Solution: Intercept. Redact. Route. */}
        <section className="py-32 px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="p-10 bg-surface-container-low rounded-lg group hover:bg-surface-container border border-transparent hover:border-outline-variant/10 transition-all cursor-default shadow-sm"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary mb-6 rounded-full group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-headline text-3xl mb-4 tracking-tight">Intercept</h3>
              <p className="font-body text-on-surface-variant mb-8 leading-relaxed">
                Every request flows through Zyra's high-performance proxy layer, creating a single point of truth for your entire AI stack.
              </p>
              <span className="font-label text-xs font-bold uppercase tracking-wider text-primary group-hover:underline">Explore Proxy Specs &rarr;</span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-10 bg-surface-container-low rounded-lg group hover:bg-surface-container border border-transparent hover:border-outline-variant/10 transition-all cursor-default shadow-sm"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-tertiary/10 text-tertiary mb-6 rounded-full group-hover:scale-110 transition-transform">
                <EyeOff className="w-6 h-6" />
              </div>
              <h3 className="font-headline text-3xl mb-4 tracking-tight">Redact</h3>
              <p className="font-body text-on-surface-variant mb-8 leading-relaxed">
                Real-time PII detection and masking ensures sensitive data never reaches third-party LLM providers like OpenAI or Anthropic.
              </p>
              <span className="font-label text-xs font-bold uppercase tracking-wider text-tertiary group-hover:underline">Security Protocols &rarr;</span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-10 bg-surface-container-low rounded-lg group hover:bg-surface-container border border-transparent hover:border-outline-variant/10 transition-all cursor-default shadow-sm"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-secondary/10 text-secondary mb-6 rounded-full group-hover:scale-110 transition-transform">
                <Route className="w-6 h-6" />
              </div>
              <h3 className="font-headline text-3xl mb-4 tracking-tight">Route</h3>
              <p className="font-body text-on-surface-variant mb-8 leading-relaxed">
                Intelligently switch between models based on latency, cost, or availability without changing a single line of client code.
              </p>
              <span className="font-label text-xs font-bold uppercase tracking-wider text-secondary group-hover:underline">Routing Engine &rarr;</span>
            </motion.div>
          </div>
        </section>

        {/* Observer Deep Dive */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-32 bg-surface-container-lowest border-y border-outline-variant/10"
        >
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 blur-[80px]"></div>
              <div className="glass-effect p-4 rounded-xl border border-outline-variant/20 shadow-2xl relative z-10">
                <div className="flex items-center justify-between mx-2 mb-4 mt-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-error/90"></div>
                    <div className="w-3 h-3 rounded-full bg-tertiary/90"></div>
                    <div className="w-3 h-3 rounded-full bg-primary/90"></div>
                  </div>
                  <span className="font-label text-[10px] font-bold text-on-surface-variant tracking-[0.2em]">OBSERVER_V4.X_LIVE</span>
                </div>
                <img 
                  alt="Observer Dashboard Preview" 
                  className="rounded-lg border border-outline-variant/20 shadow-inner" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDp515b6EKBryOaDEDEYis3_nZYqyHj7o8Pm-n-Q6Aauvl_WUHByy_cldsNXSU-Abq3CGQiKdgoPdp2Vun-jOGlTWBa-SmgxTUQJpUR1qhF8Qn6Bm2JQCropgWp8vhYUYr1ZXm6SZ6rRW2j--ogn_BTwfOHlI8VqYcJVhHaLWaVH_snQ5_dj96LNQK7zdVXRaq8FevviXs1qndFJXlf77BGGZlYte_HMEzfvATGpbvJrEaKxabQA6i6zVfbJCLaaYGPNtK2ePdOH9A"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="font-label text-primary text-[10px] font-bold uppercase tracking-[0.25em] mb-4 block">Real-time Auditing</span>
              <h2 className="font-headline text-5xl mb-6 tracking-tight text-on-surface">The Observer</h2>
              <p className="text-on-surface-variant text-lg mb-8 leading-relaxed font-medium">
                Complete visibility into every prompt and completion. Identify prompt injections, monitor PII leaks, and audit model behavior with granular precision.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" />
                  <span className="font-body text-on-surface font-medium">Automatic PII Redaction across 50+ entities</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" />
                  <span className="font-body text-on-surface font-medium">Vector-based Threat Detection for prompt injections</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" />
                  <span className="font-body text-on-surface font-medium">Latency breakdown by provider and region</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Routing Engine Deep Dive */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="py-32"
        >
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="font-label text-primary text-[10px] font-bold uppercase tracking-[0.25em] mb-4 block">Elastic Scale</span>
              <h2 className="font-headline text-5xl mb-6 tracking-tight text-on-surface">Routing Rules Engine</h2>
              <p className="text-on-surface-variant text-lg mb-8 leading-relaxed font-medium">
                Never worry about rate limits or outages again. Zyra dynamically balances load across different regions and providers based on real-time availability.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-5 bg-surface-container rounded-sm border-l-2 border-primary shadow-sm">
                  <div className="font-label text-[10px] text-primary uppercase mb-2 font-bold tracking-widest">Cost Optimization</div>
                  <div className="font-headline text-2xl text-on-surface">Smart Fallback</div>
                </div>
                <div className="p-5 bg-surface-container rounded-sm border-l-2 border-primary shadow-sm">
                  <div className="font-label text-[10px] text-primary uppercase mb-2 font-bold tracking-widest">High Availability</div>
                  <div className="font-headline text-2xl text-on-surface">Auto-Scaling</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px]"></div>
              <div className="glass-effect p-2 rounded-xl border border-outline-variant/10 relative z-10 shadow-2xl">
                <img 
                  alt="Routing Engine Visual" 
                  className="rounded-lg shadow-inner" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZ-7-1eorBpM0-yVNGUISBIhKeEaVASeOkStjB0RBCM7czVzIeHdqbohLw7ZSpjgDzKt7YpVwcXzKdCxNIMSH-sajSvT0-BfmXk3bnmD7IIg6fYQgBkULUmIOC5pLyly1zN0gMJE_nPZQVAPLuoaYTEUx4oMwwkuCOv4pjV9T3w9N6800f2iMtqbQGuzMbsho4flwUWNFTdc6EhY-Dvjnw8PPT4Octzv6pRbTr5W1GN-RepddR9yMj8szi9F4cTsCRHJNpDWI6sZs"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Social Proof/Stats */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="py-32 bg-surface-container-lowest border-y border-outline-variant/10"
        >
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="text-center">
                <div className="font-headline text-6xl md:text-8xl text-gradient mb-4 font-bold tracking-tight">99.9%</div>
                <div className="font-label text-sm uppercase tracking-[0.2em] font-bold text-on-surface-variant">Guaranteed Uptime</div>
              </div>
              <div className="text-center">
                <div className="font-headline text-6xl md:text-8xl text-gradient mb-4 font-bold tracking-tight">&lt;10ms</div>
                <div className="font-label text-sm uppercase tracking-[0.2em] font-bold text-on-surface-variant">Proxy Latency</div>
              </div>
              <div className="text-center">
                <div className="font-headline text-6xl md:text-8xl text-gradient mb-4 font-bold tracking-tight">1B+</div>
                <div className="font-label text-sm uppercase tracking-[0.2em] font-bold text-on-surface-variant">Tokens Proxied</div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Final CTA */}
        <section className="py-40 relative overflow-hidden bg-surface">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
            <h2 className="font-headline text-5xl md:text-7xl mb-8 tracking-tight text-on-surface">Secure your AI infrastructure today.</h2>
            <p className="font-body text-xl text-on-surface-variant mb-12 font-medium">Join 200+ companies building production-ready AI products with Zyra.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="px-10 py-5 bg-gradient-to-br from-primary-container to-primary text-on-primary-container font-label rounded-sm text-base font-bold shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
                Deploy Zyra Now
              </Link>
              <a href="mailto:architect@zyra.dev" className="px-10 py-5 bg-surface-container-high text-on-surface font-label rounded-sm text-base font-bold hover:bg-surface-container-highest transition-colors border border-outline-variant/10">
                Talk to an Architect
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0e0e0e] w-full py-16 px-8 border-t border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto">
          <div className="col-span-1 md:col-span-1">
            <span className="font-headline italic text-2xl text-white block mb-6">Zyra</span>
            <p className="font-body text-gray-500 text-sm leading-relaxed pr-8">
              © 2026 Zyra AI Infrastructure. Built for the high-end curator.
            </p>
          </div>
          <div>
            <h4 className="font-label text-[11px] font-bold uppercase tracking-widest text-white mb-6">Infrastructure</h4>
            <ul className="space-y-4">
              <li><a className="font-body text-sm text-gray-400 hover:text-white transition-colors" href="#">Edge Proxy</a></li>
              <li><a className="font-body text-sm text-gray-400 hover:text-white transition-colors" href="#">Observability</a></li>
              <li><a className="font-body text-sm text-gray-400 hover:text-white transition-colors" href="#">Compliance</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label text-[11px] font-bold uppercase tracking-widest text-white mb-6">Company</h4>
            <ul className="space-y-4">
              <li><a className="font-body text-sm text-gray-400 hover:text-white transition-colors" href="#">Privacy</a></li>
              <li><a className="font-body text-sm text-gray-400 hover:text-white transition-colors" href="#">Terms</a></li>
              <li><a className="font-body text-sm text-gray-400 hover:text-white transition-colors" href="#">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label text-[11px] font-bold uppercase tracking-widest text-white mb-6">Connect</h4>
            <div className="flex gap-6">
              <a className="text-gray-400 hover:text-white transition-colors font-body text-sm" href="#">Twitter</a>
              <a className="text-gray-400 hover:text-white transition-colors font-body text-sm" href="#">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}