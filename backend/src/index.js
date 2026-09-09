require('dotenv').config()

const mongoose = require('mongoose')
const app = require('./app')
const { initRedis } = require('./services/cacheLayer')

const VERSION = app.VERSION

// ── ENV VALIDATION ──
const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI', 'ENCRYPTION_KEY']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err.message))

// Open the Redis connection eagerly so /health reflects reality and the
// cache/idempotency layers are warm before the first request.
initRedis()

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
