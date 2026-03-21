'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Shield, ShieldAlert, BarChart3 } from "lucide-react"
import Link from "next/link"

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/10">
    <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
      <div className="text-2xl font-headline italic font-bold text-primary">zyra</div>
      <div className="hidden md:flex items-center space-x-8 font-body text-sm font-medium tracking-tight text-primary/70">
        <a className="hover:text-secondary transition-colors duration-300" href="#features">Features</a>
        <a className="hover:text-secondary transition-colors duration-300" href="#how-it-works">How it works</a>
        <a className="hover:text-secondary transition-colors duration-300" href="#pricing">Pricing</a>
        <a className="hover:text-secondary transition-colors duration-300" href="#docs">Docs</a>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/login" className="px-6 py-2 rounded-full border-2 border-primary text-primary font-body text-sm font-bold hover:bg-primary hover:text-white transition-all duration-300 active:scale-95">
          Sign in
        </Link>
        <Link href="/register" className="px-6 py-2 rounded-full bg-secondary text-white font-body text-sm font-bold shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all duration-300 active:scale-95">
          Start free
        </Link>
      </div>
    </div>
  </nav>
)

const logLines = [
  { text: 'POST /proxy/openai/v1/chat/completions', color: 'text-green-400' },
  { text: '→ model: gpt-4-turbo | user: usr_8821', color: 'text-stone-400' },
  { text: '✓ risk_score: 0.04 | pii_detected: false', color: 'text-secondary-container' },
  { text: 'POST /proxy/groq/v1/chat/completions', color: 'text-green-400' },
  { text: '→ model: llama-3.1-8b | user: usr_4492', color: 'text-stone-400' },
  { text: '⚠ risk_score: 0.71 | injection_flag: true', color: 'text-red-400' },
  { text: 'POST /proxy/anthropic/v1/messages', color: 'text-green-400' },
  { text: '→ model: claude-3-haiku | user: usr_1103', color: 'text-stone-400' },
  { text: '✓ risk_score: 0.11 | tokens: 842', color: 'text-secondary-container' },
  { text: 'POST /proxy/openai/v1/chat/completions', color: 'text-green-400' },
  { text: '⚠ risk_score: 0.88 | pii_detected: true | scrubbed', color: 'text-red-400' },
]

const DashboardMockup = () => {
  const [visibleLines, setVisibleLines] = useState(3)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(v => v >= logLines.length ? 3 : v + 1)
    }, 900)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative rounded-xl bg-stone-950 shadow-2xl overflow-hidden border border-stone-800">
      {/* Titlebar */}
      <div className="w-full h-9 bg-stone-900 flex items-center px-4 space-x-2 border-b border-stone-800">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
        <span className="ml-4 text-stone-500 text-[11px] font-mono">zyra — live log stream</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-b border-stone-800">
        {[
          { label: 'Requests today', value: '1,284' },
          { label: 'Avg latency',    value: '238ms' },
          { label: 'Flagged',        value: '3' },
        ].map((stat, i) => (
          <div key={i} className={`px-5 py-4 ${i < 2 ? 'border-r border-stone-800' : ''}`}>
            <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-stone-100 text-xl font-headline italic">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Log stream */}
      <div className="p-5 font-mono text-[11px] space-y-1.5 min-h-[220px]">
        {logLines.slice(0, visibleLines).map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={line.color}
          >
            {line.text}
          </motion.p>
        ))}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-stone-500"
        >▊</motion.span>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen selection:bg-secondary-container/30">
      <Navbar />

      <main className="pt-32 pb-20">

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 flex flex-col items-start space-y-6"
          >
            <span className="font-body text-xs font-bold tracking-[0.2em] uppercase text-primary">
              LLM OBSERVABILITY & RISK MONITORING
            </span>
            <h1 className="font-headline text-6xl md:text-7xl font-bold text-primary leading-[1.1] editorial-tension">
              Every LLM call, logged and scored.
            </h1>
            <p className="font-body text-lg text-on-surface-variant max-w-md leading-relaxed">
              Proxy your LLM traffic through Zyra. Get instant visibility into PII leaks, prompt injections, abuse patterns, cost, and latency.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link href="/register" className="px-8 py-4 rounded-full bg-primary-container text-white font-body font-bold hover:shadow-xl transition-all">
                Integrate Now
              </Link>
              <Link href="#how-it-works" className="flex items-center space-x-2 text-primary font-bold group">
                <span>View Documentation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <DashboardMockup />
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-8 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "PII Detection",
                desc: "Automatically identify and redact sensitive information like emails, credit cards, and SSNs before they hit your logs or model providers.",
                icon: <Shield className="w-6 h-6 text-primary" />
              },
              {
                title: "Prompt Injection Alerts",
                desc: "Real-time scoring of user prompts to block adversarial attacks, jailbreaks, and indirect injection attempts in production.",
                icon: <ShieldAlert className="w-6 h-6 text-primary" />
              },
              {
                title: "Cost & Latency Tracking",
                desc: "Granular breakdown of token usage and response times across all model providers. Identify expensive calls and performance bottlenecks.",
                icon: <BarChart3 className="w-6 h-6 text-primary" />
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 rounded-lg shadow-sm hover:shadow-xl transition-all duration-500 group border border-transparent hover:border-surface-container"
              >
                <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center mb-6 group-hover:bg-secondary-container/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-headline text-2xl font-bold text-primary mb-4">{feature.title}</h3>
                <p className="font-body text-on-surface-variant leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-surface-container/30 py-24">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-16 text-center lg:text-left">
              <span className="font-body text-xs font-bold tracking-[0.2em] uppercase text-secondary">ARCHITECTED FOR PERFORMANCE</span>
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mt-2">How Zyra sits in your stack.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: "01",
                  title: "Redirect your API base",
                  desc: "Swap your direct OpenAI or Anthropic calls to the Zyra proxy. A single line change in your SDK configuration."
                },
                {
                  step: "02",
                  title: "Real-time Risk Scoring",
                  desc: "As traffic passes through, Zyra evaluates safety, checks for PII, and measures latency with < 5ms of overhead."
                },
                {
                  step: "03",
                  title: "Actionable Insights",
                  desc: "View detailed traces, export audit logs for compliance, and set up alerts for suspicious activity spikes."
                }
              ].map((item, i) => (
                <div key={i} className="relative space-y-6">
                  <div className="text-7xl font-headline font-bold text-primary/5 absolute -top-10 -left-4 select-none">
                    {item.step}
                  </div>
                  <div className="pt-4">
                    <h4 className="font-headline text-xl font-bold text-primary mb-3">{item.title}</h4>
                    <p className="text-on-surface-variant leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20 p-8 bg-surface-container rounded-lg flex flex-col md:flex-row items-center justify-between border border-outline-variant/20"
            >
              <div className="mb-6 md:mb-0">
                <p className="font-headline text-2xl font-semibold text-primary">Ready to secure your LLM production?</p>
                <p className="text-on-surface-variant">Takes less than 3 minutes to integrate with any major LLM SDK.</p>
              </div>
              <Link href="/register" className="px-10 py-4 bg-primary-container text-white rounded-full font-bold hover:bg-primary transition-all">
                Get Your API Key
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 bg-surface-container/50 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:items-start items-center">
            <div className="text-xl font-headline font-bold text-primary mb-2 italic">zyra</div>
            <p className="font-body text-xs tracking-widest uppercase opacity-60 text-primary">© 2026 zyra. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 font-body text-xs tracking-widest uppercase text-primary">
            <a className="opacity-60 hover:opacity-100 transition-opacity" href="#">Privacy Policy</a>
            <a className="opacity-60 hover:opacity-100 transition-opacity" href="#">Terms of Service</a>
            <a className="opacity-60 hover:opacity-100 transition-opacity" href="#">Security</a>
            <a className="opacity-60 hover:opacity-100 transition-opacity" href="#">Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}