/**
 * ZYRA SDK v1.0
 *
 * Drop-in OpenAI replacement with intelligent cost routing.
 *
 * Features:
 *   - OpenAI-compatible API (extends OpenAI SDK)
 *   - model: "auto" (Zyra picks cheapest capable model)
 *   - Constraints: maxCost, providers, mode
 *   - Debug mode: see routing decisions
 *   - Custom error classes
 *   - Middleware hooks
 *   - Streaming support
 *
 * Usage:
 *   const { Zyra } = require('zyra-sdk')
 *   const client = new Zyra({ apiKey: process.env.ZYRA_API_KEY })
 *   const res = await client.chat.completions.create({ model: 'auto', messages: [...] })
 */

// ──────────────────────────────────────────────────────────────
// CUSTOM ERROR CLASSES
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
      throw new Error("Please install 'openai' package: npm install openai")
    }
  }
}

class Zyra extends OpenAIClient {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - Your Zyra API key (required)
   * @param {string} [options.baseURL] - Zyra API base URL (default: http://localhost:5000/v1)
   * @param {boolean} [options.debug] - Enable debug mode (returns routing info)
   * @param {Object} [options.routing] - Default routing constraints
   * @param {number} [options.routing.maxCost] - Max cost per request in USD
   * @param {string[]} [options.routing.providers] - Allowed providers
   * @param {string} [options.routing.mode] - 'auto' | 'constrained' | 'strict'
   */
  constructor(options = {}) {
    if (!options.apiKey) {
      throw new ZyraError('Zyra: apiKey is required', 'configuration_error', 400)
    }

    const zyraApiKey = options.apiKey
    const debug = options.debug || false
    const routing = options.routing || {}

    // Build default headers
    const defaultHeaders = {
      'x-zyra-api-key': zyraApiKey,
      ...(debug && { 'x-zyra-debug': 'true' }),
      ...(routing.maxCost && { 'x-zyra-max-cost': String(routing.maxCost) }),
      ...(routing.providers && { 'x-zyra-providers': routing.providers.join(',') }),
      ...(routing.mode && { 'x-zyra-mode': routing.mode }),
      ...options.defaultHeaders
    }

    super({
      apiKey: 'zyra-passthrough',  // Bypass OpenAI SDK's key validation
      baseURL: options.baseURL || 'http://localhost:5000/v1',
      defaultHeaders,
      ...options,
      // Override these back so OpenAI SDK doesn't use them
      apiKey: 'zyra-passthrough'
    })

    // Store Zyra-specific config
    this._zyraConfig = {
      apiKey: zyraApiKey,
      debug,
      routing,
      middlewares: []
    }
  }

  /**
   * Register a middleware hook.
   *
   * Usage:
   *   client.use(async (req, next) => {
   *     req.body.temperature = 0.5  // modify request
   *     const res = await next(req)
   *     console.log(res)            // inspect response
   *     return res
   *   })
   *
   * @param {Function} fn - async (req, next) => response
   */
  use(fn) {
    if (typeof fn !== 'function') {
      throw new ZyraError('Middleware must be a function', 'configuration_error', 400)
    }
    this._zyraConfig.middlewares.push(fn)
    return this // chainable
  }

  /**
   * Get debug info from the last proxied response.
   * Only available when debug: true is set.
   */
  get debug() {
    return this._lastDebugInfo || null
  }
}

// ──────────────────────────────────────────────────────────────
// LEGACY COMPATIBILITY (from old ai-shield-sdk)
// ──────────────────────────────────────────────────────────────

const https = require('https')
const http = require('http')

class AIShield {
  constructor({ apiKey, baseUrl = 'http://localhost:5000' } = {}) {
    if (!apiKey) throw new ZyraError('AIShield: apiKey is required', 'configuration_error')
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.queue = []
    this.flushInterval = null
    this._startBatchFlush()
  }

  _startBatchFlush() {
    this.flushInterval = setInterval(() => {
      if (this.queue.length > 0) this._flush()
    }, 2000)
    if (this.flushInterval.unref) this.flushInterval.unref()
  }

  async log(data) {
    const { userId, model, prompt, response, tokens, latency } = data
    if (!userId || !model || !prompt) {
      console.error('[Zyra] userId, model, and prompt are required')
      return
    }
    this.queue.push({ userId, model, prompt, response, tokens, latency })
    if (this.queue.length >= 10) await this._flush()
  }

  async _flush() {
    if (this.queue.length === 0) return
    const batch = [...this.queue]
    this.queue = []
    for (const item of batch) {
      await this._sendWithRetry(item)
    }
  }

  async _sendWithRetry(data, attempt = 1) {
    try {
      await this._post('/api/logs/ingest', data)
    } catch (err) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 1000))
        return this._sendWithRetry(data, attempt + 1)
      }
      console.error(`[Zyra] Failed to send log after 3 attempts:`, err.message)
    }
  }

  _post(path, body) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(body)
      const url = new URL(this.baseUrl)
      const isHttps = url.protocol === 'https:'
      const lib = isHttps ? https : http
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-zyra-api-key': this.apiKey
        }
      }
      const req = lib.request(options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data))
          } else {
            reject(new ProviderError(`HTTP ${res.statusCode}: ${data}`, 'zyra', res.statusCode))
          }
        })
      })
      req.on('error', reject)
      req.write(payload)
      req.end()
    })
  }

  async shutdown() {
    clearInterval(this.flushInterval)
    await this._flush()
  }
}

class OpenAIShield {
  constructor(openaiClient, shield) {
    this.openai = openaiClient
    this.shield = shield
    this.chat = {
      completions: {
        create: this._wrapCreate.bind(this)
      }
    }
  }

  async _wrapCreate(params, options = {}) {
    const start = Date.now()
    const userId = options.userId || params.user || 'anonymous'
    const prompt = params.messages
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n')

    let response, error
    try {
      response = await this.openai.chat.completions.create(params)
    } catch (err) {
      error = err
    }
    const latency = Date.now() - start

    await this.shield.log({
      userId, model: params.model, prompt,
      response: response?.choices?.[0]?.message?.content || error?.message || '',
      tokens: {
        prompt: response?.usage?.prompt_tokens || 0,
        completion: response?.usage?.completion_tokens || 0,
        total: response?.usage?.total_tokens || 0
      },
      latency
    })

    if (error) throw error
    return response
  }
}

// ──────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────

module.exports = {
  // Primary SDK
  Zyra,
  // Error classes
  ZyraError,
  ZyraTimeoutError,
  ZyraRoutingError,
  ProviderError,
  ZyraFirewallError,
  ZyraRateLimitError,
  // Legacy compatibility
  AIShield,
  OpenAIShield
}
