const crypto = require('crypto')
const Redis = require('ioredis')

let redis = null
let redisAvailable = false

const getRedis = () => {
  if (!redis) {
    const commonOpts = {
      maxRetriesPerRequest: null,      // NEVER throw MaxRetriesPerRequestError
      enableOfflineQueue: false,       // fail immediately when disconnected
      retryStrategy: (times) => {
        if (times > 10) return null    // stop retrying after 10 attempts
        return Math.min(times * 500, 5000)
      }
    }

    // Upstash / cloud Redis: use URL with TLS
    if (process.env.REDIS_PASSWORD && process.env.REDIS_HOST) {
      const url = `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
      redis = new Redis(url, commonOpts)
    } else {
      // Local Docker Redis (no TLS, no password)
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6380,
        lazyConnect: true,
        ...commonOpts
      })
      redis.connect().catch(() => {})
    }

    redis.on('ready', () => {
      redisAvailable = true
      console.log('[Cache] Redis connected ✅')
    })

    redis.on('error', (err) => {
      redisAvailable = false
      console.warn('[Cache] Redis error (non-fatal):', err.message)
    })

    redis.on('close', () => {
      redisAvailable = false
    })
  }
  return redis
}

const isRedisReady = () => redisAvailable

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
  if (!redisAvailable) return null
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
  if (!redisAvailable) return
  try {
    const r = getRedis()
    await r.set(key, JSON.stringify(responseBody), 'EX', ttl)
  } catch (err) {
    // Cache write failure — not fatal
  }
}

module.exports = { buildCacheKey, getFromCache, setInCache, getRedis, isRedisReady }
