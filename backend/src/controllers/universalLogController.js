/**
 * UNIVERSAL LOG CONTROLLER
 *
 * POST /v1/log
 *
 * Accepts the canonical Zyra logging payload from any language SDK.
 * Always returns 202 immediately. Logging is queued asynchronously.
 *
 * Payload:
 *   {
 *     timestamp,       // ISO8601 string
 *     sdk_language,    // 'python' | 'node' | 'go' | 'ruby' | 'java' | 'php' | 'proxy'
 *     provider,        // 'openai' | 'anthropic' | 'groq' | 'gemini' | ...
 *     model_requested, // model the user specified (e.g. 'gpt-4o', 'auto')
 *     model_routed_to, // model actually used (may differ after cost routing)
 *     prompt_tokens,
 *     completion_tokens,
 *     latency_ms,
 *     cost_usd,        // optional — Zyra will recalculate if missing
 *     status,          // 'success' | 'error'
 *     error_message    // null or string
 *   }
 */

const { getLogQueue } = require('../config/queue')
const { calculateCost } = require('../utils/costCalculator')
const Organization = require('../models/Organization')

const VALID_LANGUAGES = new Set(['python', 'node', 'go', 'ruby', 'java', 'php', 'proxy', 'curl', 'other'])
const VALID_STATUSES = new Set(['success', 'error'])

exports.universalLog = async (req, res) => {
  // Always ACK immediately — never block the caller
  res.status(202).json({ accepted: true })

  try {
    const org = req.org
    if (!org) return

    // Silently drop if org is over log limit
    if (org.currentMonthlyLogs >= org.monthlyLogLimit) return

    // Check kill switch
    if (process.env.ZYRA_DISABLE === 'true') return

    const {
      timestamp,
      sdk_language,
      provider,
      model_requested,
      model_routed_to,
      prompt_tokens,
      completion_tokens,
      latency_ms,
      cost_usd,
      status,
      error_message
    } = req.body

    // Basic type coercion and defaults
    const promptTokens = Number(prompt_tokens) || 0
    const completionTokens = Number(completion_tokens) || 0
    const totalTokens = promptTokens + completionTokens
    const latency = Number(latency_ms) || 0
    const finalModel = model_routed_to || model_requested || 'unknown'
    const finalProvider = provider || 'unknown'
    const finalStatus = VALID_STATUSES.has(status) ? status : 'success'
    const finalLanguage = VALID_LANGUAGES.has(sdk_language) ? sdk_language : 'other'

    // Recalculate cost if not provided or zero
    const cost = (cost_usd !== undefined && cost_usd !== null)
      ? Number(cost_usd)
      : calculateCost(finalModel, promptTokens, completionTokens)

    const logQueue = getLogQueue()
    await logQueue.add('log-interaction', {
      orgId: org._id.toString(),
      userId: req.headers['x-user-id'] || 'sdk-anonymous',
      model: finalModel,
      provider: finalProvider,
      prompt: `[SDK log — ${finalLanguage}]`,   // Prompt not captured by external SDKs
      response: error_message || '',
      tokens: { prompt: promptTokens, completion: completionTokens, total: totalTokens },
      cost,
      latency,
      statusCode: finalStatus === 'success' ? 200 : 500,
      cached: false,
      // Universal log fields
      sdk_language: finalLanguage,
      model_requested: model_requested || finalModel,
      optimizer: {
        originalModel: model_requested || null,
        optimizedModel: model_routed_to || null,
        originalCost: 0,
        savings: 0,
        wasOptimized: !!(model_requested && model_routed_to && model_requested !== model_routed_to),
        complexity: null,
        qualityRetried: false,
        qualityFailReason: null
      },
      reliability: { retryCount: 0, fallbackUsed: false, fallbackProvider: null }
    })

    // Increment org log count (best-effort)
    Organization.findByIdAndUpdate(org._id, { $inc: { currentMonthlyLogs: 1 } }).catch(() => {})

  } catch (err) {
    // Silently swallow — never crash the caller
    if (process.env.NODE_ENV !== 'production') {
      console.error('[UniversalLog] Error:', err.message)
    }
  }
}
