'use client'

import React from 'react'
import Link from 'next/link'
import { Check, ShieldCheck, MapPin, Zap, FileText } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="bg-[#0B0B0C] text-white min-h-screen font-sans selection:bg-[#FFA69E] selection:text-black">
      {/* Navigation */}
      <header className="w-full flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-white/5">
        <div className="font-bold text-xl tracking-tight">ZYRA</div>
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-gray-400">
          <Link href="#" className="text-white">Platform</Link>
          <Link href="#" className="hover:text-white transition-colors">Solutions</Link>
          <Link href="#" className="hover:text-white transition-colors">Integrations</Link>
          <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
        </nav>
        <div>
          <Link href="/login" className="text-[13px] font-medium text-gray-300 hover:text-white transition-colors">Log in</Link>
        </div>
      </header>

      <main className="w-full flex flex-col items-center flex-grow">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center pt-28 pb-24 px-6 max-w-4xl relative w-full">
          <div className="border border-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-8 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FFA69E] rounded-full"></span>
            COST OPTIMIZER LIVE
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 max-w-3xl">
            Reduce your AI costs<br />without changing your<br />code.
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mb-10 leading-relaxed mx-auto">
            Automatically route requests to the most efficient model. Cut LLM bills<br />by up to 90%, while maintaining enterprise-grade latency and reliability.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/register" className="bg-transparent text-gray-300 px-6 py-3 text-[13px] font-medium hover:text-white transition-colors">
              GET STARTED
            </Link>
            <Link href="#docs" className="bg-[#18181A] border border-white/10 text-white px-6 py-3 rounded text-[13px] font-medium hover:bg-white/5 transition-colors">
              VIEW DOCUMENTATION <span className="ml-1 text-gray-500">→</span>
            </Link>
          </div>
        </section>

        {/* Section 1: Fragmented and Costly */}
        <section className="w-full max-w-7xl mx-auto mt-24 px-6 mb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-4">THE PROBLEM</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 leading-snug">
              AI infrastructure is<br />fragmented and costly.
            </h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="mt-1 text-[#FFA69E]"><Check size={20} strokeWidth={2.5} /></div>
                <div>
                  <h4 className="font-bold text-[15px] mb-2 text-white">Cost Explosion</h4>
                  <p className="text-gray-400 text-[14px] leading-relaxed">
                    Overusing expensive models like GPT-4 across the board leads to out-of-control monthly spend. You have no control over per-request economics.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 text-[#FFA69E]"><Check size={20} strokeWidth={2.5} /></div>
                <div>
                  <h4 className="font-bold text-[15px] mb-2 text-white">Reliability Issues</h4>
                  <p className="text-gray-400 text-[14px] leading-relaxed">
                    Single provider dependency means API downtime breaks your production apps. Building automatic fallback into your main logic is tedious.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 text-[#FFA69E]"><Check size={20} strokeWidth={2.5} /></div>
                <div>
                  <h4 className="font-bold text-[15px] mb-2 text-white">Lack of Visibility</h4>
                  <p className="text-gray-400 text-[14px] leading-relaxed">
                    No clear cost breakdown per feature or user. It's difficult to track waste and optimize when the pipeline lacks an intelligence layer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121214] border border-white/5 rounded-xl p-8 flex flex-col justify-between h-[300px]">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
              <span className="text-[#FFA69E]">MONTHLY SPEND</span>
              <span className="text-gray-600">USD</span>
            </div>

            <div className="flex flex-col gap-6 h-full justify-center">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[12px] font-medium text-gray-500">Without Zyra</span>
                  <span className="text-lg font-bold font-mono text-gray-300">$200.00</span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-sm"></div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[12px] font-medium text-[#FFA69E]">With Zyra (Optimized)</span>
                  <span className="text-lg font-bold font-mono text-[#FFA69E]">$120.00</span>
                </div>
                <div className="w-[60%] bg-[#FFA69E] h-3 rounded-sm"></div>
              </div>
              <div className="text-right text-[11px] font-bold tracking-widest text-[#FFA69E] mt-2 border-t border-white/10 pt-4">
                SAVINGS: $80.00
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Smart Proxy Layer */}
        <section className="w-full py-24 bg-[#121214] border-y border-white/5 flex flex-col items-center px-6 overflow-hidden">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-4">THE PIPELINE</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-center">Smart Proxy Architecture.</h2>
          <p className="text-gray-400 text-[15px] text-center max-w-xl mb-24 leading-relaxed">
            One endpoint. Infinite possibilities. Zyra intercepts the request, runs internal intelligence to find the cheapest capable model, and routes it seamlessly.
          </p>

          <div className="w-full max-w-5xl relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 px-4">
            {/* Left App */}
            <div className="bg-[#18181A] border border-white/10 rounded-xl p-6 z-10 w-full md:w-64 text-center shadow-lg relative">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Zap className="w-5 h-5 text-gray-300" />
              </div>
              <div className="text-white font-bold mb-1">Your Application</div>
              <div className="text-[11px] font-mono text-gray-500">api.zyra.dev/v1/chat</div>
            </div>

            {/* Connecting line 1 */}
            <div className="hidden md:block absolute left-[15rem] right-[50%] h-[1px] bg-gradient-to-r from-white/20 to-[#FFA69E]/50 -translate-y-1/2 z-0 top-1/2">
              <div className="absolute top-1/2 -translate-y-1/2 left-1/4 w-2 h-2 bg-[#FFA69E] rounded-full shadow-[0_0_10px_#FFA69E] animate-ping"></div>
            </div>

            {/* Center Zyra Router */}
            <div className="bg-[#0A0A0B] border border-[#FFA69E]/30 rounded-2xl p-8 z-10 w-full md:w-80 shadow-[0_0_40px_rgba(255,166,158,0.1)] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFA69E] text-black text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                ZYRA COST OPTIMIZER
              </div>

              <div className="flex flex-col gap-3 font-mono text-[11px]">
                <div className="flex justify-between items-center border border-white/5 bg-white/5 p-3 rounded">
                  <span className="text-gray-400">1. Firewall & Auth</span>
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <div className="flex justify-between items-center border border-[#FFA69E]/20 bg-[#FFA69E]/5 p-3 rounded">
                  <span className="text-[#FFA69E]">2. Cost Estimator</span>
                  <span className="text-[#FFA69E] animate-pulse">Running...</span>
                </div>
                <div className="flex justify-between items-center border border-white/5 bg-white/5 p-3 rounded">
                  <span className="text-gray-400">3. Quality Guard</span>
                  <span className="text-gray-600">Pending</span>
                </div>
              </div>
            </div>

            {/* Connecting lines 2 */}
            <div className="hidden md:block absolute left-[50%] right-[16rem] top-1/2 -translate-y-1/2 z-0 h-32">
              {/* Line to GPT-4 (Top) */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10 origin-left transform -rotate-12 translate-y-16"></div>
              {/* Line to Haiku (Middle) */}
              <div className="absolute top-[48%] left-0 w-full h-[1px] bg-[#FFA69E]/40 border-dashed border-b border-[#FFA69E]"></div>
              {/* Line to Fallback (Bottom) */}
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 origin-left transform rotate-12 -translate-y-16"></div>
            </div>

            {/* Right Providers */}
            <div className="flex flex-col gap-4 z-10 w-full md:w-64">
              <div className="bg-[#18181A] border border-white/5 p-4 rounded-xl opacity-50 flex justify-between items-center">
                <div>
                  <div className="text-white font-bold text-[13px]">GPT-4o</div>
                  <div className="text-gray-500 text-[11px] font-mono">$0.02 / 1K</div>
                </div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest border border-gray-600 rounded px-2 py-1">Skipped</div>
              </div>

              <div className="bg-[#18181A] border border-[#FFA69E] p-4 rounded-xl shadow-[0_0_20px_rgba(255,166,158,0.15)] flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#FFA69E]"></div>
                <div className="pl-2">
                  <div className="text-white font-bold text-[13px]">Claude 3 Haiku</div>
                  <div className="text-[#FFA69E] text-[11px] font-mono">$0.005 / 1K</div>
                </div>
                <div className="text-[10px] text-black bg-[#FFA69E] font-bold uppercase tracking-widest rounded px-2 py-1">Routed</div>
              </div>

              <div className="bg-[#18181A] border border-white/5 p-4 rounded-xl opacity-50 flex justify-between items-center">
                <div>
                  <div className="text-white font-bold text-[13px]">Groq Llama 3</div>
                  <div className="text-gray-500 text-[11px] font-mono">Fallback</div>
                </div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest border border-gray-600 rounded px-2 py-1">Standby</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: The Premium Tax */}
        <section className="w-full max-w-7xl mx-auto py-32 px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 leading-snug">
              Stop paying "The Premium Tax" for<br />simple reasoning tasks.
            </h2>
            <p className="text-gray-400 text-[14px] mb-10 leading-relaxed max-w-lg">
              Zyra evaluates the intent of your prompt. It automatically routes requests to cheaper models when possible, maintaining output quality whilst actively tracking your savings per request.
            </p>
            <ul className="space-y-5">
              <li className="flex items-center gap-4 text-[14px] font-medium text-gray-300">
                <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                Automatic cost reduction & intelligent routing
              </li>
              <li className="flex items-center gap-4 text-[14px] font-medium text-gray-300">
                <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                Retry mechanism with fallback providers
              </li>
              <li className="flex items-center gap-4 text-[14px] font-medium text-gray-300">
                <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                Granular cost tracking and observability
              </li>
            </ul>
          </div>

          <div className="bg-[#121214] border border-white/5 rounded-xl p-10">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-10 border-b border-white/5 pb-4">Cost per 1M Tokens</div>

            <div className="mb-10">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[12px] font-medium text-gray-300">Standard LLM API (Unoptimized)</span>
                <span className="text-2xl font-bold font-mono">$16.20</span>
              </div>
              <div className="w-full bg-[#FFA69E] h-4 rounded-sm"></div>
            </div>

            <div className="mb-12">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[12px] font-medium text-gray-300">Zyra Optimized Stack</span>
                <span className="text-2xl font-bold font-mono">$1.40</span>
              </div>
              <div className="w-[10%] bg-white h-4 rounded-sm"></div>
            </div>

            <div className="pt-6 border-t border-white/5 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
              ANALYZING 100M+ API CALLS / DAY STATE_ROUTING_ON
            </div>
          </div>
        </section>

        <div className="w-full max-w-7xl h-[1px] bg-white/5"></div>

        {/* Section 4: Implementation */}
        <section className="w-full max-w-7xl mx-auto py-32 px-6">
          <div className="mb-20">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-4">THE WORKFLOW</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-snug">Native SDK Integration.<br />Zero Friction.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            <div>
              <div className="text-gray-600 text-3xl font-light mb-6 tracking-tighter">01</div>
              <h4 className="font-bold text-[16px] mb-3 text-gray-200">Drop-in SDK Export</h4>
              <p className="text-gray-400 text-[14px] leading-relaxed">Instead of rewriting your AI services or managing endpoints manually, simply swap in the Zyra client which replicates native integrations perfectly.</p>
            </div>
            <div>
              <div className="text-gray-600 text-3xl font-light mb-6 tracking-tighter">02</div>
              <h4 className="font-bold text-[16px] mb-3 text-gray-200">Transparent Intelligence</h4>
              <p className="text-gray-400 text-[14px] leading-relaxed">We silently intercept the `.create()` call to inject latency optimizations, semantic caching, and evaluate dynamic routing.</p>
            </div>
            <div>
              <div className="text-gray-600 text-3xl font-light mb-6 tracking-tighter">03</div>
              <h4 className="font-bold text-[16px] mb-3 text-gray-200">Seamless Execution</h4>
              <p className="text-gray-400 text-[14px] leading-relaxed">Metrics, prompts, and tokens are logged asynchronously to your Zyra dashboard, maintaining strict sub-millisecond overhead.</p>
            </div>
          </div>

          <div className="bg-[#121214] border border-white/5 rounded-xl p-8 font-mono text-[13px] text-gray-300 w-full overflow-x-auto shadow-2xl relative">
            <div className="absolute top-0 right-8 bg-white/10 text-white text-[10px] px-3 py-1 font-sans rounded-b-md">Node.js</div>
            <div className="flex gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-white/10"></div>
              <div className="w-3 h-3 rounded-full bg-white/10"></div>
              <div className="w-3 h-3 rounded-full bg-white/10"></div>
            </div>
            <pre className="leading-loose"><code>{`import { Zyra } from "zyra-sdk";

// 1. Initialize the intelligent proxy client
const zyra = new Zyra({ apiKey: process.env.ZYRA_API_KEY });

// 2. Drop it into your existing logic
const response = await zyra.chat.completions.create({
  model: "gpt-4o", // Zyra seamlessly downgrades to claude-haiku if capable
  messages: [{ role: "user", content: "Summarize this risk report..." }]
});`}</code></pre>
          </div>
        </section>

        <div className="w-full max-w-7xl h-[1px] bg-white/5"></div>

        {/* Section 5: Observer */}
        <section className="w-full max-w-7xl mx-auto py-32 px-6 flex flex-col lg:flex-row gap-16 justify-between items-center">
          <div className="w-full lg:w-1/3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 leading-snug">Observe your intelligence<br />in real-time.</h2>
            <p className="text-gray-400 text-[14px] mb-12 leading-relaxed">
              Our dashboard provides complete visibility into which models were chosen and why. Track your exact savings and execution paths.
            </p>

            <div className="flex gap-4">
              <div className="bg-[#121214] border border-white/5 p-6 md:p-8 rounded-xl w-1/2">
                <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-widest mb-4">TOTAL SAVINGS</div>
                <div className="text-3xl font-bold text-white">$4,230</div>
              </div>
              <div className="border border-white/10 p-6 md:p-8 rounded-xl w-1/2 bg-white/5">
                <div className="text-[10px] uppercase font-semibold text-[#FFA69E] tracking-widest mb-4">COST REDUCTION</div>
                <div className="text-3xl font-bold text-[#FFA69E]">60.0%</div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <div className="border-t border-white/10">
              <table className="w-full text-left text-[13px]">
                <thead className="text-gray-500 tracking-widest uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-4 font-semibold pb-8">REQUEST ID / ROUTING</th>
                    <th className="py-4 font-semibold text-right pb-8">SAVINGS (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-5">
                      <div className="text-gray-200">REQ_99AD2X</div>
                      <div className="text-gray-600 text-[11px] mt-1 font-sans">GPT-4o → Claude Haiku</div>
                    </td>
                    <td className="py-5 text-right text-[#FFA69E] font-bold pr-2">$0.015</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-5">
                      <div className="text-gray-200">REQ_88BBY</div>
                      <div className="text-gray-600 text-[11px] mt-1 font-sans">GPT-4o → Llama 3 (Groq)</div>
                    </td>
                    <td className="py-5 text-right text-[#FFA69E] font-bold pr-2">$0.038</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-5">
                      <div className="text-gray-200">REQ_77CCZ</div>
                      <div className="text-gray-600 text-[11px] mt-1 font-sans">Maintained GPT-4o (High Complexity)</div>
                    </td>
                    <td className="py-5 text-right text-gray-500">$0.000</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-5">
                      <div className="text-gray-200">REQ_82DK2</div>
                      <div className="text-gray-600 text-[11px] mt-1 font-sans">GPT-4o → Mixtral (Fallback Trigggered)</div>
                    </td>
                    <td className="py-5 text-right text-[#FFA69E] font-bold pr-2">$0.012</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="w-full max-w-7xl h-[1px] bg-white/5"></div>

        {/* Section 6: Pricing Grid */}
        <section className="w-full py-32 text-center flex flex-col items-center px-6">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-16">
            ZYRA IS NOT A COST. IT'S A SYSTEM THAT REDUCES SPEND.
          </div>
          <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 text-gray-500 mb-32 opacity-70">
            <span className="text-2xl font-bold tracking-widest uppercase">QUANTUM</span>
            <span className="text-2xl font-bold tracking-widest uppercase">NEXUS.IO</span>
            <span className="text-2xl font-bold tracking-widest uppercase">VOXELS</span>
            <span className="text-2xl font-bold tracking-widest uppercase">SYNAPSE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left w-full max-w-6xl">
            <div className="border border-white/10 p-8 rounded-xl bg-[#121214]">
              <ShieldCheck className="w-5 h-5 mb-5 text-[#FFA69E]" strokeWidth={1.5} />
              <h4 className="font-bold text-[18px] mb-1 text-white">Builder Plan</h4>
              <p className="text-[#FFA69E] font-medium text-[13px] mb-4">Free forever</p>
              <p className="text-gray-400 text-[13px] leading-relaxed mb-6">Perfect for indie hackers and prototyping.</p>
              <ul className="text-[13px] text-gray-500 space-y-2">
                <li>• Limited usage limits</li>
                <li>• Basic cost optimizer</li>
                <li>• Standard logging</li>
              </ul>
            </div>
            <div className="border border-[#FFA69E] shadow-[0_0_15px_rgba(255,166,158,0.1)] p-8 rounded-xl bg-gradient-to-b from-[#FFA69E]/5 to-transparent">
              <Zap className="w-5 h-5 mb-5 text-[#FFA69E]" strokeWidth={1.5} />
              <h4 className="font-bold text-[18px] mb-1 text-white">Pro Plan</h4>
              <p className="text-[#FFA69E] font-medium text-[13px] mb-4">₹999 - ₹1999/mo</p>
              <p className="text-gray-400 text-[13px] leading-relaxed mb-6">Designed for scale and deep cost savings.</p>
              <ul className="text-[13px] text-gray-300 space-y-2">
                <li>• Full contextual optimizer</li>
                <li>• Real-time savings dashboard</li>
                <li>• Extended rate limits</li>
              </ul>
            </div>
            <div className="border border-white/10 p-8 rounded-xl bg-[#121214]">
              <FileText className="w-5 h-5 mb-5 text-[#FFA69E]" strokeWidth={1.5} />
              <h4 className="font-bold text-[18px] mb-1 text-white">Growth Plan</h4>
              <p className="text-[#FFA69E] font-medium text-[13px] mb-4">₹3999+/mo</p>
              <p className="text-gray-400 text-[13px] leading-relaxed mb-6">For enterprises processing millions of tokens.</p>
              <ul className="text-[13px] text-gray-500 space-y-2">
                <li>• Team sharing features</li>
                <li>• Custom routing logic</li>
                <li>• Advanced deep analytics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 7: Final CTA */}
        <section className="w-full max-w-7xl mx-auto py-24 px-6 md:pb-40">
          <div className="bg-[#050505] border border-white/5 rounded-[1.5rem] px-8 py-24 md:p-32 text-center relative overflow-hidden flex flex-col items-center">

            {/* Subdued shadow/light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-white opacity-20"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[80px] bg-white opacity-5 blur-[80px]"></div>

            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-10 border border-white/10 rounded-full px-4 py-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#FFA69E] rounded-full"></span>
                THE AI COST OPTIMIZER
              </div>
              <h2 className="text-5xl md:text-[80px] font-bold tracking-tighter leading-[0.95] mb-10 text-white max-w-4xl uppercase">
                REDUCE AI COSTS<br />AUTOMATICALLY.
              </h2>
              <p className="text-gray-400 text-[15px] max-w-lg mx-auto mb-12 leading-relaxed font-medium">
                "Zyra sits between your app and AI models and automatically reduces your AI costs without changing your code."
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="bg-[#FFA69E] text-black px-8 py-4 rounded text-[13px] font-bold hover:bg-white transition-colors">
                  GET STARTED NOW
                </Link>
                <Link href="mailto:sales@zyra.dev" className="bg-transparent border border-white/10 text-white px-8 py-4 rounded text-[13px] font-bold hover:bg-white/5 transition-colors">
                  VIEW DOCUMENTATION
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 pt-24 pb-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16 md:gap-0">
          <div className="max-w-xs">
            <div className="font-bold text-xl tracking-tight mb-4 text-white">ZYRA</div>
            <p className="text-gray-500 text-[13px] leading-relaxed">
              Accelerating intelligence, efficiency, and scale for modern operators.
            </p>
          </div>

          <div className="flex flex-wrap gap-16 md:gap-32">
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-6 border-white/5 pb-2 inline-block">PLATFORM</h4>
              <ul className="space-y-4 text-[13px] text-gray-400 font-medium">
                <li><Link href="#" className="hover:text-white transition-colors">Semantic Proxy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API Architecture</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Observability</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-6 border-white/5 pb-2 inline-block">COMPANY</h4>
              <ul className="space-y-4 text-[13px] text-gray-400 font-medium">
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-6 border-white/5 pb-2 inline-block">LEGAL</h4>
              <ul className="space-y-4 text-[13px] text-gray-400 font-medium">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-600 font-mono">
          <div>© 2026 ZYRA INC. SAN FRANCISCO, CA. ALL RIGHTS RESERVED.</div>
          <div>SYS.VERSION_0.2.A</div>
        </div>
      </footer>

      {/* --- PREMIUM MICRO-FEATURES --- */}
      <PremiumEffects />
    </div>
  )
}

function PremiumEffects() {
  React.useEffect(() => {
    let pb = document.getElementById('scroll-progress');
    if (!pb) {
      pb = document.createElement('div'); pb.id = 'scroll-progress'; document.body.appendChild(pb);
    }

    let cur = document.getElementById('custom-cursor');
    if (!cur) {
      cur = document.createElement('div'); cur.id = 'custom-cursor'; document.body.appendChild(cur);
    }

    let noise = document.getElementById('noise-overlay');
    if (!noise) {
      noise = document.createElement('div'); noise.id = 'noise-overlay'; document.body.appendChild(noise);
    }

    const hero = document.querySelector('main > section:first-child');
    if (hero && !document.querySelector('.blob-1')) {
      const b1 = document.createElement('div'); b1.className = 'bg-blob blob-1';
      const b2 = document.createElement('div'); b2.className = 'bg-blob blob-2';
      hero.appendChild(b1); hero.appendChild(b2);
    }

    let mx = window.innerWidth / 2, my = window.innerHeight / 2, cx = mx, cy = my;
    const moveCursor = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', moveCursor);

    let reqId: number;
    const animCursor = () => {
      cx += (mx - cx) * 0.15; cy += (my - cy) * 0.15;
      if (cur) cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      reqId = requestAnimationFrame(animCursor);
    };
    animCursor();

    const onScroll = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (pb) pb.style.width = `${(scrollPx / winHeightPx) * 100}%`;

      const header = document.querySelector('header');
      if (header) {
        if (scrollPx > 50) header.classList.add('scrolled-nav');
        else header.classList.remove('scrolled-nav');
      }
    };
    window.addEventListener('scroll', onScroll);

    document.querySelectorAll('section > div.bg-\\[\\#121214\\], .grid > div').forEach(card => {
      card.classList.add('spotlight-card');
      const handler = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const rect = card.getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      };
      card.addEventListener('mousemove', handler);
      (card as any)._spotlightHandler = handler;
    });

    document.querySelectorAll('a[href="/register"], a[href="#docs"], button').forEach(btn => {
      btn.classList.add('cta-button');
    });

    const h1 = document.querySelector('h1');
    if (h1 && !h1.innerHTML.includes('gradient-text')) {
      h1.innerHTML = h1.innerHTML.replace(/(AI costs)/g, '<span class="gradient-text">$1</span>');
    }

    const obsv = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('is-visible');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('section').forEach(sec => {
      sec.classList.add('fade-up');
      obsv.observe(sec);
    });

    const countObsv = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const target = e.target as HTMLElement;
        if (e.isIntersecting && !target.dataset.counted) {
          target.dataset.counted = 'true';
          const text = target.innerText;
          const match = text.match(/([\$\d\.]+)([A-Z\%\+]*)/);
          if (match) {
            const num = parseFloat(match[1].replace('$', ''));
            const isFloat = text.includes('.');
            const prefix = text.includes('$') ? '$' : '';
            const suffix = match[2] || '';
            let start = 0;
            const duration = 2000;
            const startTime = performance.now();
            const updateCount = (currTime: number) => {
              const elapsed = currTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const ease = 1 - Math.pow(1 - progress, 4);
              const current = start + (num - start) * ease;
              target.innerText = prefix + (isFloat ? current.toFixed(2) : Math.floor(current)) + suffix;
              if (progress < 1) requestAnimationFrame(updateCount);
              else target.innerText = text;
            };
            requestAnimationFrame(updateCount);
          }
        }
      });
    });
    document.querySelectorAll('.text-3xl.font-bold, .text-2xl.font-bold.font-mono').forEach(el => {
      countObsv.observe(el);
    });

    let backBtn = document.getElementById('back-to-top');
    if (!backBtn) {
      backBtn = document.createElement('button');
      backBtn.id = 'back-to-top';
      backBtn.innerHTML = '↑';
      document.body.appendChild(backBtn);
    }
    const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };
    backBtn.addEventListener('click', scrollToTop);

    const toggleBackBtn = () => {
      if (backBtn) {
        if (window.scrollY > 400) backBtn.classList.add('visible');
        else backBtn.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', toggleBackBtn);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', toggleBackBtn);
      cancelAnimationFrame(reqId);
      obsv.disconnect();
      countObsv.disconnect();
      if (backBtn) backBtn.removeEventListener('click', scrollToTop);
    };
  }, []);

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
      /* Scroll Progress Bar */
      #scroll-progress {
        position: fixed; top: 0; left: 0; height: 2px;
        background: #FFA69E; z-index: 99999;
        width: 0%; transition: width 0.1s ease-out;
      }

      /* Scrolled Nav */
      .scrolled-nav {
        height: 60px !important;
        backdrop-filter: blur(12px) !important;
        background: rgba(11, 11, 12, 0.8) !important;
        border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        padding-top: 10px !important;
        padding-bottom: 10px !important;
      }
      header {
        position: fixed; top: 0; left: 0; width: 100%;
        z-index: 1000; transition: all 0.3s ease;
      }

      /* Scroll Reveals */
      .fade-up {
        opacity: 0; transform: translateY(30px);
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .fade-up.is-visible {
        opacity: 1; transform: translateY(0);
      }

      /* Custom Cursor */
      body { cursor: none !important; }
      a, button { cursor: none !important; }
      #custom-cursor {
        position: fixed; top: 0; left: 0;
        width: 12px; height: 12px; border-radius: 50%;
        background: #FFA69E; pointer-events: none;
        z-index: 999999;
        box-shadow: 0 0 10px rgba(255, 166, 158, 0.6), inset 0 0 4px rgba(255,255,255,0.8);
        transform: translate3d(0, 0, 0);
      }

      /* Card Spotlight */
      .spotlight-card {
        position: relative; overflow: hidden;
      }
      .spotlight-card::before {
        content: ""; position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(255,166,158, 0.08), transparent 40%);
        pointer-events: none; z-index: 10;
        opacity: 0; transition: opacity 0.3s ease;
      }
      .spotlight-card:hover::before { opacity: 1; }

      /* CTA Shimmer */
      .cta-button {
        position: relative; overflow: hidden;
      }
      .cta-button::after {
        content: ""; position: absolute;
        top: 0; left: -150%; width: 50%; height: 100%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
        transform: skewX(-20deg); transition: all 0.6s ease;
      }
      .cta-button:hover::after { left: 150%; }

      /* Text Gradient Effect */
      .gradient-text {
        background: linear-gradient(90deg, #fff, #FFA69E, #fff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-size: 200% auto;
        animation: shine 3s linear infinite;
      }
      @keyframes shine { to { background-position: 200% center; } }

      /* Noise Overlay */
      #noise-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 9998;
        background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
        opacity: 0.03; animation: noise 0.2s infinite alternate;
      }

      /* Animated Blobs */
      .bg-blob {
        position: absolute; border-radius: 50%;
        filter: blur(80px); z-index: -1; opacity: 0.15;
        animation: drift 20s infinite alternate ease-in-out;
      }
      .blob-1 { top: -10%; left: -10%; width: 500px; height: 500px; background: #FFA69E; }
      .blob-2 { top: 20%; right: -5%; width: 400px; height: 400px; background: #8e2de2; animation-delay: -5s; }
      @keyframes drift {
        0% { transform: translate(0, 0) scale(1); }
        100% { transform: translate(100px, 50px) scale(1.1); }
      }

      /* Input/Email focus */
      input:focus {
        outline: none; box-shadow: 0 0 0 2px rgba(255,166,158,0.5);
        animation: pulse-glow 2s infinite;
      }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 0 2px rgba(255,166,158,0.5); }
        50% { box-shadow: 0 0 0 4px rgba(255,166,158,0.2); }
      }

      /* Back to Top */
      #back-to-top {
        position: fixed; bottom: 40px; right: 40px;
        width: 40px; height: 40px; border-radius: 50%;
        background: #18181A; border: 1px solid rgba(255,255,255,0.1);
        color: white; display: flex; align-items: center; justify-content: center;
        cursor: none; opacity: 0; visibility: hidden;
        transition: all 0.3s ease; z-index: 99999;
      }
      #back-to-top.visible { opacity: 1; visibility: visible; }
      #back-to-top:hover { background: #FFA69E; color: black; }
    `}} />
  );
}