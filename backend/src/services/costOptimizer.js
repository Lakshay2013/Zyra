const {
  calculateCost,
  estimateCost,
  getModelTier,
  getCheapestInTier,
  getProvider,
  matchModel,
  MODEL_TO_PROVIDER
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
 * Core optimizer function.
 * Called BEFORE every proxy request when auto-optimize is enabled.
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
    recommendedModel: currentModel,
    recommendedProvider: currentProvider,
    originalEstimatedCost: 0,
    optimizedEstimatedCost: 0,
    estimatedSavings: 0,
    alternatives: []
  }

  // Only optimize if org has auto-optimize enabled
  if (!org.optimizer?.autoOptimize) {
    return result
  }

  const estimatedPromptTokens = estimateTokenCount(promptText)
  const currentTier = getModelTier(currentModel)

  // Use the org's preferred quality tier if set, otherwise match the requested model's tier
  const targetTier = org.optimizer?.qualityTier || currentTier

  // Get all models in the target tier, sorted cheapest first
  const alternatives = getCheapestInTier(targetTier, estimatedPromptTokens)

  // Filter to only models the org has provider keys configured for
  const availableAlternatives = alternatives.filter(alt => {
    const provider = alt.provider
    return org.providerKeys?.[provider]
  })

  result.alternatives = availableAlternatives
  result.originalEstimatedCost = estimateCost(currentModel, estimatedPromptTokens)

  if (availableAlternatives.length === 0) {
    // No alternatives available, use original
    return result
  }

  const cheapest = availableAlternatives[0]

  // Only optimize if we'd actually save money
  if (cheapest.estimatedCost < result.originalEstimatedCost) {
    result.wasOptimized = true
    result.recommendedModel = cheapest.model
    result.recommendedProvider = cheapest.provider
    result.optimizedEstimatedCost = cheapest.estimatedCost
    result.estimatedSavings = parseFloat((result.originalEstimatedCost - cheapest.estimatedCost).toFixed(6))
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
  getProviderConfig
}
