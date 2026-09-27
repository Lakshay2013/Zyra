const mongoose = require('mongoose')
const { Types } = mongoose
const InteractionLog = require('../models/InteractionLog')
const RiskReport = require('../models/RiskReport')
const Notification = require('../models/Notification')
const { RISK_WEIGHTS, NOTIFY_THRESHOLD } = require('../services/riskEngine')

// GET /api/security/overview?days=30
exports.getOverview = async (req, res) => {
  try {
    const orgId = new Types.ObjectId(req.user.orgId)
    const days = Math.min(parseInt(req.query.days) || 30, 365)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const match = { orgId, createdAt: { $gte: since } }
    const has = (flag) => ({ $cond: [{ $in: [flag, { $ifNull: ['$flags', []] }] }, 1, 0] })

    const [agg] = await InteractionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          analyzed: { $sum: { $cond: ['$analyzed', 1, 0] } },
          securityEvents: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$flags', []] } }, 0] }, 1, 0] } },
          injections: { $sum: has('injection') },
          jailbreaks: { $sum: has('jailbreak') },
          pii: { $sum: has('pii') },
          sensitiveKeywords: { $sum: has('sensitive_keyword') },
          abuse: { $sum: has('abuse') },
          blocked: { $sum: { $cond: ['$blocked', 1, 0] } },
          avgRisk: { $avg: '$riskScore' },
          highRisk: { $sum: { $cond: [{ $gte: ['$riskScore', 50] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $gt: ['$riskScore', NOTIFY_THRESHOLD] }, 1, 0] } },
        },
      },
    ])

    const trend = await InteractionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          interactions: { $sum: 1 },
          securityEvents: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$flags', []] } }, 0] }, 1, 0] } },
          avgRisk: { $avg: '$riskScore' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const a = agg || {}
    res.json({
      period: `last_${days}_days`,
      formula: 'R = 0.35*I + 0.30*J + 0.20*P + 0.15*A',
      weights: RISK_WEIGHTS,
      notifyThreshold: NOTIFY_THRESHOLD,
      totals: {
        totalInteractions: a.totalInteractions || 0,
        analyzed: a.analyzed || 0,
        securityEvents: a.securityEvents || 0,
        promptInjections: a.injections || 0,
        jailbreaks: a.jailbreaks || 0,
        piiDetections: a.pii || 0,
        sensitiveKeywordDetections: a.sensitiveKeywords || 0,
        abuseEvents: a.abuse || 0,
        blockedRequests: a.blocked || 0,
        avgRiskScore: Math.round(a.avgRisk || 0),
        highRiskInteractions: a.highRisk || 0,
        criticalInteractions: a.critical || 0,
      },
      trend: trend.map((t) => ({
        date: t._id,
        interactions: t.interactions,
        securityEvents: t.securityEvents,
        avgRisk: Math.round(t.avgRisk || 0),
      })),
    })
  } catch (err) {
    console.error('security getOverview error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/security/reports?page=1&limit=50&severity=&flag=
exports.getReports = async (req, res) => {
  try {
    const orgId = new Types.ObjectId(req.user.orgId)
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const filter = { orgId }
    if (req.query.severity) filter.severity = req.query.severity
    if (req.query.flag) {
      const map = {
        injection: 'injectionFound', jailbreak: 'jailbreakFound',
        pii: 'piiFound', abuse: 'abuseFound', sensitive_keyword: 'sensitiveKeywordFound',
      }
      if (map[req.query.flag]) filter[map[req.query.flag]] = true
    }
    if (req.query.minRisk) filter.riskScore = { $gte: Number(req.query.minRisk) }

    const [reports, total] = await Promise.all([
      RiskReport.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      RiskReport.countDocuments(filter),
    ])

    res.json({
      reports: reports.map((r) => ({
        id: r._id,
        logId: r.logId,
        timestamp: r.createdAt,
        userId: r.userId,
        model: r.model,
        provider: r.provider,
        riskScore: r.riskScore,
        severity: r.severity,
        components: r.components,
        injection: r.injectionFound,
        jailbreak: r.jailbreakFound,
        pii: r.piiFound,
        abuse: r.abuseFound,
        sensitiveKeyword: r.sensitiveKeywordFound,
      })),
      pagination: { total, page, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('security getReports error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/security/reports/:id
exports.getReportDetail = async (req, res) => {
  try {
    const orgId = new Types.ObjectId(req.user.orgId)
    const report = await RiskReport.findOne({ _id: req.params.id, orgId }).lean()
    if (!report) return res.status(404).json({ message: 'Report not found' })

    const log = await InteractionLog.findOne({ _id: report.logId, orgId })
      .select('prompt response model provider tokens cost latency statusCode blocked blockReason createdAt riskDetails')
      .lean()

    res.json({
      report: {
        id: report._id,
        timestamp: report.createdAt,
        userId: report.userId,
        model: report.model,
        provider: report.provider,
        riskScore: report.riskScore,
        severity: report.severity,
        components: report.components,
        weights: RISK_WEIGHTS,
        detail: report.detail, // pattern labels / categories only — no raw content
      },
      // Prompt / response are already masked at storage time.
      interaction: log
        ? {
            prompt: log.prompt,
            response: log.response,
            model: log.model,
            provider: log.provider,
            tokens: log.tokens,
            cost: log.cost,
            latency: log.latency,
            statusCode: log.statusCode,
            blocked: log.blocked,
            blockReason: log.blockReason,
          }
        : null,
    })
  } catch (err) {
    console.error('security getReportDetail error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/security/notifications
exports.getNotifications = async (req, res) => {
  try {
    const orgId = new Types.ObjectId(req.user.orgId)
    const unreadOnly = req.query.unread === 'true'
    const filter = { orgId }
    if (unreadOnly) filter.read = false
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean(),
      Notification.countDocuments({ orgId, read: false }),
    ])
    res.json({ notifications, unreadCount })
  } catch (err) {
    console.error('security getNotifications error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/security/notifications/:id/read   (id = 'all' marks all read)
exports.markNotificationRead = async (req, res) => {
  try {
    const orgId = new Types.ObjectId(req.user.orgId)
    if (req.params.id === 'all') {
      await Notification.updateMany({ orgId, read: false }, { $set: { read: true } })
      return res.json({ ok: true })
    }
    await Notification.updateOne({ _id: req.params.id, orgId }, { $set: { read: true } })
    res.json({ ok: true })
  } catch (err) {
    console.error('security markNotificationRead error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}
