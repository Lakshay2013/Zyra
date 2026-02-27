const { Worker } = require('bullmq')
const InteractionLog = require('../models/InteractionLog')
const { detectPII } = require('../utils/piiDetector')
const { detectInjection } = require('../utils/injectionDetector')
const { detectAbuse } = require('../utils/abuseDetector')
const { connection } = require('../config/queue')
require('dotenv').config()

const mongoose = require('mongoose')

// Connect worker to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Risk worker MongoDB connected'))
  .catch(err => console.error('❌ Worker MongoDB error:', err.message))

const worker = new Worker('risk-analysis', async (job) => {
  const { logId } = job.data
  console.log(`🔍 Analyzing log ${logId}`)

  const log = await InteractionLog.findById(logId)
  if (!log) {
    console.error(`Log ${logId} not found`)
    return
  }

  const fullText = `${log.prompt} ${log.response}`

  // Run all detectors
  const piiResult = detectPII(fullText)
  const injectionResult = detectInjection(log.prompt)
  const abuseResult = detectAbuse(log.prompt, log.userId, log.orgId)

  // Weighted risk score
  const riskScore = Math.round(
    (piiResult.score * 0.4) +
    (injectionResult.score * 0.4) +
    (abuseResult.score * 0.2)
  )

  // Build flags array
  const flags = []
  if (piiResult.hasPII) flags.push('pii')
  if (injectionResult.hasInjection) flags.push('injection')
  if (abuseResult.hasAbuse) flags.push('abuse')

  // Update the log
  await InteractionLog.findByIdAndUpdate(logId, {
    riskScore,
    flags,
    analyzed: true,
    riskDetails: {
      piiScore: piiResult.score,
      injectionScore: injectionResult.score,
      abuseScore: abuseResult.score,
      piiTypes: piiResult.types
    }
  })

  console.log(`✅ Log ${logId} analyzed — risk score: ${riskScore}, flags: ${flags.join(', ') || 'none'}`)

}, { connection })

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message)
})

console.log('🚀 Risk worker started')