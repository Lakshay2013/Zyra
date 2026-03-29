// Prices per 1000 tokens in USD
const MODEL_PRICING = {
  // OpenAI
  'gpt-4o': { prompt: 0.005, completion: 0.015 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  // Anthropic
  'claude-3-5-sonnet': { prompt: 0.003, completion: 0.015 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
  // Gemini
  'gemini-1.5-pro': { prompt: 0.0035, completion: 0.0105 },
  'gemini-1.5-flash': { prompt: 0.000075, completion: 0.0003 },
  // Groq
  'llama3-70b-8192': { prompt: 0.00059, completion: 0.00079 },
  'mixtral-8x7b-32768': { prompt: 0.00024, completion: 0.00024 },
  'default': { prompt: 0.005, completion: 0.015 }
}

// Which provider each model belongs to
const MODEL_TO_PROVIDER = {
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-4-turbo': 'openai',
  'gpt-3.5-turbo': 'openai',
  'claude-3-5-sonnet': 'anthropic',
  'claude-3-opus': 'anthropic',
  'claude-3-haiku': 'anthropic',
  'gemini-1.5-pro': 'gemini',
  'gemini-1.5-flash': 'gemini',
  'llama3-70b-8192': 'groq',
  'mixtral-8x7b-32768': 'groq'
}

// Quality tiers — models within the same tier produce comparable output quality
const MODEL_TIERS = {
  premium: ['gpt-4o', 'claude-3-opus', 'gemini-1.5-pro', 'gpt-4-turbo'],
  standard: ['gpt-4o-mini', 'claude-3-5-sonnet', 'llama3-70b-8192'],
  economy: ['gpt-3.5-turbo', 'claude-3-haiku', 'gemini-1.5-flash', 'mixtral-8x7b-32768']
}

const matchModel = (model) => {
  if (!model) return null
  const modelLower = model.toLowerCase()
  return Object.keys(MODEL_PRICING).find(k => k !== 'default' && (modelLower.includes(k) || k.includes(modelLower))) || null
}

const getPricing = (model) => {
  const matched = matchModel(model)
  return matched ? MODEL_PRICING[matched] : MODEL_PRICING['default']
}

const calculateCost = (model, promptTokens, completionTokens) => {
  const pricing = getPricing(model)
  const promptCost = (promptTokens / 1000) * pricing.prompt
  const completionCost = (completionTokens / 1000) * pricing.completion
  return parseFloat((promptCost + completionCost).toFixed(6))
}

// Estimate cost before a request (we don't know completion tokens yet, so estimate)
const estimateCost = (model, estimatedPromptTokens, estimatedCompletionTokens = null) => {
  const pricing = getPricing(model)
  const compTokens = estimatedCompletionTokens || Math.round(estimatedPromptTokens * 1.5)
  return parseFloat(((estimatedPromptTokens / 1000) * pricing.prompt + (compTokens / 1000) * pricing.completion).toFixed(6))
}

// Get the tier a model belongs to
const getModelTier = (model) => {
  const matched = matchModel(model)
  if (!matched) return 'standard'
  for (const [tier, models] of Object.entries(MODEL_TIERS)) {
    if (models.includes(matched)) return tier
  }
  return 'standard'
}

// Get all models in the same tier, sorted by estimated cost (cheapest first)
const getCheapestInTier = (tier, estimatedPromptTokens) => {
  const models = MODEL_TIERS[tier] || MODEL_TIERS['standard']
  return models
    .map(model => ({
      model,
      provider: MODEL_TO_PROVIDER[model],
      estimatedCost: estimateCost(model, estimatedPromptTokens)
    }))
    .sort((a, b) => a.estimatedCost - b.estimatedCost)
}

// Get provider for a model
const getProvider = (model) => {
  const matched = matchModel(model)
  return matched ? MODEL_TO_PROVIDER[matched] : null
}

module.exports = {
  MODEL_PRICING,
  MODEL_TO_PROVIDER,
  MODEL_TIERS,
  calculateCost,
  estimateCost,
  getModelTier,
  getCheapestInTier,
  getProvider,
  matchModel,
  getPricing
}