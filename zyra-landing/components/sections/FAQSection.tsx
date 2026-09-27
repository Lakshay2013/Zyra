'use client'
import { useState } from 'react'
import { FAQItem } from '@/components/ui/faq-item'

const FAQ = [
  { q: 'Do I have to change my code?', a: 'One line: point the OpenAI or Anthropic client’s base URL at Zyra and set model: "auto". Nothing else changes.' },
  { q: 'How much will I save?', a: 'It depends entirely on your workload mix. Short, simple calls save the most; hard reasoning tasks route to a frontier model and save little or nothing. No fixed percentage, no guarantee.' },
  { q: 'What happens if a provider goes down?', a: 'Zyra retries transient errors (429, 500, 502, 503, 504) with bounded exponential backoff, then falls back to the next provider in your configured order. A 401, 403, or invalid-model response never retries.' },
  { q: 'Do you see my prompts?', a: 'Every request is logged asynchronously — provider, model, tokens, cost — for the observability dashboard. Provider API keys are encrypted at rest with a 64-hex-character ENCRYPTION_KEY.' },
  { q: 'Does streaming work?', a: 'Yes — Zyra extends the OpenAI client, so streaming and every OpenAI-compatible parameter pass through unchanged. (Idempotency replay is the one feature that’s non-streaming only.)' },
  { q: 'Can I force a specific model?', a: 'Yes. Pass "gpt-4o" or "openai/gpt-4o" instead of "auto", or set routing constraints with the x-zyra-max-cost / x-zyra-providers headers and x-zyra-mode: strict to disable auto-optimization entirely.' },
  { q: 'Can I self-host?', a: 'Yes — MIT licensed. docker compose up -d --build gets you the API, worker, MongoDB, and Redis.' },
]

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="type-h1 text-center text-text">Questions</h2>
      <div className="mt-10 space-y-3">
        {FAQ.map((item, i) => (
          <FAQItem key={item.q} q={item.q} a={item.a} open={open === i} onClick={() => setOpen(open === i ? null : i)} />
        ))}
      </div>
    </section>
  )
}
