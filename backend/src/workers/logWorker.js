const { Worker } = require('bullmq')
const InteractionLog = require('../models/InteractionLog')
const Organization = require('../models/Organization')
const { connection, prefix, getRiskQueue } = require('../config/queue')
const { analyze } = require('../services/securityAnalyzer')
require('dotenv').config()

// MongoDB connection is owned by the caller:
//   - production: src/workers/index.js
//   - tests / scripts: they connect before requiring this module

/**
 * Process one interaction-log job:
 *   - run every rule-based detector on the RAW prompt/response
 *   - persist the InteractionLog with MASKED text + component scores + flags
 *   - optionally enqueue the risk-analysis job
 *
 * Exported so it can be driven directly by tests / seed scripts (which then
 * call processRiskJob themselves and pass { enqueueRisk: false }).
 *
 * @returns {Promise<import('mongoose').Document>} the created InteractionLog
 */
const processLogJob = async (job, { enqueueRisk = true } = {}) => {
  const {
    orgId, userId, model, prompt, response, tokens, cost, latency,
    statusCode, optimizer, reliability, provider, cached,
    sdk_language, model_requested, blocked, blockReason, simulated,
  } = job.data

  let sensitiveKeywords = []
  try {
    const org = await Organization.findById(orgId).select('policies.sensitiveKeywords').lean()
    sensitiveKeywords = org?.policies?.sensitiveKeywords || []
  } catch { /* non-fatal */ }

  const sec = analyze({ prompt, response, userId, orgId, sensitiveKeywords })

  const log = await InteractionLog.create({
    orgId,
    userId,
    model,
    provider: provider || null,
    prompt: sec.maskedPrompt,
    response: sec.maskedResponse,
    tokens,
    cost,
    cached: cached || false,
    latency,
    statusCode: statusCode || 200,
    blocked: blocked || false,
    blockReason: blockReason || null,
    simulated: simulated || false,
    sdk_language: sdk_language || null,
    model_requested: model_requested || null,
    optimizer: optimizer || {},
    reliability: reliability || {},
    analyzed: false,
    flags: sec.flags,
    riskDetails: {
      injectionScore: sec.components.injection,
      jailbreakScore: sec.components.jailbreak,
      piiScore: sec.components.pii,
      abuseScore: sec.components.abuse,
      sensitiveScore: sec.sensitive.score,
      piiTypes: sec.pii.types,
      injectionMatches: sec.injection.matches,
      jailbreakMatches: sec.jailbreak.matches,
      abuseIssues: sec.abuse.issues,
      sensitiveKeywords: sec.sensitive.matches,
    },
  })

  // NOTE: monthly usage is reserved atomically at request time in the proxy
  // (services/usageLimiter.reserveMonthlyLog), not here — double-counting.
  if (enqueueRisk) {
    try {
      await getRiskQueue().add('analyze', { logId: log._id.toString() })
    } catch (err) {
      console.error('[logWorker] could not enqueue risk job:', err.message)
    }
  }

  return log
}

/** Start the BullMQ worker. Called only by src/workers/index.js. */
const start = () => {
  const worker = new Worker('interaction-logs', async (job) => {
    try {
      await processLogJob(job)
    } catch (err) {
      console.error('❌ Failed to process log job:', err.message)
      throw err
    }
  }, { connection, prefix })
  worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} failed:`, err.message))
  console.log('🚀 Log worker initialized')
  return worker
}

module.exports = { start, processLogJob }
