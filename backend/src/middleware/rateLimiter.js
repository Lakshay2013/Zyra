const rateLimitModule = require('express-rate-limit')
const rateLimit = typeof rateLimitModule === 'function' ? rateLimitModule : rateLimitModule.rateLimit || rateLimitModule.default
const ipKeyGenerator = rateLimitModule.ipKeyGenerator || ((req) => req.ip)

// ── Build Redis-backed store OR fall back to in-memory ──
let storeFactory

try {
  let RedisStore
  try {
    RedisStore = require('rate-limit-redis').default
  } catch (e) {
    RedisStore = require('rate-limit-redis')
  }
  const Redis = require('ioredis')

  let redisClient
  if (process.env.REDIS_PASSWORD && process.env.REDIS_HOST) {
    // Upstash / cloud Redis with TLS
    const url = `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
    redisClient = new Redis(url, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false
    })
  } else {
    // Local Docker Redis
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6380,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      lazyConnect: true
    })
    redisClient.connect().catch(() => {})
  }

  redisClient.on('error', (err) => {
    console.warn('[RateLimit] Redis error (non-fatal):', err.message)
  })

  storeFactory = (prefix) => new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix,
  })
} catch (err) {
  console.warn('[RateLimit] Redis unavailable, using in-memory store')
  storeFactory = null
}

const proxyLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  ...(storeFactory ? { store: storeFactory('zyra_limiter:') } : {}),
  keyGenerator: (req, res) => {
    return req.org ? req.org._id.toString() : ipKeyGenerator(req, res)
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this organization in a short time. Please slow down.'
    })
  }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  standardHeaders: true,
  legacyHeaders: false,
  ...(storeFactory ? { store: storeFactory('zyra_auth_limiter:') } : {}),
  message: { message: 'Too many authentication attempts, please try again later' }
})

module.exports = {
  proxyLimiter,
  authLimiter
}
