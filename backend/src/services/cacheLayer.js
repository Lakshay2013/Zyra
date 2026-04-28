const crypto = require('crypto')
const Redis = require('ioredis')

let redis = null

const getRedis = () => {
  if (!redis) {
    // Upstash / cloud Redis: use URL with TLS
    if (process.env.REDIS_PASSWORD && process.env.REDIS_HOST) {
      const url = `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
      redis = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 200, 5000)
      })
    } else {
      // Local Docker Redis (no TLS, no password)
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6380,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })
      redis.connect().catch(() => {})
    }

    redis.on('error', (err) => {
      console.warn('[Cache] Redis error (non-fatal):', err.message)
    })
  }
  return redis
}

/**
 * Build a deterministic cache key from model + messages.
 * SHA-256 of the canonical JSON.
 */
const buildCacheKey = (model, messages, extraParams = {}) => {
  const payload = JSON.stringify({
    model,
    messages,
    temperature: extraParams.temperature,
    max_tokens: extraParams.max_tokens
  })
  const hash = crypto.createHash('sha256').update(payload).digest('hex')
  return `zyra:cache:${hash}`
}

/**
 * Try to get a cached response.
 * @returns {Object|null} Cached response body or null
 */
const getFromCache = async (key) => {
  try {
    const r = getRedis()
    const data = await r.get(key)
    if (data) {
      return JSON.parse(data)
    }
  } catch (err) {
    // Cache miss or Redis down — not fatal
  }
  return null
}

/**
 * Store a response in cache.
 * @param {string} key
 * @param {Object} responseBody
 * @param {number} ttl - TTL in seconds (default 300)
 */
const setInCache = async (key, responseBody, ttl = 300) => {
  try {
    const r = getRedis()
    await r.set(key, JSON.stringify(responseBody), 'EX', ttl)
  } catch (err) {
    // Cache write failure — not fatal
  }
}

module.exports = { buildCacheKey, getFromCache, setInCache, getRedis }
