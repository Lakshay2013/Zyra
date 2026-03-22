'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Shield, ShieldAlert, BarChart3, Database, Globe, Lock, ChevronDown } from "lucide-react"
import Link from "next/link"

const TopBanner = () => (
  <div className="fixed top-0 w-full z-50 bg-[#0c3927] text-white flex items-center justify-center py-2.5 font-body text-[14px] font-medium tracking-wide border-b border-[#051c13]">
    <span className="opacity-90">Now live in Public Beta — free & unlimited proxy routing</span>
    <Link href="/register" className="ml-3 font-bold hover:underline flex items-center gap-1">
      Integrate now <span className="text-[10px] ml-0.5 mt-[1px]">▶</span>
    </Link>
  </div>
)

const Navbar = () => (
  <nav className="fixed top-12 left-0 right-0 z-40 mx-auto max-w-[1200px] px-6 w-full">
    <div className="flex justify-between items-center w-full px-5 py-2.5 md:py-3 bg-[#fdfaea] border border-[#dedbce] rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
      
      {/* Exact Wispr "Flow" style logo: Vertical bars + bold sans-serif text */}
      <div className="flex items-center gap-2 pl-2 cursor-pointer hover:opacity-80 transition-opacity">
        <BarChart3 className="w-5 h-5 text-[#032416] stroke-[3]" />
        <span className="text-[22px] font-body font-bold tracking-tight text-[#032416] leading-none mb-0.5">Zyra</span>
      </div>
      
      {/* Navigation links with little dropdown carets */}
      <div className="hidden lg:flex items-center space-x-8 font-body text-[14.5px] font-semibold tracking-tight text-[#1a1a1a]">
        <a className="hover:text-[#5e51ad] transition-colors duration-200 flex items-center gap-1.5" href="#features">Product <ChevronDown className="w-3.5 h-3.5 opacity-60" /></a>
        <a className="hover:text-[#5e51ad] transition-colors duration-200 flex items-center gap-1.5" href="#features">Individuals <ChevronDown className="w-3.5 h-3.5 opacity-60" /></a>
        <a className="hover:text-[#5e51ad] transition-colors duration-200 flex items-center gap-1.5" href="#integrations">Business</a>
        <a className="hover:text-[#5e51ad] transition-colors duration-200 flex items-center gap-1.5" href="#docs">Resources <ChevronDown className="w-3.5 h-3.5 opacity-60" /></a>
      </div>
      
      {/* Right side primary CTA matching Wispr solid border styling */}
      <div className="flex items-center">
        <Link href="/register" className="px-6 py-2.5 md:py-2 rounded-[6px] bg-[#eaddff] text-[#1a1a1a] border-[1.5px] border-[#1a1a1a] font-body text-[14px] md:text-[14.5px] font-bold hover:bg-[#d1bcf5] transition-colors flex items-center gap-2 shadow-[0_2px_0_1px_rgba(26,26,26,1)] hover:translate-y-[1px] hover:shadow-[0_1px_0_1px_rgba(26,26,26,1)]">
          <Database className="w-4 h-4" /> Start building
        </Link>
      </div>
      
    </div>
  </nav>
)

const logLines = [
  { text: 'POST /proxy/openai/v1/chat/completions', color: 'text-green-500' },
  { text: '→ model: gpt-4-turbo | user: usr_882', color: 'text-stone-400' },
  { text: '✓ risk_score: 0.04 | pii_detected: false', color: 'text-[#a99cfe]' },
  { text: 'POST /proxy/groq/v1/chat/completions', color: 'text-green-500' },
  { text: '→ model: llama-3-8b | user: usr_449', color: 'text-stone-400' },
  { text: '⚠ risk_score: 0.71 | injection: true', color: 'text-red-400' },
]

const DashboardMockup = () => {
  const [visibleLines, setVisibleLines] = useState(3)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(v => v >= logLines.length ? 2 : v + 1)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative rounded-[24px] bg-white shadow-[0_20px_80px_rgb(0,0,0,0.06)] border border-[#f1eedf] overflow-hidden rotate-1 transform hover:rotate-0 transition-transform duration-700">
      <div className="w-full h-12 bg-[#fdfaea] flex items-center px-6 space-x-2 border-b border-[#f1eedf]">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
        </div>
        <span className="ml-4 text-[#424843]/60 text-xs font-mono font-bold tracking-widest pl-4">zyra // production proxy</span>
      </div>

      <div className="p-8 font-mono text-sm space-y-3 min-h-[260px] bg-stone-950">
        {logLines.slice(0, visibleLines).map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`${line.color} font-medium tracking-wide`}
          >
            {line.text}
          </motion.p>
        ))}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-stone-500 inline-block mt-2"
        >▊</motion.span>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fdfaea] text-[#032416] selection:bg-[#5e51ad]/20 font-body overflow-x-hidden">
      <TopBanner />
      <Navbar />

      <main className="pt-40 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-[1400px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-6 flex flex-col items-start"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-[#5e51ad]/20 bg-[#5e51ad]/5 text-[#5e51ad] font-bold text-xs uppercase tracking-widest mb-8">
              <Shield className="w-3.5 h-3.5" />
              <span>Enterprise Observability</span>
            </div>
            <h1 className="font-headline text-[64px] md:text-[88px] font-bold text-[#032416] leading-[1.05] editorial-tension tracking-tight mb-8 z-10 relative">
              Every LLM call,{' '}
              <span className="relative inline-block z-10">
                <em className="italic font-light">logged</em>
                <svg className="absolute w-[105%] h-[12px] md:h-[18px] -bottom-[2px] md:-bottom-[6px] -left-[2px] text-[#fba761] fill-none stroke-current -z-10" viewBox="0 0 200 20" preserveAspectRatio="none">
                  <path d="M2 12 Q 100 22 198 8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {' '}and{' '}
              <span className="relative inline-block z-10">
                <em className="italic font-light pr-2">scored.</em>
                <svg className="absolute -top-[15px] -right-[15px] w-14 h-14 text-[#a99cfe] -z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                   <path d="M 50 15 L 50 25 M 75 25 L 68 32 M 85 50 L 75 50 M 75 75 L 68 68 M 50 85 L 50 75 M 25 75 L 32 68 M 15 50 L 25 50 M 25 25 L 32 32" />
                </svg>
              </span>
            </h1>
            <p className="font-body text-xl md:text-2xl text-[#424843] max-w-lg leading-relaxed mb-10 font-medium">
              Proxy your AI traffic through Zyra. Get instant, zero-latency visibility into PII leaks, prompt injections, and exact token costs.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <Link href="/register" className="px-10 py-5 rounded-[16px] bg-[#1a3a2a] text-white font-body text-lg font-bold hover:bg-[#032416] transition-colors shadow-xl shadow-[#1a3a2a]/20">
                Start Monitoring
              </Link>
              <Link href="#how-it-works" className="px-8 py-5 flex items-center space-x-2 text-[#032416] font-bold group hover:bg-[#f1eedf]/50 rounded-[16px] transition-colors text-lg">
                <span>See how it works</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-6 lg:pl-10"
          >
            <DashboardMockup />
          </motion.div>
        </section>

        {/* TYPOGRAPHY HOOK */}
        <section className="max-w-5xl mx-auto px-8 py-20 md:py-32 flex flex-col items-center text-center">
          <h2 className="text-[56px] md:text-[96px] leading-[1.05] font-headline text-[#1A1A1A] tracking-tight mb-12 editorial-tension max-w-4xl">
            <span className="relative inline-block z-10 px-2">
              10x faster
              <svg 
                className="absolute w-[105%] h-[12px] md:h-[18px] -bottom-[4px] md:-bottom-[10px] -left-[2px] text-[#eedbfe] fill-none stroke-current -z-10" 
                viewBox="0 0 200 20" 
                preserveAspectRatio="none"
              >
                <path d="M2 12 Q 100 22 198 8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>{' '}
            than debugging raw logs
          </h2>
          <p className="text-xl md:text-[24px] leading-[1.6] font-body text-[#1A1A1A] font-medium max-w-4xl mx-auto tracking-tight">
            After deploying LLMs to production, analyzing unpredictable output is <em className="font-headline italic text-[28px] md:text-[32px] font-normal leading-none pr-1">finally</em> easy. 
            When you monitor, secure, and debug in real-time, you free up engineering hours. Build naturally at the speed you think and let Zyra handle the observability infrastructure.
          </p>
        </section>

        {/* FEATURES (Reformatted to Wispr Flow Alternating Layout) */}
        <section id="features" className="max-w-[1200px] mx-auto px-6 md:px-8 py-20 flex flex-col gap-24 lg:gap-40 border-t border-[#f1eedf]/80">
          
          {/* Feature 1: PII Detection (Image Left, Text Right) */}
          <div className="flex flex-col-reverse lg:flex-row-reverse items-center gap-12 lg:gap-24">
            <div className="w-full lg:w-1/2 flex flex-col pl-0 lg:pl-12">
              <h2 className="font-headline text-[52px] md:text-[80px] font-bold text-[#1A1A1A] leading-[1.05] tracking-tight mb-8 editorial-tension relative">
                <span className="relative z-10 inline-block whitespace-nowrap">
                  PII
                  {/* Wispr Flow Orange Sunburst SVG */}
                  <svg className="absolute -top-[15px] -left-[25px] w-[150%] h-[150%] text-[#fdb366] -z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                     <path d="M 50 15 L 50 25 M 75 25 L 68 32 M 85 50 L 75 50 M 75 75 L 68 68 M 50 85 L 50 75 M 25 75 L 32 68 M 15 50 L 25 50 M 25 25 L 32 32" />
                  </svg>
                </span>{' '}
                Detection
              </h2>
              <p className="font-body text-[20px] md:text-[22px] text-[#424843] leading-[1.6] font-medium max-w-[440px]">
                Automatically orchestrate compliance. Redact sensitive information like emails, credit cards, and SSNs instantly before they hit upstream model providers.
              </p>
            </div>
            
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="w-full h-[450px] md:h-[550px] bg-gradient-to-br from-[#4a2e15] to-[#120a03] rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col items-center justify-end p-0">
                {/* Image emulation: Background blur */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#f97316]/20 rounded-full blur-[80px]"></div>

                {/* Floating Tags (Orange with thick cream borders) */}
                <div className="absolute top-24 left-6 md:left-12 bg-[#fba761] text-[#1a1a1a] px-6 py-2 rounded-full font-bold text-[14px] transform -rotate-[6deg] border-[3px] border-[#fdfaea] shadow-xl z-30 whitespace-nowrap cursor-default hover:-rotate-[4deg] transition-transform">Removed SSN</div>
                <div className="absolute top-44 right-6 md:right-12 bg-[#fba761] text-[#1a1a1a] px-6 py-2 rounded-full font-bold text-[14px] transform rotate-[6deg] border-[3px] border-[#fdfaea] shadow-xl z-30 whitespace-nowrap cursor-default hover:rotate-[8deg] transition-transform">Redacted Email</div>
                
                {/* Circular highlight around text inside the card */}
                <div className="absolute bottom-[200px] left-[130px] md:left-[170px] w-[120px] h-[35px] border-[3px] border-[#fba761] rounded-[50%] transform -rotate-3 z-30 pointer-events-none opacity-90 shadow-sm"></div>

                <div className="w-[90%] max-w-[420px] bg-[#1a1a1a] rounded-[32px] rounded-b-none h-auto border-[3px] border-[#fdfaea] border-b-0 p-8 md:p-10 relative shadow-[0_-20px_60px_rgba(0,0,0,0.5)] z-20 translate-y-2">
                   <p className="text-white/95 font-body text-[16px] md:text-[18px] leading-[1.6]">
                     Hello, my account is <span className="text-[#fba761] opacity-70">123-456-789</span> and my email is <span className="text-[#fba761] opacity-70">user@acme.com</span>. Let's make sure the Q2 goals slide is updated.
                   </p>
                   <div className="mt-8 flex items-center justify-between opacity-80 border-t border-white/10 pt-6">
                     <div className="flex space-x-5 text-white/40">
                        <span className="font-bold">B</span>
                        <span className="italic font-serif">I</span>
                        <span className="line-through">S</span>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-[#fba761] flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-[#1a1a1a]" strokeWidth={3} />
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Prompt Injection (Image Left, Text Right) */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-1/2 flex justify-center relative">
              
              {/* Custom SVG Doodle: Hand drawn arrow pointing at the Firewall tag */}
              <svg className="absolute -top-12 right-12 md:-top-4 md:right-24 w-24 h-24 text-[#a99cfe] z-40 transform rotate-12 drop-shadow-md" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M 20 80 Q 50 20 90 50" />
                 <path d="M 90 50 L 75 45 M 90 50 L 80 65" />
              </svg>

              <div className="w-full h-[450px] md:h-[550px] bg-[#1a1a1a] rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-8">
                 {/* Floating tags matching Wispr style but red/pink themed */}
                 <div className="absolute top-16 right-4 md:right-8 bg-[#ff4e4e] text-white px-5 py-2.5 rounded-full font-bold text-[14px] transform -rotate-[6deg] border-[3px] border-[#fdfaea] shadow-xl z-30 whitespace-nowrap">SQLi Blocked</div>
                 <div className="absolute top-32 left-4 md:left-10 bg-[#ff4e4e] text-white px-5 py-2.5 rounded-full font-bold text-[14px] transform rotate-[8deg] border-[3px] border-[#fdfaea] shadow-xl z-30 whitespace-nowrap">Jailbreak Prevented</div>
                 
                 <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white/10 border border-white/20 px-6 py-2.5 rounded-full backdrop-blur-md">
                   <ShieldAlert className="w-4 h-4 text-[#ff4e4e]" />
                   <span className="text-white font-mono text-[13px] font-bold tracking-widest">FIREWALL ACTIVE</span>
                 </div>
                 
                 <div className="w-24 h-24 border-[5px] border-[#ff4e4e]/90 rounded-full flex items-center justify-center mb-0 relative z-10 bg-black/40 shadow-[0_0_80px_rgba(255,78,78,0.4)]">
                    <Lock className="w-10 h-10 text-[#ff4e4e]" />
                 </div>
                 
                 <svg className="absolute inset-0 w-full h-full opacity-[0.25]" viewBox="0 0 500 550" preserveAspectRatio="none">
                   <path d="M 250 275 Q 120 400 90 450" fill="none" stroke="white" strokeWidth="4" />
                   <path d="M 250 275 Q 250 400 250 450" fill="none" stroke="white" strokeWidth="4" />
                   <path d="M 250 275 Q 380 400 410 450" fill="none" stroke="white" strokeWidth="4" />
                 </svg>
                 
                 <div className="flex gap-4 md:gap-8 absolute bottom-12 md:bottom-20 z-10">
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-[#2a2a2a] rounded-[20px] flex items-center justify-center border border-white/10 shadow-xl text-white font-bold font-mono text-xs">CLIENT</div>
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ff4e4e]/10 rounded-[20px] flex items-center justify-center border border-[#ff4e4e] shadow-[0_0_30px_rgba(255,78,78,0.3)] text-[#ff4e4e] font-bold font-mono text-xs uppercase tracking-wider backdrop-blur-xl">DROP</div>
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-[#2a2a2a] rounded-[20px] flex items-center justify-center border border-white/10 shadow-xl text-white font-bold font-mono text-xs">LLM</div>
                 </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col pl-0 lg:pl-4">
              <h2 className="font-headline text-[48px] md:text-[64px] font-bold text-[#1A1A1A] leading-[1.05] tracking-tight mb-6 editorial-tension relative">
                <span className="relative inline-block z-10">
                  Prompt
                  <svg className="absolute w-[105%] h-[12px] md:h-[16px] -bottom-[4px] md:-bottom-[8px] -left-[2px] text-[#ff4e4e] fill-none stroke-current -z-10" viewBox="0 0 200 20" preserveAspectRatio="none">
                    <path d="M2 12 Q 100 22 198 8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>{' '}
                Injection
              </h2>
              <p className="font-body text-xl md:text-[22px] text-[#424843] leading-relaxed font-medium">
                Real-time semantic risk scoring to instantly block adversarial attacks, jailbreaks, and indirect injection attempts in your chat UI.
              </p>
            </div>
          </div>

          {/* Feature 3: Cost & Latency (Text Top, Card Below) */}
          <div className="flex flex-col items-center text-center mt-12 max-w-4xl mx-auto relative">
             
            {/* Custom SVG Doodle: Hand drawn sparkle */}
            <svg className="absolute -top-10 -left-10 w-20 h-20 text-[#fcd34d] z-0 opacity-80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M 50 10 L 50 40 M 90 50 L 60 50 M 50 90 L 50 60 M 10 50 L 40 50 M 20 20 L 40 40 M 80 20 L 60 40 M 80 80 L 60 60 M 20 80 L 40 60" />
            </svg>

            <h2 className="font-headline text-[48px] md:text-[64px] font-bold text-[#1A1A1A] leading-[1.05] tracking-tight mb-6 editorial-tension relative z-10">
              <span className="relative z-10 inline-block">
                Cost &
                {/* Custom purple wavy underline */}
                <svg className="absolute -bottom-2 -left-2 w-[110%] h-[15px] text-[#a99cfe] -z-10" viewBox="0 0 100 20" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                   <path d="M 5 15 Q 50 5 95 12" />
                </svg>
              </span>{' '}
              Latency
            </h2>
            <p className="font-body text-xl md:text-[22px] text-[#424843] leading-relaxed font-medium mb-16 max-w-3xl relative z-10">
              Granular breakdown of token usage and response times across all model providers. Immediately identify expensive or slow queries.
            </p>

            <div className="w-full h-auto p-8 md:p-12 md:h-[420px] bg-[#1a1a1a] rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col">
               <div className="absolute top-10 right-4 md:right-12 bg-[#fcd34d] text-[#1a1a1a] px-6 py-2.5 rounded-full font-bold text-[14px] transform rotate-[10deg] border-[3px] border-[#fdfaea] shadow-xl z-30 whitespace-nowrap">40% Cheaper</div>
               <div className="absolute top-36 right-12 md:right-24 bg-[#a99cfe] text-[#1a1a1a] px-6 py-2.5 rounded-full font-bold text-[14px] transform -rotate-[5deg] border-[3px] border-[#fdfaea] shadow-xl z-30 whitespace-nowrap">0ms Overhead</div>

               <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/10 relative z-20">
                 <div className="text-white/90 font-body font-bold text-[22px] tracking-tight">Provider Analytics</div>
                 <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                   <BarChart3 className="w-6 h-6 text-[#eaddff]" />
                 </div>
               </div>
               
               <div className="flex-1 flex flex-col justify-end gap-5 md:gap-7 relative z-10">
                 <div className="w-full flex items-center gap-6">
                   <div className="w-20 md:w-28 text-white/50 font-mono text-[13px] md:text-[15px] font-bold text-right tracking-widest">OpenAI</div>
                   <div className="h-12 bg-[#5e51ad] rounded-r-2xl w-[75%] flex items-center px-5 font-mono text-xs md:text-sm text-white/90 font-bold">$1,240.50 (280ms)</div>
                 </div>
                 <div className="w-full flex items-center gap-6">
                   <div className="w-20 md:w-28 text-white/50 font-mono text-[13px] md:text-[15px] font-bold text-right tracking-widest">Anthropic</div>
                   <div className="h-12 bg-[#eaddff] rounded-r-2xl w-[45%] flex items-center px-5 font-mono text-xs md:text-sm text-[#1a1a1a] font-bold shadow-lg">$420.00 (450ms)</div>
                 </div>
                 <div className="w-full flex items-center gap-6">
                   <div className="w-20 md:w-28 text-white/50 font-mono text-[13px] md:text-[15px] font-bold text-right tracking-widest">Groq</div>
                   <div className="h-12 bg-[#fcd34d] rounded-r-2xl w-[15%] flex items-center px-4 font-mono text-xs text-[#1a1a1a] font-bold shadow-lg">$12.40 (12ms)</div>
                 </div>
               </div>
               
               <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#5e51ad]/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
            </div>
          </div>
        </section>

        {/* DARK INTEGRATIONS SECTION (Wispr style inverted look) */}
        <section id="integrations" className="bg-[#151515] text-[#fdfaea] py-32 md:py-40 my-20 rounded-[48px] mx-4 md:mx-8 border border-[#2a2a2a] relative overflow-hidden shadow-2xl">
          <div className="max-w-[1400px] mx-auto px-8 relative z-10 flex flex-col xl:flex-row items-center justify-between text-center xl:text-left gap-16">
            <div className="flex-1 max-w-3xl flex flex-col items-center xl:items-start pt-8 xl:pt-16">
              <h2 className="text-[64px] md:text-[104px] font-headline font-bold mb-10 leading-[0.95] tracking-tight text-[#fffffb] editorial-tension">
                Zyra is made <br className="hidden md:block"/>
                <span className="text-[#ecd9fa] italic font-normal pr-4">for any stack</span>
              </h2>

              <div className="flex flex-wrap items-center justify-center xl:justify-start gap-3 md:gap-4 mb-10 xl:mb-0 max-w-[620px]">
                 {["Node.js", "Python", "Go", "REST API", "OpenAI SDK", "LangChain", "LlamaIndex", "Next.js", "Express", "FastAPI"].map((platform) => (
                   <div key={platform} className="px-5 py-2 md:px-6 md:py-2.5 rounded-full border-[1.5px] border-white/70 hover:border-white text-white shadow-sm hover:bg-white/5 transition-all bg-transparent select-none cursor-default">
                     <span className="font-body font-bold text-[15px] md:text-[16px] tracking-wide">{platform}</span>
                   </div>
                 ))}
              </div>
            </div>

            <div className="hidden xl:flex w-[480px] h-[560px] bg-[#1c1c1c] border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden flex-col mr-8 transform rotate-2 hover:rotate-0 transition-transform duration-700">
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="text-white/40 text-sm font-mono font-bold tracking-widest">zyra-runtime</div>
                <div className="flex space-x-2">
                   <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
              </div>
              <div className="p-8 space-y-8 flex-1 flex flex-col justify-end bg-gradient-to-t from-[#111] to-[#1c1c1c]">
                <div className="w-[85%] h-20 bg-[#5e51ad]/10 rounded-[20px] rounded-bl-sm self-start border border-[#5e51ad]/20 p-4 flex items-center shadow-inner">
                  <div className="w-full space-y-3">
                    <div className="w-full h-2.5 bg-white/20 rounded-full"></div>
                    <div className="w-[60%] h-2.5 bg-white/20 rounded-full"></div>
                  </div>
                </div>
                <div className="w-[75%] h-14 bg-white/5 rounded-[20px] border border-white/5 rounded-br-sm self-end p-4 flex items-center justify-center font-mono text-sm text-white/40 tracking-wider">
                   evaluating_risk...
                </div>
                <div className="w-[95%] h-24 bg-green-500/10 rounded-[20px] rounded-bl-sm self-start border border-green-500/20 p-5 flex flex-col justify-end shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                  <div className="text-green-400 font-mono text-[13px] uppercase font-bold tracking-widest mb-3">Pass: Risk 0.04</div>
                  <div className="w-[45%] h-2.5 bg-green-500/40 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Blurs */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.1]">
             <div className="absolute -left-32 -top-32 w-[500px] h-[500px] bg-[#fdfaea] rounded-full blur-[140px]"></div>
             <div className="absolute right-0 bottom-0 w-[800px] h-[800px] bg-[#5e51ad] rounded-full blur-[160px]"></div>
          </div>
        </section>

        {/* SDK DOCS / HOW TO INTEGRATE */}
        <section id="docs" className="max-w-[1400px] mx-auto px-8 py-32">
          <div className="mb-20 text-center lg:text-left max-w-4xl">
            <span className="font-body text-sm font-bold tracking-[0.2em] uppercase text-[#5e51ad]">DEVELOPER FRIENDLY</span>
            <h2 className="font-headline text-[56px] md:text-[80px] font-bold text-[#032416] mt-4 leading-[1.05] tracking-tight editorial-tension relative">
              <span className="relative inline-block z-10">
                Get started
                <svg className="absolute -top-[10px] -left-[15px] w-12 h-12 text-[#fba761] -z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                   <path d="M 50 15 L 50 25 M 75 25 L 68 32 M 85 50 L 75 50 M 75 75 L 68 68 M 50 85 L 50 75 M 25 75 L 32 68 M 15 50 L 25 50 M 25 25 L 32 32" />
                </svg>
              </span>
              {' '}in{' '}
              <span className="relative inline-block z-10">
                3 steps.
                <svg className="absolute w-[105%] h-[12px] md:h-[18px] -bottom-[2px] md:-bottom-[6px] -left-[2px] text-[#eedbfe] fill-none stroke-current -z-10" viewBox="0 0 200 20" preserveAspectRatio="none">
                  <path d="M2 12 Q 100 22 198 8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </h2>
            <p className="text-xl md:text-[22px] text-[#424843] mt-6 font-medium leading-relaxed">
              Integrate Zyra asynchronously without adding a single millisecond of latency to your LLM calls using our drop-in Node.js module.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Install the SDK",
                desc: "Install our lightweight package into your Node.js or Python backend.",
                code: "npm install zyra-sdk"
              },
              {
                step: "2",
                title: "Initialize Client",
                desc: "Instantiate Zyra using the secure API key generated inside your portal.",
                code: "const { AIShield } = require('zyra-sdk')\n\nconst shield = new AIShield({\n  apiKey: process.env.ZYRA_API_KEY\n})"
              },
              {
                step: "3",
                title: "Wrap OpenAI",
                desc: "No code refactoring. Just pass your client into our wrapper and we log everything.",
                code: "const openai = new OpenAI()\n// Automatically logs traffic async\nconst wrapped = new OpenAIShield(openai, shield)\n\nawait wrapped.chat.completions.create(...)"
              }
            ].map((box, i) => (
              <div key={i} className="bg-white p-10 rounded-[24px] border border-[#f1eedf] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative pt-14 group hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-500">
                <div className="absolute top-0 right-10 transform -translate-y-1/2">
                  <span className="bg-[#1a3a2a] text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                    {box.step}
                  </span>
                </div>
                <h3 className="font-headline text-[32px] md:text-[40px] font-bold text-[#032416] mb-3 leading-tight tracking-tight editorial-tension">{box.title}</h3>
                <p className="text-lg text-[#424843] font-medium mb-8 leading-relaxed">{box.desc}</p>
                <div className="bg-[#151515] rounded-[16px] p-6 font-mono text-[14px] text-white/90 overflow-x-auto leading-relaxed shadow-inner">
                  <pre><code>{box.code}</code></pre>
                </div>
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-32 p-12 lg:p-16 bg-[#f1eedf]/40 rounded-[32px] flex flex-col md:flex-row items-center justify-between border border-[#f1eedf] shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
          >
            <div className="mb-8 md:mb-0 max-w-2xl">
              <p className="font-headline text-[40px] md:text-[48px] font-bold text-[#032416] editorial-tension leading-[1.1] tracking-tight relative">
                Ready to secure{' '}
                <span className="relative inline-block z-10 px-1">
                  production?
                  <svg className="absolute w-[105%] h-[12px] md:h-[14px] -bottom-[2px] left-0 text-[#fba761] fill-none stroke-current -z-10" viewBox="0 0 200 20" preserveAspectRatio="none">
                    <path d="M2 12 Q 100 22 198 8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </p>
              <p className="text-[20px] font-body font-medium text-[#424843] mt-3">Get your API key and integrate natively in 180 seconds.</p>
            </div>
            <Link href="/register" className="px-12 py-6 bg-[#1a3a2a] text-white rounded-[20px] text-xl font-bold hover:bg-[#032416] transition-all shadow-xl hover:shadow-[0_0_30px_rgba(26,58,42,0.3)] whitespace-nowrap">
              Start Building Now
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="w-full py-16 px-8 bg-white border-t border-[#f1eedf]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:items-start items-center">
            <div className="text-[32px] font-headline font-bold text-[#032416] mb-2 italic">zyra</div>
            <p className="font-body text-sm font-bold tracking-[0.2em] uppercase text-[#424843]/60">© 2026 zyra dev tools.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-10 font-body text-sm font-bold tracking-widest uppercase text-[#032416]">
            <a className="hover:text-[#5e51ad] transition-colors" href="#">Twitter</a>
            <a className="hover:text-[#5e51ad] transition-colors" href="#">GitHub</a>
            <a className="hover:text-[#5e51ad] transition-colors" href="#">Documentation</a>
            <a className="hover:text-[#5e51ad] transition-colors" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}