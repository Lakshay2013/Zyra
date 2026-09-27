require('dotenv').config()
const http = require('http')
const mongoose = require('mongoose')

// Initialize the DB connection once for all workers.
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Multi-worker MongoDB connected'))
  .catch(err => console.error('❌ Multi-worker MongoDB error:', err.message))

const logWorkerMod = require('./logWorker')
const riskWorkerMod = require('./riskWorker')

const logWorker = logWorkerMod.start()
const riskWorker = riskWorkerMod.start()

console.log('🚀 All background workers running')

// ── Health endpoint for container orchestration ──
const HEALTH_PORT = process.env.WORKER_HEALTH_PORT || 5001
http.createServer((req, res) => {
  if (req.url !== '/health') {
    res.writeHead(404).end()
    return
  }
  const mongoOk = mongoose.connection.readyState === 1
  const workersRunning = Boolean(logWorker?.isRunning?.() && riskWorker?.isRunning?.())
  const ok = mongoOk && workersRunning
  res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    status: ok ? 'ok' : 'degraded',
    mongo: mongoOk,
    workers: { logs: Boolean(logWorker?.isRunning?.()), risk: Boolean(riskWorker?.isRunning?.()) },
    uptime: Math.floor(process.uptime())
  }))
}).listen(HEALTH_PORT, () => console.log(`📍 Worker health: http://localhost:${HEALTH_PORT}/health`))

// ── Graceful shutdown ──
const shutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Closing workers...`)
  try {
    await Promise.all([logWorker.close(), riskWorker.close()])
    await mongoose.connection.close()
  } catch (err) {
    console.error('Error during worker shutdown:', err.message)
  }
  process.exit(0)
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
