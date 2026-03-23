const rateLimitModule = require('express-rate-limit')
const rateLimit = typeof rateLimitModule === 'function' ? rateLimitModule : rateLimitModule.rateLimit || rateLimitModule.default
const ipKeyGenerator = rateLimitModule.ipKeyGenerator || ((req) => req.ip)

let RedisStore
try {
  RedisStore = require('rate-limit-redis').default
} catch (e) {
  RedisStore = require('rate-limit-redis')
}
const Redis = require('ioredis')

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6380,
})

const proxyLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'zyra_limiter:',
  }),
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
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'zyra_auth_limiter:',
  }),
  message: { message: 'Too many authentication attempts, please try again later' }
})

module.exports = {
  proxyLimiter,
  authLimiter
}
