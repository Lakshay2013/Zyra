/**
 * UNIVERSAL LOG CONTROLLER
 *
 * POST /v1/log
 *
 * Accepts a logging payload from any language SDK. Always returns 202
 * immediately — logging is queued asynchronously and never blocks the caller.
 *
 * Two payload shapes are accepted:
 *
 *  A) Canonical proxy/telemetry payload (auto-patch SDKs, curl, etc.):
 *     { timestamp, sdk_language, provider, model_requested, model_routed_to,
 *       prompt_tokens, completion_tokens, latency_ms, cost_usd, status,
 *       error_message }
 *
 *  B) Explicit SDK .log() payload (paper §SDK Integration):
 *     { userId, prompt, response, model, promptTokens, completionTokens,
 *       provider?, latencyMs? }
 *
 * When `prompt` / `response` are present they are run through the security
 * analyzer (masked before storage, detectors feed the risk score) exactly like
 * a proxied request.  `ZYRA_DISABLE=true` short-circuits everything.
 */

const { getLogQueue } = require('../config/queue')
const { calculateCost, getProvider } = require('../utils/costCalculator')
const { reserveMonthlyLog } = require('../services/usageLimiter')

const VALID_LANGUAGES = new Set(['python', 'node', 'go', 'ruby', 'java', 'php', 'proxy', 'curl', 'other'])
const VALID_STATUSES = new Set(['success', 'error'])

exports.universalLog = async (req, res) => {
  res.status(202).json({ accepted: true })

  try {
    const org = req.org
    if (!org) return
    if (process.env.ZYRA_DISABLE === 'true') return

    const reservation = await reserveMonthlyLog(org._id.toString())
    if (!reservation.ok) return

    const b = req.body || {}

    // ── shape B: explicit .log() ──
    const hasExplicit = b.prompt !== undefined || b.response !== undefined || b.promptTokens !== undefined

    const sdkLanguage = VALID_LANGUAGES.has(b.sdk_language) ? b.sdk_language : (hasExplicit ? 'node' : 'other')
    const modelRequested = b.model || b.model_requested || 'unknown'
    const modelRouted = b.model_routed_to || modelRequested
    const provider = b.provider || getProvider(modelRouted) || 'unknown'

    const promptTokens = Number(b.promptTokens ?? b.prompt_tokens) || 0
    const completionTokens = Number(b.completionTokens ?? b.completion_tokens) || 0
    const totalTokens = promptTokens + completionTokens
    const latency = Number(b.latencyMs ?? b.latency_ms) || 0
    const status = VALID_STATUSES.has(b.status) ? b.status : 'success'

    const cost = (b.cost_usd !== undefined && b.cost_usd !== null)
      ? Number(b.cost_usd)
      : calculateCost(modelRouted, promptTokens, completionTokens)

    const jobData = {
      orgId: org._id.toString(),
      userId: b.userId || req.headers['x-user-id'] || 'sdk-anonymous',
      model: modelRouted,
      provider,
      prompt: hasExplicit ? String(b.prompt || '') : `[SDK telemetry — ${sdkLanguage}]`,
      response: hasExplicit ? String(b.response || '') : (b.error_message || ''),
      tokens: { prompt: promptTokens, completion: completionTokens, total: totalTokens },
      cost,
      latency,
      statusCode: status === 'success' ? 200 : 500,
      cached: false,
      sdk_language: sdkLanguage,
      model_requested: modelRequested,
      optimizer: {
        originalModel: modelRequested,
        optimizedModel: modelRouted !== modelRequested ? modelRouted : null,
        originalCost: 0,
        savings: 0,
        wasOptimized: !!(modelRequested && modelRouted && modelRequested !== modelRouted),
        complexity: null,
        qualityRetried: false,
        qualityFailReason: null,
      },
      reliability: { retryCount: 0, fallbackUsed: false, fallbackProvider: null },
    }

    await getLogQueue().add('log-interaction', jobData)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[UniversalLog] Error:', err.message)
    }
  }
}
