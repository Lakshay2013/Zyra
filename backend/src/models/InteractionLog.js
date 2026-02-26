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
  cost: {
    type: Number,
    default: 0
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
  flags: [{
    type: String,
    enum: ['pii', 'injection', 'abuse']
  }],
  riskDetails: {
    piiScore: { type: Number, default: 0 },
    injectionScore: { type: Number, default: 0 },
    abuseScore: { type: Number, default: 0 },
    piiTypes: [String]
  },
  analyzed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

// Index for fast queries
interactionLogSchema.index({ orgId: 1, createdAt: -1 })
interactionLogSchema.index({ orgId: 1, userId: 1 })
interactionLogSchema.index({ orgId: 1, riskScore: -1 })

module.exports = mongoose.model('InteractionLog', interactionLogSchema)