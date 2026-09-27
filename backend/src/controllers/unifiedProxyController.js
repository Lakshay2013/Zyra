/**
 * UNIFIED PROXY CONTROLLER
 * 
 * OpenAI-compatible /v1/ gateway for Zyra.
 * 
 * Features:
 *   - POST /v1/chat/completions  (main)
 *   - POST /v1/completions       (legacy)
 *   - POST /v1/embeddings        (pass-through)
 *   - model: "auto"              (full optimizer routing)
 *   - model: "openai/gpt-4o"     (provider-prefixed)
 *   - model: "gpt-4o"            (auto-detect provider)
 *   - Streaming (stream: true)   (SSE pipe)
 *   - Exact-match caching        (Redis)
 *   - Debug headers              (x-zyra-debug)
 *   - Constraints                (x-zyra-max-cost, x-zyra-providers)
 */

const https = require('https')
const http = require('http')
const axios = require('axios')
const InteractionLog = require('../models/InteractionLog')
const Organization = require('../models/Organization')
const { decrypt } = require('../utils/crypto')
const { calculateCost, getProvider: getModelProvider, MODEL_TO_PROVIDER, matchModel, estimateCost } = require('../utils/costCalculator')
const { detectInjection } = require('../utils/injectionDetector')
const { detectPII } = require('../utils/piiDetector')
const { detectJailbreak } = require('../utils/jailbreakDetector')
const { getRiskQueue, getLogQueue } = require('../config/queue')
const { reserveMonthlyLog, releaseMonthlyLog } = require('../services/usageLimiter')
const idempotency = require('../services/idempotency')
const { optimizeRequest, calculateActualSavings, estimateTokenCount } = require('../services/costOptimizer')
const { executeWithRetry } = require('../services/retryHandler')
const { validateResponse, getQualityFallbackModel } = require('../services/qualityGuard')
const { buildCacheKey, getFromCache, setInCache } = require('../services/cacheLayer')
const geminiAdapter = require('../services/providers/gemini')
const simulator = require('../services/providers/simulator')

// ──────────────────────────────────────────────────────────────
// PROVIDER CONFIGS
// ──────────────────────────────────────────────────────────────
const PROVIDERS = {
  openai: {
    baseUrl: 'https://api.openai.com',
    authHeader: 'Authorization',
    chatPath: '/v1/chat/completions',
    completionsPath: '/v1/completions',
    embeddingsPath: '/v1/embeddings'
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    authHeader: 'x-api-key',
    chatPath: '/v1/messages',
    completionsPath: null,
    embeddingsPath: null
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    authHeader: 'x-goog-api-key',
    // Gemini is translated by services/providers/gemini.js — path is model-specific
    // and built there, so this is only a nominal value.
    chatPath: '/v1beta/models',
    completionsPath: null,
    embeddingsPath: null,
    translated: true
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai',
    authHeader: 'Authorization',
    chatPath: '/v1/chat/completions',
    completionsPath: null,
    embeddingsPath: null
  }
}

// ──────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────

/**
 * Resolve model name to { provider, model }.
 * Supports: "auto", "openai/gpt-4o", "gpt-4o"
 */
const resolveModel = (modelInput) => {
  if (!modelInput || modelInput === 'auto') {
    return { provider: null, model: 'auto', isAuto: true }
  }

  // Check for provider prefix: "openai/gpt-4o" → { provider: 'openai', model: 'gpt-4o' }
  if (modelInput.includes('/')) {
    const [providerHint, ...rest] = modelInput.split('/')
    const modelName = rest.join('/')
    const provider = PROVIDERS[providerHint] ? providerHint : null
    return { provider, model: modelName, isAuto: false }
  }

  // Look up from MODEL_TO_PROVIDER map
  const matched = matchModel(modelInput)
  const provider = matched ? MODEL_TO_PROVIDER[matched] : 'openai'  // default to openai
  return { provider, model: matched || modelInput, isAuto: false }
}

/**
 * Pick the best auto-route model. Uses the cost optimizer.
 */
const autoRoute = (org, promptText) => {
  // Start from the most expensive model as baseline (gpt-4o)
  const baseModel = 'gpt-4o'
  const baseProvider = 'openai'
  const result = optimizeRequest(org, baseModel, baseProvider, promptText)

  if (result.wasOptimized) {
    return {
      provider: result.optimizedProvider,
      model: result.optimizedModel,
      optimizerResult: result
    }
  }

  // No optimization possible — use the best available model the org has keys for
  const preferredOrder = ['openai', 'anthropic', 'groq', 'gemini']
  const defaultModels = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-haiku-4-5',
    groq: 'llama-3.3-70b-versatile',
    gemini: 'gemini-2.0-flash'
  }

  for (const p of preferredOrder) {
    if (org.demoMode || org.providerKeys?.[p]) {
      return {
        provider: p,
        model: defaultModels[p],
        optimizerResult: { ...result, optimizedModel: defaultModels[p], optimizedProvider: p }
      }
    }
  }

  return { provider: 'openai', model: 'gpt-4o-mini', optimizerResult: result }
}

const resolveProviderKey = (req, org, provider) => {
  const providerConfig = PROVIDERS[provider]
  if (!providerConfig) return null

  // Check if user sent a provider key in headers
  let key = req.headers['authorization'] || req.headers['x-api-key']
  // Don't use the Zyra API key as the provider key
  if (key && key.includes('zyra')) key = null

  if (key && provider === 'gemini') {
    // A caller-supplied Authorization/x-api-key header is an OpenAI/Anthropic key,
    // not a Google key — never forward it to Gemini.
    key = req.headers['x-goog-api-key'] || null
  }

  if (!key) {
    const encryptedKey = org.providerKeys?.[provider]
    if (encryptedKey) {
      const decrypted = decrypt(encryptedKey)
      if (provider === 'gemini') {
        key = decrypted.replace(/^Bearer\s+/i, '')
      } else {
        key = providerConfig.authHeader === 'Authorization' && !decrypted.startsWith('Bearer ')
          ? `Bearer ${decrypted}`
          : decrypted
      }
    }
  }

  return key
}

const extractPrompt = (body) => {
  try {
    const messages = body.messages || []
    return messages
      .map(m => `[${m.role}]: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
      .join('\n')
  } catch (e) {
    return ''
  }
}

const extractResponse = (provider, responseBody) => {
  try {
    if (provider === 'anthropic') {
      return responseBody.content?.[0]?.text || ''
    }
    return responseBody.choices?.[0]?.message?.content || ''
  } catch (e) {
    return ''
  }
}

const extractTokens = (provider, responseBody) => {
  try {
    if (provider === 'anthropic') {
      return {
        prompt: responseBody.usage?.input_tokens || 0,
        completion: responseBody.usage?.output_tokens || 0,
        total: (responseBody.usage?.input_tokens || 0) + (responseBody.usage?.output_tokens || 0)
      }
    }
    return {
      prompt: responseBody.usage?.prompt_tokens || 0,
      completion: responseBody.usage?.completion_tokens || 0,
      total: responseBody.usage?.total_tokens || 0
    }
  } catch (e) {
    return { prompt: 0, completion: 0, total: 0 }
  }
}

const buildRequestConfig = (provider, path, providerApiKey, requestBody) => {
  if (provider === 'gemini') {
    return geminiAdapter.buildGeminiRequestConfig(requestBody.model, requestBody, providerApiKey, { stream: false })
  }

  const providerConfig = PROVIDERS[provider]
  const upstreamUrl = `${providerConfig.baseUrl}${path}`

  return {
    method: 'POST',
    url: upstreamUrl,
    headers: {
      'Content-Type': 'application/json',
      [providerConfig.authHeader]: providerApiKey,
      ...(provider === 'anthropic' && { 'anthropic-version': '2023-06-01' })
    },
    data: requestBody,
    timeout: 60000
  }
}

const findCompatibleModel = (originalModel, targetProvider) => {
  const providerModels = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-sonnet-4-6',
    gemini: 'gemini-2.0-flash',
    groq: 'llama-3.3-70b-versatile'
  }
  return providerModels[targetProvider] || null
}

const buildFallbacks = (org, path, requestBody, req, currentProvider, model) => {
  const fallbackOrder = org.reliability?.fallbackOrder || []
  const fallbacks = []

  for (const fbProvider of fallbackOrder) {
    if (fbProvider === currentProvider) continue
    const fbKey = resolveProviderKey(req, org, fbProvider)
    if (!fbKey) continue
    const fbModel = findCompatibleModel(model, fbProvider)
    if (!fbModel) continue

    const fbBody = { ...requestBody, model: fbModel }
    const fbConfig = buildRequestConfig(fbProvider, PROVIDERS[fbProvider].chatPath, fbKey, fbBody)

    fallbacks.push({ requestConfig: fbConfig, provider: fbProvider, model: fbModel })
  }

  return fallbacks
}

// ──────────────────────────────────────────────────────────────
// STREAMING HANDLER
// ──────────────────────────────────────────────────────────────

/**
 * Pipe an SSE stream from the upstream provider to the client.
 * Captures usage data from the final chunks for logging.
 */
const handleStreaming = (provider, path, providerApiKey, requestBody, req, res) => {
  return new Promise((resolve, reject) => {
    const providerConfig = PROVIDERS[provider]
    const url = new URL(`${providerConfig.baseUrl}${path}`)
    const isHttps = url.protocol === 'https:'
    const lib = isHttps ? https : http

    const payload = JSON.stringify(requestBody)

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        [providerConfig.authHeader]: providerApiKey,
        ...(provider === 'anthropic' && { 'anthropic-version': '2023-06-01' })
      }
    }

    const upstream = lib.request(options, (upstreamRes) => {
      if (upstreamRes.statusCode !== 200) {
        let errorBody = ''
        upstreamRes.on('data', (chunk) => { errorBody += chunk.toString() })
        upstreamRes.on('end', () => {
          try {
            res.status(upstreamRes.statusCode).json(JSON.parse(errorBody))
          } catch {
            res.status(upstreamRes.statusCode).json({ error: errorBody })
          }
          resolve({ error: true, statusCode: upstreamRes.statusCode })
        })
        return
      }

      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked'
      })

      let fullContent = ''
      let usage = { prompt: 0, completion: 0, total: 0 }
      let lastModel = requestBody.model

      upstreamRes.on('data', (chunk) => {
        const text = chunk.toString()
        res.write(text)

        // Try to parse SSE data lines for usage info
        const lines = text.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            fullContent += delta
            if (parsed.usage) {
              usage = {
                prompt: parsed.usage.prompt_tokens || 0,
                completion: parsed.usage.completion_tokens || 0,
                total: parsed.usage.total_tokens || 0
              }
            }
            if (parsed.model) lastModel = parsed.model
          } catch {
            // Not JSON — skip
          }
        }
      })

      upstreamRes.on('end', () => {
        res.end()
        resolve({
          error: false,
          statusCode: 200,
          content: fullContent,
          usage,
          model: lastModel
        })
      })

      upstreamRes.on('error', (err) => {
        res.end()
        reject(err)
      })
    })

    upstream.on('error', (err) => {
      reject(err)
    })

    upstream.write(payload)
    upstream.end()

    // Handle client disconnect
    req.on('close', () => {
      upstream.destroy()
    })
  })
}

/**
 * Stream a Gemini response as OpenAI-compatible SSE.
 *
 * Gemini's SSE framing differs from OpenAI's, so for the MVP we make one
 * buffered `generateContent` call and re-emit it as a single content chunk
 * followed by `[DONE]`. The client sees a valid OpenAI stream; only the
 * token-by-token cadence is lost.
 */
const handleGeminiStreaming = async (model, requestBody, providerApiKey, res) => {
  const config = geminiAdapter.buildGeminiRequestConfig(model, requestBody, providerApiKey, { stream: false })
  try {
    const result = await axios(config)
    const normalized = geminiAdapter.toOpenAIResponse(result.data, model)
    const content = normalized.choices?.[0]?.message?.content || ''
    const id = normalized.id

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })
    const base = { id, object: 'chat.completion.chunk', created: normalized.created, model }
    res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }] })}\n\n`)
    res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: normalized.usage })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()

    return {
      error: false,
      statusCode: 200,
      content,
      usage: {
        prompt: normalized.usage.prompt_tokens,
        completion: normalized.usage.completion_tokens,
        total: normalized.usage.total_tokens
      },
      model
    }
  } catch (err) {
    const status = err.response?.status || 502
    if (!res.headersSent) {
      res.status(status).json(err.response?.data || { error: { message: 'Gemini stream failed', type: 'provider_error' } })
    }
    return { error: true, statusCode: status }
  }
}

/**
 * Emit a simulated OpenAI-compatible SSE stream (demo mode). One content chunk
 * then [DONE]; usage attached to the final chunk.
 */
const emitSimulatedStream = (model, requestBody, promptText, res) => {
  const sim = simulator.generate({ ...requestBody, model }, promptText)
  const content = sim.data.choices[0].message.content
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })
  const base = { id: sim.data.id, object: 'chat.completion.chunk', created: sim.data.created, model }
  res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }] })}\n\n`)
  res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: sim.data.usage })}\n\n`)
  res.write('data: [DONE]\n\n')
  res.end()
  return {
    error: false,
    statusCode: 200,
    content,
    usage: {
      prompt: sim.data.usage.prompt_tokens,
      completion: sim.data.usage.completion_tokens,
      total: sim.data.usage.total_tokens,
    },
    model,
  }
}

// ──────────────────────────────────────────────────────────────
// MAIN UNIFIED PROXY HANDLER
// ──────────────────────────────────────────────────────────────

/**
 * POST /v1/chat/completions
 * POST /v1/completions
 * POST /v1/embeddings
 *
 * Pipeline:
 *   1. Parse model → resolve provider
 *   2. Auth + rate check
 *   3. Firewall (injection detection)
 *   4. Cache check (exact match)
 *   5. Cost optimizer (if auto or optimizer enabled)
 *   6. Execute (stream or buffered)
 *   7. Quality guard (if optimized)
 *   8. Cache store
 *   9. Async log
 *  10. Debug headers
 */
exports.chatCompletions = async (req, res) => {
  const start = Date.now()
  const org = req.org
  const isDebug = req.headers['x-zyra-debug'] === 'true'
  const isStream = req.body.stream === true
  const debugInfo = {}

  // ── Step 1: Fast limit pre-check (authoritative atomic reservation happens
  //            just before the provider call, in reserveMonthlyLog) ──
  if (org.currentMonthlyLogs >= org.monthlyLogLimit) {
    return res.status(429).json({ error: { message: 'Monthly request limit reached. Please upgrade your plan.', type: 'rate_limit_error' } })
  }

  // ── Step 2: Resolve model + provider ──
  const requestBody = { ...req.body }
  const modelInput = requestBody.model || 'auto'
  const resolved = resolveModel(modelInput)
  const promptText = extractPrompt(requestBody)
  const estimatedTokens = estimateTokenCount(promptText)

  let provider, model
  let optimizerResult = {
    wasOptimized: false,
    originalModel: modelInput,
    originalProvider: null,
    optimizedModel: modelInput,
    optimizedProvider: null,
    originalCost: 0, optimizedCost: 0, savings: 0,
    complexity: 'standard', tier: 'standard'
  }

  // ── Handle constraints from SDK headers ──
  const constraintMaxCost = parseFloat(req.headers['x-zyra-max-cost']) || null
  const constraintProviders = req.headers['x-zyra-providers']
    ? req.headers['x-zyra-providers'].split(',').map(p => p.trim())
    : null
  const routingMode = req.headers['x-zyra-mode'] || 'auto'

  if (resolved.isAuto) {
    // model: "auto" → full optimizer picks the best
    const autoResult = autoRoute(org, promptText)
    provider = autoResult.provider
    model = autoResult.model
    optimizerResult = autoResult.optimizerResult
    optimizerResult.wasOptimized = true
    optimizerResult.originalModel = 'auto'
    optimizerResult.originalProvider = 'auto'
  } else {
    provider = resolved.provider
    model = resolved.model

    // Run cost optimizer if enabled and mode isn't 'strict'
    if (org.optimizer?.autoOptimize && routingMode !== 'strict') {
      optimizerResult = optimizeRequest(org, model, provider, promptText)
      if (optimizerResult.wasOptimized) {
        provider = optimizerResult.optimizedProvider
        model = optimizerResult.optimizedModel
      }
    }
  }

  // Apply constraint filters
  if (constraintProviders && !constraintProviders.includes(provider)) {
    // Current pick isn't in the allowed list — try to find one that is
    for (const cp of constraintProviders) {
      if (org.providerKeys?.[cp]) {
        provider = cp
        model = findCompatibleModel(model, cp) || model
        break
      }
    }
  }

  if (constraintMaxCost) {
    const estCost = estimateCost(model, estimatedTokens)
    if (estCost > constraintMaxCost) {
      // Try to find a cheaper model
      const cheaper = autoRoute(org, promptText)
      const cheaperEst = estimateCost(cheaper.model, estimatedTokens)
      if (cheaperEst <= constraintMaxCost) {
        provider = cheaper.provider
        model = cheaper.model
      }
    }
  }

  requestBody.model = model
  debugInfo.resolvedModel = model
  debugInfo.resolvedProvider = provider
  debugInfo.complexity = optimizerResult.complexity

  // ── Step 3: Pre-flight firewall ──
  // Injection / jailbreak / PII checks run BEFORE the request is sent to any
  // provider. When a policy blocks, the provider is never contacted AND a
  // security event is still recorded (statusCode 403) so it appears in the
  // logs + risk dashboard.
  const preflightUserId = req.headers['x-user-id'] || requestBody.user || 'anonymous'

  const recordBlockedEvent = async (blockType, note) => {
    try {
      const logQueue = getLogQueue()
      await logQueue.add('log-interaction', {
        orgId: org._id.toString(),
        userId: preflightUserId,
        model, provider: provider || null,
        prompt: promptText,
        response: `[BLOCKED pre-flight: ${blockType}] ${note}`,
        tokens: { prompt: estimatedTokens, completion: 0, total: estimatedTokens },
        cost: 0, latency: Date.now() - start, statusCode: 403,
        cached: false,
        optimizer: { ...optimizerResult, wasOptimized: false },
        reliability: { retryCount: 0, fallbackUsed: false, fallbackProvider: null },
        blocked: true, blockReason: blockType,
      })
    } catch (e) {
      console.error('[UnifiedProxy] blocked-event log failed:', e.message)
    }
  }

  if (promptText && org.policies?.blockInjection) {
    const injectionResult = detectInjection(promptText)
    if (injectionResult.hasInjection) {
      await recordBlockedEvent('injection', `matches: ${injectionResult.matches.join(', ')}`)
      return res.status(403).json({
        error: {
          message: 'Request blocked by Zyra Firewall: prompt injection detected.',
          type: 'firewall_error',
          matches: injectionResult.matches
        }
      })
    }
  }

  if (promptText && org.policies?.blockJailbreak) {
    const jb = detectJailbreak(promptText)
    if (jb.hasJailbreak) {
      await recordBlockedEvent('jailbreak', `patterns: ${jb.matches.join(', ')}`)
      return res.status(403).json({
        error: {
          message: 'Request blocked by Zyra Firewall: jailbreak attempt detected.',
          type: 'firewall_error',
          matches: jb.matches
        }
      })
    }
  }

  // ── Step 3b: PII pre-flight ──
  if (promptText && org.policies?.blockPII) {
    const piiResult = detectPII(promptText)
    if (piiResult.hasPII) {
      await recordBlockedEvent('pii', `types: ${piiResult.types.join(', ')}`)
      return res.status(403).json({
        error: {
          message: 'Request blocked by Zyra: PII detected in prompt. The request was not sent to any provider.',
          type: 'pii_error',
          // Report the categories found, never the matched values themselves.
          pii_types: piiResult.types
        }
      })
    }
  }

  const maxTokens = org.policies?.maxTokensPerRequest || 4096
  if (!requestBody.max_tokens || requestBody.max_tokens > maxTokens) {
    requestBody.max_tokens = maxTokens
  }

  // ── Step 3c: Idempotency ──
  // For non-stream requests carrying an Idempotency-Key, replay a stored result
  // instead of calling the provider again.
  const idemKey = !isStream
    ? (req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || null)
    : null
  let idemHandle = { mode: 'disabled' }
  if (idemKey) {
    idemHandle = await idempotency.begin(org._id.toString(), idemKey, req.body)
    if (idemHandle.mode === 'replay') {
      if (isDebug) res.set('x-zyra-idempotent-replay', 'true')
      return res.status(idemHandle.status).json(idemHandle.body)
    }
    if (idemHandle.mode === 'mismatch') {
      return res.status(422).json({ error: { message: 'Idempotency-Key already used with a different request body.', type: 'idempotency_error' } })
    }
    if (idemHandle.mode === 'conflict') {
      return res.status(409).json({ error: { message: 'A request with this Idempotency-Key is still being processed.', type: 'idempotency_error' } })
    }
  }
  const finalizeIdem = async (status, body) => {
    if (idemHandle.mode === 'proceed') await idemHandle.finalize(status, body)
  }
  const releaseIdem = async () => {
    if (idemHandle.mode === 'proceed' && idemHandle.release) await idemHandle.release()
  }

  // ── Step 4: Cache check ──
  let cacheHit = false
  const cacheEnabled = org.cache?.enabled !== false
  const cacheTTL = org.cache?.ttlSeconds || 300

  if (cacheEnabled && !isStream) {
    const cacheKey = buildCacheKey(org._id.toString(), model, requestBody.messages, {
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens
    })

    const cached = await getFromCache(cacheKey)
    if (cached) {
      cacheHit = true
      debugInfo.cached = true

      if (isDebug) {
        res.set('x-zyra-model', model)
        res.set('x-zyra-provider', provider)
        res.set('x-zyra-cached', 'true')
        res.set('x-zyra-complexity', optimizerResult.complexity)
      }

      res.json(cached)
      await finalizeIdem(200, cached)

      // Async log cache hit
      try {
        const tokens = extractTokens(provider, cached)
        const cost = 0 // Cache hits are free
        const logQueue = getLogQueue()
        await logQueue.add('log-interaction', {
          orgId: org._id.toString(),
          userId: req.headers['x-user-id'] || 'anonymous',
          model, provider,
          prompt: promptText,
          response: extractResponse(provider, cached),
          tokens, cost, latency: Date.now() - start,
          statusCode: 200,
          optimizer: { ...optimizerResult, wasOptimized: false },
          reliability: { retryCount: 0, fallbackUsed: false, fallbackProvider: null },
          cached: true
        })
      } catch {}
      return
    }
  }

  // ── Step 5: Resolve API key ──
  // Demo mode serves every call from the built-in simulator, so no provider key
  // is required — but routing, cost, risk and logging still run for real.
  const demoMode = org.demoMode === true
  let providerApiKey = demoMode ? 'demo-simulator' : resolveProviderKey(req, org, provider)
  if (!providerApiKey) {
    await releaseIdem()
    return res.status(400).json({
      error: {
        message: `No API key configured for provider "${provider}". Add it in Organization Settings.`,
        type: 'configuration_error'
      }
    })
  }

  const chatPath = PROVIDERS[provider]?.chatPath || '/v1/chat/completions'
  const userId = req.headers['x-user-id'] || requestBody.user || 'anonymous'

  // ── Step 5b: Atomically reserve one unit of monthly usage ──
  // This is the authoritative limit check — two concurrent requests cannot both
  // cross the boundary because the guard and the increment are one operation.
  const reservation = await reserveMonthlyLog(org._id.toString())
  if (!reservation.ok) {
    await releaseIdem()
    return res.status(429).json({ error: { message: 'Monthly request limit reached. Please upgrade your plan.', type: 'rate_limit_error' } })
  }

  // ── Step 6: Execute ──
  if (isStream) {
    // ── STREAMING PATH ──
    if (isDebug) {
      // Can't set headers after streaming starts, so set them before
      res.set('x-zyra-model', model)
      res.set('x-zyra-provider', provider)
      res.set('x-zyra-complexity', optimizerResult.complexity)
      res.set('x-zyra-cached', 'false')
    }

    try {
      // Add stream_options for OpenAI/Groq to get usage in stream
      if (provider === 'openai' || provider === 'groq') {
        requestBody.stream_options = { include_usage: true }
      }

      let streamResult
      if (demoMode) {
        streamResult = emitSimulatedStream(model, requestBody, promptText, res)
      } else if (provider === 'gemini') {
        streamResult = await handleGeminiStreaming(model, requestBody, providerApiKey, res)
      } else {
        streamResult = await handleStreaming(provider, chatPath, providerApiKey, requestBody, req, res)
      }

      if (streamResult.error) {
        await releaseMonthlyLog(org._id.toString())
      }

      if (!streamResult.error) {
        // Async log
        const tokens = streamResult.usage
        const cost = calculateCost(model, tokens.prompt, tokens.completion)
        const actualSavings = optimizerResult.wasOptimized
          ? calculateActualSavings(optimizerResult.originalModel, model, tokens.prompt, tokens.completion)
          : 0
        const originalCost = optimizerResult.wasOptimized
          ? calculateCost(optimizerResult.originalModel, tokens.prompt, tokens.completion)
          : cost

        try {
          const logQueue = getLogQueue()
          await logQueue.add('log-interaction', {
            orgId: org._id.toString(), userId, model, provider,
            prompt: promptText, response: streamResult.content,
            tokens, cost, latency: Date.now() - start, statusCode: 200,
            cached: false, simulated: demoMode,
            optimizer: {
              originalModel: optimizerResult.originalModel,
              optimizedModel: optimizerResult.wasOptimized ? model : null,
              originalCost, savings: actualSavings,
              wasOptimized: optimizerResult.wasOptimized,
              complexity: optimizerResult.complexity,
              qualityRetried: false, qualityFailReason: null
            },
            reliability: { retryCount: 0, fallbackUsed: false, fallbackProvider: null }
          })
        } catch {}
      }
    } catch (err) {
      console.error('[UnifiedProxy] Stream error:', err.message)
      await releaseMonthlyLog(org._id.toString())
      if (!res.headersSent) {
        res.status(502).json({ error: { message: 'Failed to stream from provider', type: 'provider_error' } })
      }
    }
    return
  }

  // ── BUFFERED PATH ──
  const primaryConfig = buildRequestConfig(provider, chatPath, providerApiKey, requestBody)
  const fallbacks = buildFallbacks(org, chatPath, requestBody, req, provider, model)

  let responseBody, statusCode, retryCount = 0
  let fallbackUsed = false, fallbackProvider = null
  let finalModel = model, finalProvider = provider
  let qualityRetried = false, qualityFailReason = null
  const enableRetry = org.reliability?.enableRetry !== false
  const maxRetries = enableRetry ? (org.reliability?.maxRetries ?? 2) : 0

  try {
    if (demoMode) {
      const sim = simulator.generate(requestBody, promptText)
      statusCode = sim.status
      responseBody = sim.data
      finalModel = model
      finalProvider = provider
    } else {
    const result = await executeWithRetry(primaryConfig, {
      maxRetries, baseDelay: 500, fallbacks,
      provider, model
    })
    statusCode = result.response.status
    responseBody = result.response.data
    retryCount = result.retryCount
    fallbackUsed = result.fallbackUsed
    fallbackProvider = result.fallbackProvider
    finalModel = result.model
    finalProvider = result.provider
    }

    // Normalize Gemini's native response into OpenAI shape so the rest of the
    // pipeline (quality guard, cache, logging, client) sees one format.
    // (Skipped in demo mode — the simulator already returns OpenAI shape.)
    if (!demoMode && finalProvider === 'gemini' && statusCode >= 200 && statusCode < 400) {
      responseBody = geminiAdapter.toOpenAIResponse(responseBody, finalModel)
    }
  } catch (err) {
    console.error('[UnifiedProxy] All attempts failed:', err.message)
    statusCode = err.response?.status || 502
    responseBody = err.response?.data || { error: { message: 'Failed to reach upstream provider', type: 'provider_error' } }
    // Provider never produced a usable response — refund the reserved usage unit
    // and drop the idempotency lock so a genuine retry can proceed.
    await releaseMonthlyLog(org._id.toString())
    await releaseIdem()
    return res.status(statusCode).json(responseBody)
  }

  // ── Step 7: Quality Guard ──
  if (optimizerResult.wasOptimized && statusCode >= 200 && statusCode < 400) {
    const responseText = extractResponse(finalProvider, responseBody)
    const quality = validateResponse(responseText, promptText, estimatedTokens)

    if (!quality.passed) {
      qualityFailReason = quality.reason
      console.warn(`[QualityGuard] Failed (${quality.reason}). Retrying with higher tier...`)

      const upgrade = getQualityFallbackModel(finalModel, org)
      if (upgrade && demoMode) {
        const sim = simulator.generate({ ...requestBody, model: upgrade.model }, promptText)
        responseBody = sim.data
        statusCode = sim.status
        finalModel = upgrade.model
        finalProvider = upgrade.provider
        qualityRetried = true
      } else if (upgrade) {
        try {
          const upgradeKey = resolveProviderKey(req, org, upgrade.provider)
          if (upgradeKey) {
            const upgradeBody = { ...requestBody, model: upgrade.model }
            const upgradeConfig = buildRequestConfig(upgrade.provider, PROVIDERS[upgrade.provider].chatPath, upgradeKey, upgradeBody)
            const upgradeResult = await axios(upgradeConfig)
            responseBody = upgrade.provider === 'gemini'
              ? geminiAdapter.toOpenAIResponse(upgradeResult.data, upgrade.model)
              : upgradeResult.data
            statusCode = upgradeResult.status
            finalModel = upgrade.model
            finalProvider = upgrade.provider
            qualityRetried = true
          }
        } catch (upgradeErr) {
          console.warn(`[QualityGuard] Upgrade retry failed, using original response`)
        }
      }
    }
  }

  // ── Step 8: Debug headers ──
  if (isDebug) {
    const tokens = extractTokens(finalProvider, responseBody)
    const cost = calculateCost(finalModel, tokens.prompt, tokens.completion)
    const savings = optimizerResult.wasOptimized
      ? calculateActualSavings(optimizerResult.originalModel, finalModel, tokens.prompt, tokens.completion)
      : 0

    res.set('x-zyra-model', finalModel)
    res.set('x-zyra-provider', finalProvider)
    res.set('x-zyra-cost', cost.toFixed(6))
    res.set('x-zyra-savings', savings.toFixed(6))
    res.set('x-zyra-complexity', optimizerResult.complexity)
    res.set('x-zyra-cached', 'false')
    if (fallbackUsed) res.set('x-zyra-fallback', fallbackProvider)
    if (qualityRetried) res.set('x-zyra-quality-retry', 'true')
    if (demoMode) res.set('x-zyra-simulated', 'true')
  }

  // ── Send response ──
  res.status(statusCode).json(responseBody)

  // Store the result for idempotent replay. If the provider returned an error
  // status, drop the lock instead so a retry with the same key can try again.
  if (statusCode >= 200 && statusCode < 400) {
    await finalizeIdem(statusCode, responseBody)
  } else {
    await releaseMonthlyLog(org._id.toString())
    await releaseIdem()
  }

  // ── Step 9: Cache store ──
  // Must hash the same values the Step 4 lookup used (post max_tokens-clamp
  // `requestBody`, not the raw `req.body`) or the write key never matches the
  // read key and the cache silently never hits.
  if (cacheEnabled && statusCode >= 200 && statusCode < 400) {
    const cacheKey = buildCacheKey(org._id.toString(), finalModel, requestBody.messages, {
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens
    })
    setInCache(cacheKey, responseBody, cacheTTL).catch(() => {})
  }

  // ── Step 10: Async logging ──
  try {
    const latency = Date.now() - start
    const tokens = extractTokens(finalProvider, responseBody)
    const cost = calculateCost(finalModel, tokens.prompt, tokens.completion)
    const actualSavings = optimizerResult.wasOptimized
      ? calculateActualSavings(optimizerResult.originalModel, finalModel, tokens.prompt, tokens.completion)
      : 0
    const originalCost = optimizerResult.wasOptimized
      ? calculateCost(optimizerResult.originalModel, tokens.prompt, tokens.completion)
      : cost

    const logQueue = getLogQueue()
    await logQueue.add('log-interaction', {
      orgId: org._id.toString(), userId,
      model: finalModel, provider: finalProvider,
      prompt: promptText,
      response: extractResponse(finalProvider, responseBody),
      tokens, cost, latency, statusCode,
      cached: false,
      simulated: demoMode,
      optimizer: {
        originalModel: optimizerResult.originalModel,
        optimizedModel: optimizerResult.wasOptimized ? finalModel : null,
        originalCost, savings: actualSavings,
        wasOptimized: optimizerResult.wasOptimized,
        complexity: optimizerResult.complexity,
        qualityRetried, qualityFailReason
      },
      reliability: { retryCount, fallbackUsed, fallbackProvider }
    })
  } catch (err) {
    console.error('[UnifiedProxy] Logging error:', err.message)
  }
}

/**
 * POST /v1/completions — Legacy completions endpoint
 * Same logic but maps to the completions path
 */
exports.completions = async (req, res) => {
  // Rewrite to chat format internally
  const prompt = req.body.prompt || ''
  req.body.messages = [{ role: 'user', content: prompt }]
  delete req.body.prompt
  return exports.chatCompletions(req, res)
}

/**
 * POST /v1/embeddings — Embeddings passthrough
 */
exports.embeddings = async (req, res) => {
  const org = req.org
  const model = req.body.model || 'text-embedding-3-small'
  const provider = getModelProvider(model) || 'openai'

  const providerApiKey = resolveProviderKey(req, org, provider)
  if (!providerApiKey) {
    return res.status(400).json({
      error: { message: `No API key for provider "${provider}".`, type: 'configuration_error' }
    })
  }

  const embeddingsPath = PROVIDERS[provider]?.embeddingsPath || '/v1/embeddings'

  try {
    const config = buildRequestConfig(provider, embeddingsPath, providerApiKey, req.body)
    const result = await axios(config)
    res.status(result.status).json(result.data)
  } catch (err) {
    const status = err.response?.status || 502
    res.status(status).json(err.response?.data || { error: { message: 'Embeddings request failed' } })
  }
}

/**
 * POST /v1/messages — Anthropic-native format passthrough
 *
 * Allows users to point their Anthropic client at Zyra:
 *   import anthropic
 *   client = anthropic.Anthropic(base_url="https://api.zyra.dev/v1", api_key=ZYRA_KEY)
 *   client.messages.create(model="claude-sonnet-4-5", ...)
 *
 * Zyra forwards to Anthropic, logs the interaction, and returns the response
 * in the original Anthropic format. No response format conversion needed.
 */
exports.anthropicMessages = async (req, res) => {
  const start = Date.now()
  const org = req.org

  if (org.currentMonthlyLogs >= org.monthlyLogLimit) {
    return res.status(429).json({ error: { message: 'Monthly request limit reached. Please upgrade your plan.' } })
  }

  const provider = 'anthropic'
  const model = req.body.model || 'claude-sonnet-4-5'
  const userId = req.headers['x-user-id'] || 'anonymous'

  // Resolve provider key (user passes ZYRA_KEY to auth, but may pass their anthropic key as x-anthropic-api-key)
  let providerApiKey = req.headers['x-anthropic-api-key'] || null
  if (!providerApiKey) {
    const encryptedKey = org.providerKeys?.anthropic
    if (encryptedKey) {
      const { decrypt } = require('../utils/crypto')
      providerApiKey = decrypt(encryptedKey)
    }
  }

  if (!providerApiKey) {
    return res.status(400).json({
      error: {
        message: 'No Anthropic API key found. Add your Anthropic key in Organization Settings or pass x-anthropic-api-key header.',
        type: 'configuration_error'
      }
    })
  }

  const isStream = req.body.stream === true

  try {
    let responseBody, statusCode

    if (isStream) {
      const streamResult = await handleStreaming(
        provider,
        PROVIDERS.anthropic.chatPath,
        providerApiKey,
        req.body,
        req,
        res
      )

      // Async log for stream
      if (!streamResult.error) {
        const tokens = streamResult.usage
        const cost = calculateCost(model, tokens.prompt, tokens.completion)
        try {
          const logQueue = getLogQueue()
          await logQueue.add('log-interaction', {
            orgId: org._id.toString(), userId, model, provider,
            prompt: extractPrompt({ messages: req.body.messages }),
            response: streamResult.content,
            tokens, cost, latency: Date.now() - start, statusCode: 200,
            cached: false, sdk_language: 'proxy',
            optimizer: { wasOptimized: false }, reliability: { retryCount: 0, fallbackUsed: false }
          })
        } catch {}
      }
      return
    }

    // Buffered request
    const config = {
      method: 'POST',
      url: `${PROVIDERS.anthropic.baseUrl}${PROVIDERS.anthropic.chatPath}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': providerApiKey,
        'anthropic-version': '2023-06-01'
      },
      data: req.body,
      timeout: 60000
    }

    const result = await executeWithRetry(config, { maxRetries: 2, baseDelay: 500, fallbacks: [], provider, model })
    statusCode = result.response.status
    responseBody = result.response.data

    res.status(statusCode).json(responseBody)

    // Async log
    const latency = Date.now() - start
    const tokens = extractTokens(provider, responseBody)
    const cost = calculateCost(model, tokens.prompt, tokens.completion)
    try {
      const logQueue = getLogQueue()
      await logQueue.add('log-interaction', {
        orgId: org._id.toString(), userId, model, provider,
        prompt: extractPrompt({ messages: req.body.messages }),
        response: extractResponse(provider, responseBody),
        tokens, cost, latency, statusCode,
        cached: false, sdk_language: 'proxy',
        optimizer: { wasOptimized: false, originalModel: model, optimizedModel: null, savings: 0 },
        reliability: { retryCount: result.retryCount || 0, fallbackUsed: false, fallbackProvider: null }
      })
    } catch {}

  } catch (err) {
    const status = err.response?.status || 502
    const body = err.response?.data || { error: { message: 'Failed to reach Anthropic', type: 'provider_error' } }
    if (!res.headersSent) res.status(status).json(body)
  }
}
