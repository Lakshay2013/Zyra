require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const securityHeaders = require('./middleware/securityHeaders')
const sanitize = require('./middleware/sanitize')
const { proxyLimiter, authLimiter } = require('./middleware/rateLimiter')
const { isRedisReady } = require('./services/cacheLayer')

const v1Routes = require('./routes/v1')
const proxyRoutes = require('./routes/proxy')
const authRoutes = require('./routes/auth')
const apiKeysRoutes = require('./routes/apiKeys')
const logsRoutes = require('./routes/logs')
const analyticsRoutes = require('./routes/analytics')
const orgRoutes = require('./routes/org')
const paymentsRoutes = require('./routes/payments')

const VERSION = '0.1.0-beta'

// ── ENV VALIDATION ──
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

// Health check
app.get('/health', async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1
  let redisOk = false
  try {
    redisOk = isRedisReady()
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