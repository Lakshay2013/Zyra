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
          'x-api-key': this.apiKey
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

module.exports = { AIShield }