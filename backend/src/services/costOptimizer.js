const {
  calculateCost,
  estimateCost,
  getModelTier,
  getCheapestInTier,
  getProvider,
  matchModel,
  MODEL_TO_PROVIDER,
  MODEL_TIERS
} = require('../utils/costCalculator')

/**
 * Rough token estimate from prompt text.
 * ~4 chars per token is a good English approximation.
 */
const estimateTokenCount = (text) => {
  if (!text) return 100
  return Math.max(Math.ceil(text.length / 4), 1)
}

/**
 * Classify prompt complexity to determine if we can safely downgrade.
 *
 * SIMPLE prompts (→ can use economy tier):
 *   - Short (< 200 tokens estimated)
 *   - No code blocks, no structured data requests
 *
 * COMPLEX prompts (→ keep current tier or upgrade):
 *   - Long (> 800 tokens estimated)
 *   - Contains code, JSON, analysis requests
 *   - Multi-turn with large context
 *
 * STANDARD: everything else (→ use standard tier)
 */
const classifyPromptComplexity = (promptText, estimatedTokens) => {
  if (!promptText) return 'standard'

  const text = promptText.toLowerCase()

  // Markers of complex prompts
  const complexMarkers = [
    /```[\s\S]*?```/,           // code blocks
    /\bwrite\s+(a\s+)?code\b/,  // "write code"
    /\banalyze\b/,              // analysis
    /\bcompare\b.*\band\b/,     // comparison tasks
    /\brefactor\b/,             // refactoring
    /\bdebug\b/,                // debugging
    /\bexplain\s+in\s+detail\b/,// detailed explanation
    /\bjson\b.*\bschema\b/,     // structured output
    /\bstep[\s-]by[\s-]step\b/, // step-by-step reasoning
    /\btranslate\b.*\bto\b/,    // translation
    /\bsummarize\b.*\b(article|document|paper)\b/ // document summarization
  ]

  const isComplex = estimatedTokens > 800 || complexMarkers.some(rx => rx.test(text))

  // Markers of simple prompts
  const simpleMarkers = [
    /^(hi|hello|hey|thanks|thank you|ok|yes|no)\b/,
    /\b(what is|who is|when was|where is)\b/,   // simple factual questions
    /\bdefine\b/,                                // definitions
    /\btell me a joke\b/,
    /\b(one word|short answer|brief)\b/
  ]

  const isSimple = estimatedTokens < 200 && simpleMarkers.some(rx => rx.test(text))

  if (isComplex) return 'complex'
  if (isSimple) return 'simple'
  return 'standard'
}

/**
 * Map complexity to the ideal quality tier.
 */
const complexityToTier = (complexity) => {
  switch (complexity) {
    case 'simple': return 'economy'
    case 'complex': return 'premium'
    default: return 'standard'
  }
}

/**
 * Get one tier higher than the current tier (for quality fallback).
 */
const getHigherTier = (tier) => {
  const tiers = ['economy', 'standard', 'premium']
  const idx = tiers.indexOf(tier)
  if (idx < 0 || idx >= tiers.length - 1) return 'premium'
  return tiers[idx + 1]
}

/**
 * Core optimizer function.
 * Called BEFORE every proxy request when auto-optimize is enabled.
 *
 * Strategy:
 *   1. Classify prompt complexity (simple/standard/complex)
 *   2. Map to ideal quality tier
 *   3. Find cheapest model in that tier the org has keys for
 *   4. Only switch if it saves money
 *
 * @param {Object} org - Organization document
 * @param {string} currentModel - The model the user requested
 * @param {string} currentProvider - The provider the user targeted
 * @param {string} promptText - The extracted prompt text
 * @returns {Object} optimization result
 */
const optimizeRequest = (org, currentModel, currentProvider, promptText) => {
  const result = {
    wasOptimized: false,
    originalModel: currentModel,
    originalProvider: currentProvider,
    optimizedModel: currentModel,
    optimizedProvider: currentProvider,
    originalCost: 0,
    optimizedCost: 0,
    savings: 0,
    complexity: 'standard',
    tier: 'standard'
  }

  // Only optimize if org has auto-optimize enabled
  if (!org.optimizer?.autoOptimize) {
    return result
  }

  const estimatedPromptTokens = estimateTokenCount(promptText)
  const currentTier = getModelTier(currentModel)

  // Classify prompt complexity
  const complexity = classifyPromptComplexity(promptText, estimatedPromptTokens)
  const idealTier = complexityToTier(complexity)
  result.complexity = complexity
  result.tier = idealTier

  // Use the org's preferred tier if set, otherwise use complexity-based tier
  // But never go HIGHER than what the user requested (respect their max)
  const tiers = ['economy', 'standard', 'premium']
  const requestedTierIdx = tiers.indexOf(currentTier)
  const idealTierIdx = tiers.indexOf(idealTier)
  const orgTier = org.optimizer?.qualityTier
  const orgTierIdx = orgTier ? tiers.indexOf(orgTier) : idealTierIdx

  // Pick the lower of: org preference, complexity recommendation, user's requested tier
  const targetTierIdx = Math.min(requestedTierIdx, Math.max(orgTierIdx, idealTierIdx))
  const targetTier = tiers[targetTierIdx] || 'standard'

  // Get all models in the target tier, sorted cheapest first
  const alternatives = getCheapestInTier(targetTier, estimatedPromptTokens)

  // Filter to only models the org has provider keys configured for
  const availableAlternatives = alternatives.filter(alt => {
    const provider = alt.provider
    return org.providerKeys?.[provider]
  })

  result.originalCost = estimateCost(currentModel, estimatedPromptTokens)

  if (availableAlternatives.length === 0) {
    return result
  }

  const cheapest = availableAlternatives[0]

  // Only optimize if we'd actually save money
  if (cheapest.estimatedCost < result.originalCost) {
    result.wasOptimized = true
    result.optimizedModel = cheapest.model
    result.optimizedProvider = cheapest.provider
    result.optimizedCost = cheapest.estimatedCost
    result.savings = parseFloat((result.originalCost - cheapest.estimatedCost).toFixed(6))
  }

  return result
}

/**
 * Calculate actual savings AFTER a request completes.
 * Uses real token counts instead of estimates.
 */
const calculateActualSavings = (originalModel, actualModel, promptTokens, completionTokens) => {
  if (originalModel === actualModel) return 0
  const originalCost = calculateCost(originalModel, promptTokens, completionTokens)
  const actualCost = calculateCost(actualModel, promptTokens, completionTokens)
  return parseFloat(Math.max(originalCost - actualCost, 0).toFixed(6))
}

/**
 * Build the model swap mapping for the proxy.
 * When optimizer picks a different provider, we need to know how to rewrite the request.
 */
const getProviderConfig = (provider) => {
  const PROVIDERS = {
    openai: {
      baseUrl: 'https://api.openai.com',
      authHeader: 'Authorization',
      chatPath: '/v1/chat/completions'
    },
    anthropic: {
      baseUrl: 'https://api.anthropic.com',
      authHeader: 'x-api-key',
      chatPath: '/v1/messages'
    },
    gemini: {
      baseUrl: 'https://generativelanguage.googleapis.com',
      authHeader: 'Authorization',
      chatPath: ''
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai',
      authHeader: 'Authorization',
      chatPath: '/v1/chat/completions'
    }
  }
  return PROVIDERS[provider] || null
}

module.exports = {
  optimizeRequest,
  calculateActualSavings,
  estimateTokenCount,
  getProviderConfig,
  classifyPromptComplexity,
  getHigherTier
}
