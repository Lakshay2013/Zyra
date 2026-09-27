const mongoose = require('mongoose')

/**
 * Risk Report Collection (paper §database design).
 *
 * One document per analysed interaction. The same fields are also denormalised
 * onto InteractionLog for single-query log listings; RiskReport is the
 * normalised security record the "Risk Reports" dashboard reads.
 *
 *   ReportID (_id), LogID, Risk score, PII Found, Injection found,
 *   Jailbreak found, Severity   (+ component breakdown for the demo view)
 */
const riskReportSchema = new mongoose.Schema({
  logId: { type: mongoose.Schema.Types.ObjectId, ref: 'InteractionLog', required: true, index: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  userId: { type: String, default: 'anonymous' },
  model: { type: String, default: null },
  provider: { type: String, default: null },

  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },

  piiFound: { type: Boolean, default: false },
  injectionFound: { type: Boolean, default: false },
  jailbreakFound: { type: Boolean, default: false },
  abuseFound: { type: Boolean, default: false },
  sensitiveKeywordFound: { type: Boolean, default: false },

  // Component scores that fed R = 0.35I + 0.30J + 0.20P + 0.15A
  components: {
    injection: { type: Number, default: 0 },
    jailbreak: { type: Number, default: 0 },
    pii: { type: Number, default: 0 },
    abuse: { type: Number, default: 0 },
  },

  // Safe detail — pattern labels / PII categories, never raw prompt text.
  detail: {
    piiTypes: [String],
    injectionMatches: [String],
    jailbreakMatches: [String],
    abuseIssues: [String],
    sensitiveKeywords: [String],
  },
}, { timestamps: true })

riskReportSchema.index({ orgId: 1, createdAt: -1 })
riskReportSchema.index({ orgId: 1, severity: 1, createdAt: -1 })

module.exports = mongoose.model('RiskReport', riskReportSchema)
