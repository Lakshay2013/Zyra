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

exports.calculateCost = (model, promptTokens, completionTokens) => {
  let pricing = MODEL_PRICING['default']
  
  if (model) {
    const modelLower = model.toLowerCase()
    const matchedKey = Object.keys(MODEL_PRICING).find(k => modelLower.includes(k) || k.includes(modelLower))
    if (matchedKey) {
      pricing = MODEL_PRICING[matchedKey]
    }
  }

  const promptCost = (promptTokens / 1000) * pricing.prompt
  const completionCost = (completionTokens / 1000) * pricing.completion
  return parseFloat((promptCost + completionCost).toFixed(6))
}