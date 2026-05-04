/**
 * ZYRA SHARED LOGGER
 *
 * Fire-and-forget log dispatch to the Zyra /v1/log endpoint.
 * - Non-blocking: uses setImmediate to dispatch after the current tick
 * - Graceful: never throws, never blocks the caller
 * - Respects ZYRA_DISABLE=true environment variable
 *
 * Usage:
 *   const { dispatchLog } = require('./logger')
 *   dispatchLog({ zyraKey, sdkLanguage, provider, modelRequested, ... })
 */

const https = require('https')
const http = require('http')

const ZYRA_LOG_URL = process.env.ZYRA_API_URL || 'https://api.zyra.dev'
const LOG_TIMEOUT_MS = 5000

/**
 * @typedef {Object} ZyraLogPayload
 * @property {string}  zyraKey           - Zyra API key
 * @property {string}  sdkLanguage       - 'node' | 'python' | 'proxy' | ...
 * @property {string}  provider          - 'openai' | 'anthropic' | ...
 * @property {string}  modelRequested    - model the user specified
 * @property {string}  modelRoutedTo     - model actually used
 * @property {number}  promptTokens
 * @property {number}  completionTokens
 * @property {number}  latencyMs
 * @property {number}  [costUsd]
 * @property {'success'|'error'} status
 * @property {string|null} [errorMessage]
 */

/**
 * Send a log entry to Zyra. Fire-and-forget — never awaited, never throws.
 * @param {ZyraLogPayload} payload
 */
function dispatchLog(payload) {
  if (process.env.ZYRA_DISABLE === 'true') return

  setImmediate(() => {
    try {
      _sendLog(payload)
    } catch {
      // Silently swallow — never surface to the user
    }
  })
}

function _sendLog(payload) {
  const body = JSON.stringify({
    timestamp: new Date().toISOString(),
    sdk_language: payload.sdkLanguage || 'node',
    provider: payload.provider || 'unknown',
    model_requested: payload.modelRequested || 'unknown',
    model_routed_to: payload.modelRoutedTo || payload.modelRequested || 'unknown',
    prompt_tokens: payload.promptTokens || 0,
    completion_tokens: payload.completionTokens || 0,
    latency_ms: payload.latencyMs || 0,
    cost_usd: payload.costUsd || null,
    status: payload.status || 'success',
    error_message: payload.errorMessage || null
  })

  const url = new URL(`${ZYRA_LOG_URL}/v1/log`)
  const isHttps = url.protocol === 'https:'
  const lib = isHttps ? https : http

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'x-zyra-api-key': payload.zyraKey || '',
      'User-Agent': `zyra-sdk-node/1.0`
    },
    timeout: LOG_TIMEOUT_MS
  }

  const req = lib.request(options)
  req.on('error', () => {})   // Silently ignore network errors
  req.on('timeout', () => { req.destroy() })
  req.write(body)
  req.end()
}

module.exports = { dispatchLog }
