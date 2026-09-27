const mongoose = require('mongoose')

const interactionLogSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  response: {
    type: String,
    default: ''
  },
  tokens: {
    prompt: { type: Number, default: 0 },
    completion: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  provider: {
    type: String,
    default: null
  },
  cost: {
    type: Number,
    default: 0
  },
  cached: {
    type: Boolean,
    default: false
  },
  latency: {
    type: Number,
    default: 0
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  flags: [{
    type: String,
    enum: ['pii', 'injection', 'jailbreak', 'abuse', 'sensitive_keyword']
  }],
  riskDetails: {
    // Component scores that feed R = 0.35·I + 0.30·J + 0.20·P + 0.15·A
    injectionScore: { type: Number, default: 0 },
    jailbreakScore: { type: Number, default: 0 },
    piiScore: { type: Number, default: 0 },
    abuseScore: { type: Number, default: 0 },
    sensitiveScore: { type: Number, default: 0 },
    piiTypes: [String],
    injectionMatches: [String],
    jailbreakMatches: [String],
    abuseIssues: [String],
    sensitiveKeywords: [String]
  },
  analyzed: {
    type: Boolean,
    default: false
  },
  // Cost optimizer tracking
  optimizer: {
    originalModel: { type: String, default: null },
    optimizedModel: { type: String, default: null },
    originalCost: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    wasOptimized: { type: Boolean, default: false },
    complexity: { type: String, enum: ['simple', 'standard', 'complex'], default: null },
    qualityRetried: { type: Boolean, default: false },
    qualityFailReason: { type: String, default: null }
  },
  // Reliability tracking
  reliability: {
    retryCount: { type: Number, default: 0 },
    fallbackUsed: { type: Boolean, default: false },
    fallbackProvider: { type: String, default: null }
  },
  // Response status
  statusCode: { type: Number, default: 200 },
  // Set when the request was stopped by a pre-flight policy (never reached a provider)
  blocked: { type: Boolean, default: false },
  blockReason: { type: String, enum: ['injection', 'jailbreak', 'pii', null], default: null },
  // Response came from the built-in demo simulator, not a real provider
  simulated: { type: Boolean, default: false },
  // Universal log fields (set by non-proxy integrations)
  sdk_language: { type: String, default: null },        // 'python' | 'node' | 'go' | 'proxy' | etc.
  model_requested: { type: String, default: null }       // Original model before Zyra routing
}, { timestamps: true })

// Index for fast queries
interactionLogSchema.index({ orgId: 1, createdAt: -1 })
interactionLogSchema.index({ orgId: 1, userId: 1 })
interactionLogSchema.index({ orgId: 1, riskScore: -1 })
interactionLogSchema.index({ orgId: 1, model: 1 })
interactionLogSchema.index({ orgId: 1, provider: 1 })

module.exports = mongoose.model('InteractionLog', interactionLogSchema)