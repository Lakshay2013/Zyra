const mongoose = require('mongoose')
const { Types } = mongoose
const AuditLog = require('../models/AuditLog')

// GET /api/audit?page=1&limit=50&category=
exports.getAuditLogs = async (req, res) => {
  try {
    const orgId = new Types.ObjectId(req.user.orgId)
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const filter = { orgId }
    if (req.query.category) filter.category = req.query.category
    if (req.query.action) filter.action = req.query.action

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ])

    res.json({
      logs: logs.map((l) => ({
        id: l._id,
        timestamp: l.createdAt,
        actor: l.actorEmail || 'system',
        actorRole: l.actorRole,
        category: l.category,
        action: l.action,
        outcome: l.outcome,
        target: l.targetType && l.targetId ? `${l.targetType}:${l.targetId}` : (l.targetType || null),
        ip: l.ip,
        meta: l.meta,
      })),
      pagination: { total, page, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('getAuditLogs error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}
