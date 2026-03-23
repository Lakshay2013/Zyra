require('dotenv').config()
const mongoose = require('mongoose')

// Initialize DB connection once for all workers
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Multi-worker MongoDB connected'))
  .catch(err => console.error('❌ Multi-worker MongoDB error:', err.message))

require('./riskWorker')
require('./logWorker')

console.log('🚀 All background workers running')
