/**
 * ZYRA SDK
 *
 * Drop-in OpenAI replacement with intelligent cost routing.
 *
 * Usage:
 *   import Zyra from "zyra-sdk"              // default import
 *   const { Zyra } = require("zyra-sdk")    // named import (CJS)
 *
 *   const client = new Zyra({ apiKey: process.env.ZYRA_API_KEY })
 *   const res = await client.chat.completions.create({
 *     model: "auto",                        // Zyra picks the cheapest capable model
 *     messages: [{ role: "user", content: "Hello" }],
 *   })
 */

// ──────────────────────────────────────────────────────────────
// ERROR CLASSES
// ──────────────────────────────────────────────────────────────

class ZyraError extends Error {
  constructor(message, type, status, details) {
    super(message)
    this.name = 'ZyraError'
    this.type = type || 'unknown_error'
    this.status = status || 500
    this.details = details || null
  }
}

class ZyraTimeoutError extends ZyraError {
  constructor(message, details) {
    super(message || 'Request timed out', 'timeout_error', 408, details)
    this.name = 'ZyraTimeoutError'
  }
}

class ZyraRoutingError extends ZyraError {
  constructor(message, details) {
    super(message || 'Failed to route request', 'routing_error', 502, details)
    this.name = 'ZyraRoutingError'
  }
}

class ProviderError extends ZyraError {
  constructor(message, provider, status, details) {
    super(message || `Provider error: ${provider}`, 'provider_error', status || 502, details)
    this.name = 'ProviderError'
    this.provider = provider
  }
}

class ZyraFirewallError extends ZyraError {
  constructor(message, details) {
    super(message || 'Request blocked by Zyra Firewall', 'firewall_error', 403, details)
    this.name = 'ZyraFirewallError'
  }
}

class ZyraRateLimitError extends ZyraError {
  constructor(message, details) {
    super(message || 'Rate limit exceeded', 'rate_limit_error', 429, details)
    this.name = 'ZyraRateLimitError'
  }
}

// ──────────────────────────────────────────────────────────────
// MAIN ZYRA CLIENT
// ──────────────────────────────────────────────────────────────

let OpenAIClient
try {
  const openaiModule = require('openai')
  OpenAIClient = openaiModule.OpenAI || openaiModule.default || openaiModule
} catch (e) {
  OpenAIClient = class {
    constructor() {
      throw new ZyraError("Missing peer dependency 'openai'. Run: npm install openai", 'configuration_error', 500)
    }
  }
}

const DEFAULT_BASE_URL = process.env.ZYRA_BASE_URL || 'http://localhost:5000/v1'

class Zyra extends OpenAIClient {
  /**
   * @param {Object} options
   * @param {string} options.apiKey            Your Zyra API key (required)
   * @param {string} [options.baseURL]         Zyra gateway base URL (default: http://localhost:5000/v1)
   * @param {boolean} [options.debug]          Ask Zyra to return routing info in x-zyra-* headers
   * @param {Object} [options.routing]         Default routing constraints
   * @param {number} [options.routing.maxCost] Max cost per request (USD)
   * @param {string[]} [options.routing.providers] Allowed providers
   * @param {string} [options.routing.mode]    'auto' | 'constrained' | 'strict'
   * @param {Object} [options.defaultHeaders]  Extra headers to send on every request
   */
  constructor(options = {}) {
    if (!options || !options.apiKey) {
      throw new ZyraError('Zyra: apiKey is required', 'configuration_error', 400)
    }

    const { apiKey, baseURL, debug = false, routing = {}, defaultHeaders = {}, ...rest } = options

    const headers = {
      'x-zyra-api-key': apiKey,
      ...(debug ? { 'x-zyra-debug': 'true' } : {}),
      ...(routing.maxCost != null ? { 'x-zyra-max-cost': String(routing.maxCost) } : {}),
      ...(routing.providers ? { 'x-zyra-providers': routing.providers.join(',') } : {}),
      ...(routing.mode ? { 'x-zyra-mode': routing.mode } : {}),
      ...defaultHeaders,
    }

    super({
      // The OpenAI SDK requires a non-empty apiKey; Zyra authenticates via the
      // x-zyra-api-key header instead, so this placeholder is never sent upstream.
      apiKey: 'zyra-passthrough',
      baseURL: baseURL || DEFAULT_BASE_URL,
      defaultHeaders: headers,
      ...rest,
    })

    this._zyra = { apiKey, debug, routing, baseURL: baseURL || DEFAULT_BASE_URL }
  }

  /**
   * Explicitly log an LLM interaction you made yourself (not through the proxy).
   * Fire-and-forget: resolves immediately, never throws.
   *
   *   await zyra.log({
   *     userId: "USR001",
   *     prompt, response,
   *     model: "gpt-4o",
   *     promptTokens, completionTokens,
   *   })
   *
   * @param {Object} entry
   * @param {string} [entry.userId]
   * @param {string} entry.prompt
   * @param {string} entry.response
   * @param {string} entry.model
   * @param {number} [entry.promptTokens]
   * @param {number} [entry.completionTokens]
   * @param {string} [entry.provider]
   * @param {number} [entry.latencyMs]
   * @returns {Promise<void>}
   */
  async log(entry = {}) {
    if (process.env.ZYRA_DISABLE === 'true') return
    const base = this._zyra.baseURL.replace(/\/v1\/?$/, '')
    try {
      await fetch(`${base}/v1/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-zyra-api-key': this._zyra.apiKey },
        body: JSON.stringify({
          userId: entry.userId,
          prompt: entry.prompt,
          response: entry.response,
          model: entry.model,
          promptTokens: entry.promptTokens,
          completionTokens: entry.completionTokens,
          provider: entry.provider,
          latencyMs: entry.latencyMs,
          status: entry.status || 'success',
        }),
      })
    } catch {
      // never surface logging failures to the caller
    }
  }
}

// ──────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────

// Default export is the Zyra class (so `import Zyra from "zyra-sdk"` works),
// with the named exports hung off it (so `const { Zyra, ZyraError } = require(...)`
// and `import { Zyra } from "zyra-sdk"` both work).
module.exports = Zyra
module.exports.Zyra = Zyra
module.exports.default = Zyra
module.exports.ZyraError = ZyraError
module.exports.ZyraTimeoutError = ZyraTimeoutError
module.exports.ZyraRoutingError = ZyraRoutingError
module.exports.ProviderError = ProviderError
module.exports.ZyraFirewallError = ZyraFirewallError
module.exports.ZyraRateLimitError = ZyraRateLimitError
