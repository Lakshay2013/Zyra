const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const securityHeaders = require('./middleware/securityHeaders')
const sanitize = require('./middleware/sanitize')
const { proxyLimiter, authLimiter } = require('./middleware/rateLimiter')
const { pingRedis } = require('./services/cacheLayer')

const v1Routes = require('./routes/v1')
const proxyRoutes = require('./routes/proxy')
const authRoutes = require('./routes/auth')
const apiKeysRoutes = require('./routes/apiKeys')
const logsRoutes = require('./routes/logs')
const analyticsRoutes = require('./routes/analytics')
const orgRoutes = require('./routes/org')
const paymentsRoutes = require('./routes/payments')
const securityRoutes = require('./routes/security')
const auditRoutes = require('./routes/audit')

const VERSION = '0.1.0-beta'

const app = express()

// Trust proxy for correct IP detection behind load balancers (Railway, Render, etc.)
app.set('trust proxy', 1)

app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true }
}))
app.use(securityHeaders)
app.use(sanitize)

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : []
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true,
  // Zyra's routing decision is returned in x-zyra-* headers; the browser can only
  // read them from JS if they are explicitly exposed.
  exposedHeaders: [
    'x-zyra-model', 'x-zyra-provider', 'x-zyra-cost', 'x-zyra-savings',
    'x-zyra-complexity', 'x-zyra-cached', 'x-zyra-fallback', 'x-zyra-quality-retry',
    'x-zyra-idempotent-replay',
  ],
}))

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// JSON parsing error handler
const handleJsonError = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Invalid JSON in request body', type: 'invalid_request_error' } })
  }
  next(err)
}

// ── GATEWAY ROUTES ──
app.use('/v1', express.json({ limit: '2mb' }), handleJsonError, proxyLimiter, v1Routes)
app.use('/proxy', express.json({ limit: '2mb' }), handleJsonError, proxyLimiter, proxyRoutes)

app.use(express.json({ limit: '10kb' }))

// ── API ROUTES ──
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/keys', apiKeysRoutes)
app.use('/api/logs', logsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/org', orgRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/security', securityRoutes)
app.use('/api/audit', auditRoutes)

// Health check
app.get('/health', async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1
  let redisOk = false
  try {
    redisOk = await pingRedis()
  } catch {}

  const status = mongoOk ? (redisOk ? 'ok' : 'degraded') : 'down'
  res.status(mongoOk ? 200 : 503).json({
    status,
    project: 'zyra',
    version: VERSION,
    environment: process.env.NODE_ENV || 'development',
    mongo: mongoOk,
    redis: redisOk,
    uptime: Math.floor(process.uptime())
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack)
  res.status(500).json({ message: 'Something went wrong' })
})

module.exports = app
module.exports.VERSION = VERSION
