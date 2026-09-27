'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { RoutingDemo } from './RoutingDemo'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center md:pt-28">
      <motion.div {...fadeUp(0)} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-subtle px-3.5 py-1.5 type-mono text-[12px] text-text-secondary">
        v0.1.0-beta
      </motion.div>
      <motion.h1 {...fadeUp(0.06)} className="type-display text-text">
        Your app sends <span className="type-mono text-accent">hi</span>.<br />Your bill says GPT-4.
      </motion.h1>
      <motion.p {...fadeUp(0.12)} className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-text-secondary">
        Zyra is an OpenAI-compatible gateway that routes every request to the cheapest model that can actually handle
        it. Change one line: <code className="type-mono rounded bg-bg-subtle px-1.5 py-0.5 text-text">model: &quot;auto&quot;</code>.
      </motion.p>
      <motion.div {...fadeUp(0.18)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/register"><Button size="lg">Get API Key</Button></Link>
        <Link href="/docs"><Button size="lg" variant="outline">Read Docs</Button></Link>
      </motion.div>
      <motion.p {...fadeUp(0.24)} className="type-mono mt-6 text-[12px] text-text-tertiary">
        OpenAI · Anthropic · Groq · Gemini — bring your own keys.
      </motion.p>

      <motion.div {...fadeUp(0.3)} className="mt-14 min-h-[520px] md:min-h-[420px]">
        <RoutingDemo />
      </motion.div>
    </section>
  )
}
