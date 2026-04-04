const https = require('https')
const http = require('http')

class AIShield {
  constructor({ apiKey, baseUrl = 'http://localhost:5000' } = {}) {
    if (!apiKey) throw new Error('AIShield: apiKey is required')
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.queue = []
    this.flushInterval = null
    this._startBatchFlush()
  }

  // Start auto-flush every 2 seconds
  _startBatchFlush() {
    this.flushInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this._flush()
      }
    }, 2000)

    // Don't keep process alive just for this
    if (this.flushInterval.unref) {
      this.flushInterval.unref()
    }
  }

  // Add a log to the queue
  async log(data) {
    const { userId, model, prompt, response, tokens, latency } = data

    if (!userId || !model || !prompt) {
      console.error('[AIShield] userId, model, and prompt are required')
      return
    }

    this.queue.push({ userId, model, prompt, response, tokens, latency })

    // If queue gets large, flush immediately
    if (this.queue.length >= 10) {
      await this._flush()
    }
  }

  // Send all queued logs
  async _flush() {
    if (this.queue.length === 0) return

    const batch = [...this.queue]
    this.queue = []

    for (const item of batch) {
      await this._sendWithRetry(item)
    }
  }

  // Send a single log with retry
  async _sendWithRetry(data, attempt = 1) {
    try {
      await this._post('/api/logs/ingest', data)
    } catch (err) {
      if (attempt < 3) {
        const delay = attempt * 1000
        await new Promise(r => setTimeout(r, delay))
        return this._sendWithRetry(data, attempt + 1)
      } else {
        console.error(`[AIShield] Failed to send log after 3 attempts:`, err.message)
      }
    }
  }

  // HTTP POST helper
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
            reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          }
        })
      })

      req.on('error', reject)
      req.write(payload)
      req.end()
    })
  }

  // Manually flush before process exits
  async shutdown() {
    clearInterval(this.flushInterval)
    await this._flush()
  }
}
class OpenAIShield {
  constructor(openaiClient, shield) {
    this.openai = openaiClient
    this.shield = shield

    // Proxy the chat.completions.create method
    this.chat = {
      completions: {
        create: this._wrapCreate.bind(this)
      }
    }
  }

  async _wrapCreate(params, options = {}) {
    const start = Date.now()
    const userId = options.userId || params.user || 'anonymous'

    // Extract prompt from messages
    const prompt = params.messages
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n')

    let response
    let error

    try {
      response = await this.openai.chat.completions.create(params)
    } catch (err) {
      error = err
    }

    const latency = Date.now() - start

    // Log regardless of success or failure
    await this.shield.log({
      userId,
      model: params.model,
      prompt,
      response: response?.choices?.[0]?.message?.content || error?.message || '',
      tokens: {
        prompt: response?.usage?.prompt_tokens || 0,
        completion: response?.usage?.completion_tokens || 0,
        total: response?.usage?.total_tokens || 0
      },
      latency
    })

    // Re-throw if there was an error
    if (error) throw error

    return response
  }
}

class AIShieldMiddleware {
  constructor(shield) {
    this.shield = shield
  }

  // Drop-in Express middleware
  // Intercepts responses and looks for LLM data attached to res.locals
  middleware() {
    const shield = this.shield

    return function aishieldMiddleware(req, res, next) {
      const start = Date.now()

      // Patch res.json to intercept the response
      const originalJson = res.json.bind(res)

      res.json = function(data) {
        const latency = Date.now() - start

        // Only log if the route attached llm data to res.locals
        if (res.locals.aishield) {
          const { userId, model, prompt, response, tokens } = res.locals.aishield

          shield.log({
            userId: userId || req.user?.id || req.user?._id || 'anonymous',
            model: model || 'unknown',
            prompt: prompt || '',
            response: response || '',
            tokens: tokens || 0,
            latency
          }).catch(err => console.error('[AIShield] Log error:', err.message))
        }

        return originalJson(data)
      }

      next()
    }
  }
}

// -----------------------------------------------------------------------------
// V2 SDK: Zyra Proxy Router Client
// -----------------------------------------------------------------------------
let OpenAIClient;
try {
  OpenAIClient = require('openai').OpenAI;
} catch (e) {
  OpenAIClient = class {
    constructor() { throw new Error("Please install 'openai' to use the specific Zyra class."); }
  };
}

class Zyra extends OpenAIClient {
  constructor(options = {}) {
    if (!options.apiKey) {
      throw new Error("Zyra: apiKey is required.");
    }
    
    super({
      apiKey: "zyra-auth", // Bypass native key check
      baseURL: options.baseURL || "https://api.zyra.dev/v1",
      defaultHeaders: {
        "x-zyra-api-key": options.apiKey,
        ...options.defaultHeaders
      },
      ...options
    });
  }
}

module.exports = { AIShield, OpenAIShield, AIShieldMiddleware, Zyra }