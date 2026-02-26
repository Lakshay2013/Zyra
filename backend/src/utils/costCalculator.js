// Prices per 1000 tokens in USD
const MODEL_PRICING = {
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
  'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
  'gemini-pro': { prompt: 0.0005, completion: 0.0015 },
  'default': { prompt: 0.01, completion: 0.03 }
}

exports.calculateCost = (model, promptTokens, completionTokens) => {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default']
  const promptCost = (promptTokens / 1000) * pricing.prompt
  const completionCost = (completionTokens / 1000) * pricing.completion
  return parseFloat((promptCost + completionCost).toFixed(6))
}