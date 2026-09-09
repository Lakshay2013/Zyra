const { Worker } = require('bullmq')
const InteractionLog = require('../models/InteractionLog')
const RiskReport = require('../models/RiskReport')
const Notification = require('../models/Notification')
const { connection, prefix } = require('../config/queue')
const { computeRisk } = require('../services/riskEngine')
require('dotenv').config()

// MongoDB connection is owned by the caller (src/workers/index.js in production;
// tests / scripts connect before requiring this module).

/**
 * Abuse FREQUENCY score (the paper's A term): how many flagged interactions this
 * user produced in the last 24h. Rate-based, so it climbs as a user keeps
 * sending suspicious prompts even if any single one is mild.
 */
const abuseFrequencyScore = async (orgId, userId, excludeLogId) => {
  if (!userId || userId === 'anonymous') return 0
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const q = {
    orgId,
    userId,
    createdAt: { $gte: since },
    'flags.0': { $exists: true },
  }
  if (excludeLogId) q._id = { $ne: excludeLogId } // don't let an interaction inflate its own score
  const flagged = await InteractionLog.countDocuments(q)
  return Math.min(flagged * 15, 100)
}

/**
 * Process one risk-analysis job. Component scores were computed on the RAW text
 * by the log worker (before masking) and stored on `log.riskDetails`; this step
 * adds the abuse-frequency term, applies R = 0.35I + 0.30J + 0.20P + 0.15A,
 * writes back severity + score, and creates the RiskReport (+ Notification when
 * R > 80).
 *
 * Exported for unit testing.
 * @returns {Promise<{ risk, report, notified: boolean } | null>}
 */
const processRiskJob = async (job) => {
  const { logId } = job.data

  const log = await InteractionLog.findById(logId)
  if (!log) {
    console.error(`Log ${logId} not found`)
    return null
  }

  const d = log.riskDetails || {}
  const perPromptAbuse = d.abuseScore || 0
  const freqAbuse = await abuseFrequencyScore(log.orgId, log.userId, log._id)
  const abuse = Math.max(perPromptAbuse, freqAbuse)

  const risk = computeRisk({
    injection: d.injectionScore || 0,
    jailbreak: d.jailbreakScore || 0,
    pii: d.piiScore || 0,
    abuse,
  })

  const flags = new Set(log.flags || [])
  if (freqAbuse >= 25) flags.add('abuse')

  await InteractionLog.findByIdAndUpdate(logId, {
    riskScore: risk.riskScore,
    severity: risk.severity,
    flags: [...flags],
    analyzed: true,
    'riskDetails.abuseScore': abuse,
  })

  const report = await RiskReport.create({
    logId: log._id,
    orgId: log.orgId,
    userId: log.userId,
    model: log.model,
    provider: log.provider,
    riskScore: risk.riskScore,
    severity: risk.severity,
    piiFound: (d.piiTypes || []).length > 0,
    injectionFound: (d.injectionScore || 0) > 0,
    jailbreakFound: (d.jailbreakScore || 0) > 0,
    abuseFound: abuse > 0,
    sensitiveKeywordFound: (d.sensitiveKeywords || []).length > 0,
    components: risk.components,
    detail: {
      piiTypes: d.piiTypes || [],
      injectionMatches: d.injectionMatches || [],
      jailbreakMatches: d.jailbreakMatches || [],
      abuseIssues: d.abuseIssues || [],
      sensitiveKeywords: d.sensitiveKeywords || [],
    },
  })

  let notified = false
  if (risk.shouldNotify) {
    await Notification.create({
      orgId: log.orgId,
      type: 'high_risk',
      severity: 'critical',
      title: `High-risk interaction (risk ${risk.riskScore}/100)`,
      message: `User "${log.userId}" · ${log.model || 'unknown model'} · flags: ${[...flags].join(', ') || 'none'}`,
      logId: log._id,
      riskReportId: report._id,
      meta: { riskScore: risk.riskScore, components: risk.components },
    })
    notified = true
  }

  return { risk, report, notified }
}

/** Start the BullMQ worker. Called only by src/workers/index.js. */
const start = () => {
  const worker = new Worker('risk-analysis', processRiskJob, { connection, prefix })
  worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} failed:`, err.message))
  console.log('🚀 Risk worker started')
  return worker
}

module.exports = { start, processRiskJob, abuseFrequencyScore }
