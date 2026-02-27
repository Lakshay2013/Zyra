const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const app = express()

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '10kb' }))
app.use('/api/auth', require('./routes/auth'))
app.use('/api/keys', require('./routes/apiKeys')) 

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/logs', require('./routes/logs'))

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