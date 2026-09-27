import { PRICING, costFor, type ModelId } from './pricing'

export type Complexity = 'simple' | 'standard' | 'complex'
export type Tier = 'economy' | 'standard' | 'premium'

export interface RoutingPrompt {
  id: string
  label: string
  request: string
  complexity: Complexity
  tier: Tier
  model: ModelId
  promptTokens: number
  completionTokens: number
}

// Real pipeline stage sequence, matching backend/src/controllers/unifiedProxyController.js.
// Complexity classification rules mirror backend/src/services/costOptimizer.js#classifyPromptComplexity.
export const ROUTING_PROMPTS: RoutingPrompt[] = [
  {
    id: 'simple',
    label: 'Simple',
    request: 'What is the capital of France?',
    complexity: 'simple',
    tier: 'economy',
    model: 'llama-3.1-8b-instant',
    promptTokens: 15,
    completionTokens: 20,
  },
  {
    id: 'standard',
    label: 'Standard',
    request: 'Summarize this changelog into three bullet points for our release notes.',
    complexity: 'standard',
    tier: 'standard',
    model: 'gemini-2.0-flash',
    promptTokens: 180,
    completionTokens: 220,
  },
  {
    id: 'complex',
    label: 'Complex',
    request: 'Refactor this auth middleware to fix the race condition — explain step-by-step what changed and why.',
    complexity: 'complex',
    tier: 'premium',
    model: 'gpt-4o',
    promptTokens: 420,
    completionTokens: 650,
  },
]

const NAIVE_MODEL: ModelId = 'gpt-4o'

export function routingOutcome(prompt: RoutingPrompt) {
  const routedCost = costFor(prompt.model, prompt.promptTokens, prompt.completionTokens)
  const naiveCost = costFor(NAIVE_MODEL, prompt.promptTokens, prompt.completionTokens)
  const savings = naiveCost - routedCost
  const savingsPct = naiveCost > 0 ? (savings / naiveCost) * 100 : 0
  return { routedCost, naiveCost, savings, savingsPct, provider: PRICING[prompt.model].provider }
}

// Real x-zyra-* debug headers, from unifiedProxyController.js.
export function debugHeaders(prompt: RoutingPrompt) {
  const { routedCost, savings, provider } = routingOutcome(prompt)
  return [
    { key: 'x-zyra-model', value: prompt.model },
    { key: 'x-zyra-provider', value: provider },
    { key: 'x-zyra-cost', value: routedCost.toFixed(6) },
    { key: 'x-zyra-savings', value: savings.toFixed(6) },
    { key: 'x-zyra-complexity', value: prompt.complexity },
  ]
}

export interface PipelineStage {
  label: string
  result: (prompt: RoutingPrompt) => string
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { label: 'auth', result: () => 'ok' },
  { label: 'pre-flight', result: () => 'clean' },
  { label: 'idempotency', result: () => 'miss' },
  { label: 'cache', result: () => 'miss' },
  { label: 'usage', result: () => 'reserved' },
  { label: 'complexity', result: (p) => p.complexity },
  { label: 'tier', result: (p) => p.tier },
  { label: 'route', result: (p) => `${PRICING[p.model].provider}/${p.model}` },
]
