const rateLimitModule = require('express-rate-limit')
const rateLimit = typeof rateLimitModule === 'function' ? rateLimitModule : rateLimitModule.rateLimit || rateLimitModule.default
const ipKeyGenerator = rateLimitModule.ipKeyGenerator || ((req) => req.ip)

const proxyLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
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
  message: { message: 'Too many authentication attempts, please try again later' }
})

module.exports = {
  proxyLimiter,
  authLimiter
}
