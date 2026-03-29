const axios = require('axios')
const InteractionLog = require('../models/InteractionLog')
const Organization = require('../models/Organization')
const { decrypt } = require('../utils/crypto')
const { calculateCost, getProvider: getModelProvider, MODEL_TO_PROVIDER } = require('../utils/costCalculator')
const { detectInjection } = require('../utils/injectionDetector')
const { getRiskQueue, getLogQueue } = require('../config/queue')
const { optimizeRequest, calculateActualSavings } = require('../services/costOptimizer')
const { executeWithRetry } = require('../services/retryHandler')

const PROVIDERS = {
  openai: {
    baseUrl: 'https://api.openai.com',
    authHeader: 'Authorization'
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    authHeader: 'x-api-key'
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    authHeader: 'Authorization'
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai',
    authHeader: 'Authorization'
  }
}

const extractPrompt = (provider, body) => {
  try {
    if (provider === 'openai' || provider === 'anthropic' || provider === 'groq') {
      const messages = body.messages || []
      return messages
        .map(m => `[${m.role}]: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
        .join('\n')
    }
    if (provider === 'gemini') {
      return body.contents?.map(c => c.parts?.map(p => p.text).join('')).join('\n') || ''
    }
    return JSON.stringify(body)
  } catch (e) {
    return ''
  }
}

const extractResponse = (provider, responseBody) => {
  try {
    if (provider === 'openai' || provider === 'groq') {
      return responseBody.choices?.[0]?.message?.content || ''
    }
    if (provider === 'anthropic') {
      return responseBody.content?.[0]?.text || ''
    }
    if (provider === 'gemini') {
      return responseBody.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }
    return ''
  } catch (e) {
    return ''
  }
}

const extractTokens = (provider, responseBody) => {
  try {
    if (provider === 'openai' || provider === 'groq') {
      return {
        prompt: responseBody.usage?.prompt_tokens || 0,
        completion: responseBody.usage?.completion_tokens || 0,
        total: responseBody.usage?.total_tokens || 0
      }
    }
    if (provider === 'anthropic') {
      return {
        prompt: responseBody.usage?.input_tokens || 0,
        completion: responseBody.usage?.output_tokens || 0,
        total: (responseBody.usage?.input_tokens || 0) + (responseBody.usage?.output_tokens || 0)
      }
    }
    return { prompt: 0, completion: 0, total: 0 }
  } catch (e) {
    return { prompt: 0, completion: 0, total: 0 }
  }
}

/**
 * Resolve the provider API key — from headers or org vault.
 */
const resolveProviderKey = (req, org, provider) => {
  const providerConfig = PROVIDERS[provider]
  if (!providerConfig) return null

  let key = req.headers[providerConfig.authHeader.toLowerCase()] ||
            req.headers['authorization'] ||
            req.headers['x-api-key']

  if (!key) {
    const encryptedKey = org.providerKeys?.[provider]
    if (encryptedKey) {
      const decrypted = decrypt(encryptedKey)
      key = providerConfig.authHeader === 'Authorization' && !decrypted.startsWith('Bearer ')
        ? `Bearer ${decrypted}`
        : decrypted
    }
  }

  return key
}

/**
 * Build the axios request config for a given provider.
 */
const buildRequestConfig = (provider, upstreamPath, providerApiKey, requestBody, req) => {
  const providerConfig = PROVIDERS[provider]
  const upstreamUrl = `${providerConfig.baseUrl}${upstreamPath}`

  return {
    method: req.method,
    url: upstreamUrl,
    headers: {
      'Content-Type': 'application/json',
      [providerConfig.authHeader]: providerApiKey,
      ...(provider === 'anthropic' && {
        'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
      })
    },
    data: requestBody,
    timeout: 60000
  }
}

/**
 * Build fallback request configs from the org's fallback order.
 */
const buildFallbacks = (org, upstreamPath, requestBody, req, currentProvider, model) => {
  const fallbackOrder = org.reliability?.fallbackOrder || []
  const fallbacks = []

  for (const fbProvider of fallbackOrder) {
    if (fbProvider === currentProvider) continue

    const fbKey = resolveProviderKey(req, org, fbProvider)
    if (!fbKey) continue

    // Find a model for this fallback provider that's compatible
    const fbModel = findCompatibleModel(model, fbProvider)
    if (!fbModel) continue

    const fbBody = { ...requestBody, model: fbModel }
    const fbConfig = buildRequestConfig(fbProvider, upstreamPath, fbKey, fbBody, req)

    fallbacks.push({
      requestConfig: fbConfig,
      provider: fbProvider,
      model: fbModel
    })
  }

  return fallbacks
}

/**
 * Find a compatible model for a fallback provider.
 * Maps across providers at roughly the same quality tier.
 */
const findCompatibleModel = (originalModel, targetProvider) => {
  // Simple mapping: pick the first model available for the target provider
  const providerModels = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet',
    gemini: 'gemini-1.5-flash',
    groq: 'llama3-70b-8192'
  }
  return providerModels[targetProvider] || null
}


// ──────────────────────────────────────────────────────
// MAIN PROXY HANDLER
// Pipeline: auth → policy → optimize → retry+fallback → log
// ──────────────────────────────────────────────────────
exports.proxy = async (req, res) => {
  const start = Date.now()

  const urlParts = req.path.split('/').filter(Boolean)
  const provider = urlParts[0]
  const upstreamPath = '/' + urlParts.slice(1).join('/')

  const providerConfig = PROVIDERS[provider]
  if (!providerConfig) {
    return res.status(400).json({ message: `Unsupported provider: ${provider}. Supported: openai, anthropic, gemini, groq` })
  }

  const org = req.org

  if (org.currentMonthLogs >= org.monthlyLogLimit) {
    return res.status(429).json({ message: 'Monthly log limit reached. Please upgrade your plan.' })
  }

  // ── Resolve API key ──
  let providerApiKey = resolveProviderKey(req, org, provider)
  if (!providerApiKey) {
    return res.status(400).json({
      message: `Missing provider API key. Configure your ${provider} key in Organization Settings or pass it in headers.`
    })
  }

  const requestBody = { ...req.body }
  let model = requestBody.model || 'unknown'
  const userId = req.headers['x-user-id'] || requestBody.user || 'anonymous'

  // ── Apply Policies ──
  const maxTokens = org.policies?.maxTokensPerRequest || 2000
  if (!requestBody.max_tokens || requestBody.max_tokens > maxTokens) {
    requestBody.max_tokens = maxTokens
  }

  if (org.policies?.blockInjection) {
    const promptText = extractPrompt(provider, requestBody)
    if (promptText) {
      const injectionResult = detectInjection(promptText)
      if (injectionResult.hasInjection) {
        return res.status(403).json({
          error: 'Zyra Firewall blocked this request due to Prompt Injection policy.',
          matches: injectionResult.matches
        })
      }
    }
  }

  // ── Cost Optimizer ──
  const promptText = extractPrompt(provider, requestBody)
  let actualProvider = provider
  let actualModel = model
  let optimizerResult = {
    wasOptimized: false,
    originalModel: model,
    originalProvider: provider,
    estimatedSavings: 0,
    originalEstimatedCost: 0
  }

  if (org.optimizer?.autoOptimize) {
    optimizerResult = optimizeRequest(org, model, provider, promptText)

    if (optimizerResult.wasOptimized) {
      actualProvider = optimizerResult.recommendedProvider
      actualModel = optimizerResult.recommendedModel

      // Rewrite the request to use the optimized model
      requestBody.model = actualModel

      // If the provider changed, we need a different API key
      if (actualProvider !== provider) {
        providerApiKey = resolveProviderKey(req, org, actualProvider)
        if (!providerApiKey) {
          // Can't switch provider — fall back to original
          actualProvider = provider
          actualModel = model
          requestBody.model = model
          optimizerResult.wasOptimized = false
          providerApiKey = resolveProviderKey(req, org, provider)
        }
      }

      console.log(`[Optimizer] ${model} → ${actualModel} (est. savings: $${optimizerResult.estimatedSavings})`)
    }
  }

  // ── Build primary request ──
  const primaryConfig = buildRequestConfig(actualProvider, upstreamPath, providerApiKey, requestBody, req)

  // ── Build fallbacks ──
  const fallbacks = buildFallbacks(org, upstreamPath, requestBody, req, actualProvider, actualModel)

  // ── Execute with retry + fallback ──
  let responseBody
  let statusCode
  let retryCount = 0
  let fallbackUsed = false
  let fallbackProvider = null
  let finalModel = actualModel
  let finalProvider = actualProvider

  const enableRetry = org.reliability?.enableRetry !== false
  const maxRetries = enableRetry ? (org.reliability?.maxRetries ?? 2) : 0

  try {
    const result = await executeWithRetry(primaryConfig, {
      maxRetries,
      baseDelay: 500,
      fallbacks,
      provider: actualProvider,
      model: actualModel
    })

    statusCode = result.response.status
    responseBody = result.response.data
    retryCount = result.retryCount
    fallbackUsed = result.fallbackUsed
    fallbackProvider = result.fallbackProvider
    finalModel = result.model
    finalProvider = result.provider

    res.status(statusCode).json(responseBody)

  } catch (err) {
    console.error('[Proxy] All attempts failed:', err.message)
    statusCode = err.response?.status || 502
    responseBody = err.response?.data || { message: 'Failed to reach upstream provider' }
    return res.status(statusCode).json(responseBody)
  }

  // ── Async logging with optimizer + reliability metadata ──
  try {
    const latency = Date.now() - start
    const prompt = extractPrompt(finalProvider, requestBody)
    const response = extractResponse(finalProvider, responseBody)
    const tokens = extractTokens(finalProvider, responseBody)
    const cost = calculateCost(finalModel, tokens.prompt, tokens.completion)

    // Calculate actual savings (using real token counts, not estimates)
    const actualSavings = optimizerResult.wasOptimized
      ? calculateActualSavings(optimizerResult.originalModel, finalModel, tokens.prompt, tokens.completion)
      : 0
    const originalCost = optimizerResult.wasOptimized
      ? calculateCost(optimizerResult.originalModel, tokens.prompt, tokens.completion)
      : cost

    const logQueue = getLogQueue()
    await logQueue.add('log-interaction', {
      orgId: org._id.toString(),
      userId,
      model: finalModel,
      prompt,
      response,
      tokens,
      cost,
      latency,
      statusCode,
      // Optimizer data
      optimizer: {
        originalModel: optimizerResult.originalModel,
        optimizedModel: optimizerResult.wasOptimized ? finalModel : null,
        originalCost,
        savings: actualSavings,
        wasOptimized: optimizerResult.wasOptimized
      },
      // Reliability data
      reliability: {
        retryCount,
        fallbackUsed,
        fallbackProvider
      }
    })

  } catch (err) {
    console.error('[Proxy] Logging error:', err.message)
  }
}