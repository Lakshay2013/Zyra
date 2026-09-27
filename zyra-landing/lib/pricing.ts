// Public list prices, USD per 1M tokens. Checked 2026-03-01.
// Mirrors backend/src/utils/costCalculator.js (per-1K there, x1000 here) —
// keep these two in sync if list prices change.
export type ModelId = keyof typeof PRICING

export const PRICING = {
  'gpt-4o': { provider: 'openai', prompt: 5.0, completion: 15.0, tier: 'premium' as const },
  'gpt-4o-mini': { provider: 'openai', prompt: 0.15, completion: 0.6, tier: 'economy' as const },
  'claude-opus-4-6': { provider: 'anthropic', prompt: 5.0, completion: 25.0, tier: 'premium' as const },
  'claude-sonnet-4-6': { provider: 'anthropic', prompt: 3.0, completion: 15.0, tier: 'standard' as const },
  'claude-haiku-4-5': { provider: 'anthropic', prompt: 1.0, completion: 5.0, tier: 'economy' as const },
  'gemini-2.0-flash': { provider: 'gemini', prompt: 0.1, completion: 0.4, tier: 'standard' as const },
  'llama-3.1-8b-instant': { provider: 'groq', prompt: 0.05, completion: 0.08, tier: 'economy' as const },
} as const

export const PRICING_CHECKED_DATE = '2026-03-01'

export function costFor(model: ModelId, promptTokens: number, completionTokens: number) {
  const p = PRICING[model]
  return (promptTokens / 1_000_000) * p.prompt + (completionTokens / 1_000_000) * p.completion
}

export function formatCost(usd: number) {
  if (usd < 0.01) return `$${usd.toFixed(5)}`
  return `$${usd.toFixed(4)}`
}
