const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const securityHeaders = require('./middleware/securityHeaders')
const sanitize = require('./middleware/sanitize')
require('dotenv').config()

const VERSION = '0.1.0-beta'

// ── ENV VALIDATION: crash immediately if critical vars missing ──
const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI', 'ENCRYPTION_KEY']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

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
  credentials: true
}))

const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
app.use(morgan(logFormat))

const { proxyLimiter } = require('./middleware/rateLimiter')

// ── NEW: OpenAI-compatible /v1/ gateway (PRD primary path) ──
app.use('/v1', express.json({ limit: '2mb' }))
app.use('/v1', (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Invalid JSON in request body', type: 'invalid_request_error' } })
  }
  next(err)
})
app.use('/v1', proxyLimiter, require('./routes/v1'))

// ── LEGACY: Provider-specific proxy (backwards compatible) ──
app.use('/proxy', express.json({ limit: '2mb' }))
app.use('/proxy', (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Invalid JSON in request body', type: 'invalid_request_error' } })
  }
  next(err)
})
app.use('/proxy', proxyLimiter, require('./routes/proxy'))
app.use(express.json({ limit: '10kb' }))

const { authLimiter } = require('./middleware/rateLimiter')
// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'))
app.use('/api/keys', require('./routes/apiKeys'))
app.use('/api/logs', require('./routes/logs'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/org', require('./routes/org'))


// Health check
app.get('/health', async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1
  let redisOk = false
  try {
    const { getRedis } = require('./services/cacheLayer')
    const redis = getRedis()
    await redis.ping()
    redisOk = true
  } catch {}
  const allOk = mongoOk && redisOk
  const status = allOk ? 'ok' : 'degraded'
  res.status(allOk ? 200 : 503).json({
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

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err.message))

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
  console.log(`\n███ ZYRA v${VERSION} ███`)
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
  console.log(`📍 Health check: http://localhost:${PORT}/health\n`)
})

// ── GRACEFUL SHUTDOWN ──
const shutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`)
  server.close(async () => {
    try {
      await mongoose.connection.close()
      console.log('✅ MongoDB connection closed')
    } catch (err) {
      console.error('Error closing MongoDB:', err)
    }
    process.exit(0)
  })
  // Force shutdown after 10s if graceful fails
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))