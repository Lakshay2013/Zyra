const { Worker } = require('bullmq')
const InteractionLog = require('../models/InteractionLog')
const Organization = require('../models/Organization')
const { connection, getRiskQueue } = require('../config/queue')
require('dotenv').config()

const mongoose = require('mongoose')

if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Log worker MongoDB connected'))
    .catch(err => console.error('❌ Worker MongoDB error:', err.message))
}

const worker = new Worker('interaction-logs', async (job) => {
  const {
    orgId, userId, model, prompt, response, tokens, cost, latency,
    statusCode, optimizer, reliability, provider, cached
  } = job.data

  try {
    const log = await InteractionLog.create({
      orgId,
      userId,
      model,
      provider: provider || null,
      prompt,
      response,
      tokens,
      cost,
      cached: cached || false,
      latency,
      statusCode: statusCode || 200,
      optimizer: optimizer || {},
      reliability: reliability || {}
    })

    await Organization.findByIdAndUpdate(orgId, {
      $inc: { currentMonthlyLogs: 1 }
    })

    const riskQueue = getRiskQueue()
    await riskQueue.add('analyze', { logId: log._id.toString() })

    // Log saved

  } catch (err) {
    console.error(`❌ Failed to process log job:`, err.message)
    throw err
  }
}, { connection })

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

console.log('🚀 Log worker initialized')
