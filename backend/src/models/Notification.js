const mongoose = require('mongoose')

/**
 * Administrator dashboard notifications.
 *
 * Paper §Methodology D: "Whenever the score reaches over 80, the administrator
 * gets a dashboard notification." Also used for other admin-facing alerts
 * (cost threshold breaches, provider failures) so the dashboard has one feed.
 */
const notificationSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  type: {
    type: String,
    enum: ['high_risk', 'cost_alert', 'provider_failure', 'security_event'],
    default: 'security_event',
  },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  // Optional link target for the dashboard
  logId: { type: mongoose.Schema.Types.ObjectId, ref: 'InteractionLog', default: null },
  riskReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskReport', default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
}, { timestamps: true })

notificationSchema.index({ orgId: 1, read: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
