const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(morgan('dev'))

const { proxyLimiter } = require('./middleware/rateLimiter')

// ── NEW: OpenAI-compatible /v1/ gateway (PRD primary path) ──
app.use('/v1', express.json({ limit: '2mb' }))
app.use('/v1', proxyLimiter, require('./routes/v1'))

// ── LEGACY: Provider-specific proxy (backwards compatible) ──
app.use('/proxy', express.json({ limit: '2mb' }))
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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'ai-shield' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong' })
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err.message))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})