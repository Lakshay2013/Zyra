const mongoose = require('mongoose')

/**
 * Audit Log Collection (paper §B Functional Modules — Audit Logging Module).
 * "Key events are recorded, including API interaction, authentication,
 *  administration, and events related to compliance and security."
 *
 * This is the control-plane audit trail (auth + admin + security actions).
 * Per-request LLM traffic is recorded separately in InteractionLog.
 */
const auditLogSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorEmail: { type: String, default: null },
  actorRole: { type: String, default: null },

  category: {
    type: String,
    enum: ['auth', 'api_key', 'organization', 'provider', 'policy', 'billing', 'security'],
    required: true,
  },
  action: { type: String, required: true }, // e.g. 'login', 'api_key.created', 'policy.updated'
  outcome: { type: String, enum: ['success', 'failure'], default: 'success' },

  targetType: { type: String, default: null }, // 'ApiKey' | 'Organization' | ...
  targetId: { type: String, default: null },

  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

auditLogSchema.index({ orgId: 1, createdAt: -1 })
auditLogSchema.index({ orgId: 1, category: 1, createdAt: -1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)
