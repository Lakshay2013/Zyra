const InteractionLog = require('../models/InteractionLog')
const mongoose = require('mongoose')
const { Types } = mongoose
const { getValueReport, getCostByModel, getCostByUser } = require('../services/valueMetrics')

// GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [stats] = await InteractionLog.aggregate([
      {
        $match: {
          orgId: new Types.ObjectId(orgId),
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScore' },
          totalCost: { $sum: '$cost' },
          totalTokens: { $sum: '$tokens.total' },
          flaggedCount: {
            $sum: { $cond: [{ $gt: ['$riskScore', 50] }, 1, 0] }
          },
          totalSavings: { $sum: { $ifNull: ['$optimizer.savings', 0] } }
        }
      }
    ])

    res.json({
      totalLogs: stats?.totalLogs || 0,
      avgRiskScore: Math.round(stats?.avgRiskScore || 0),
      totalCost: parseFloat((stats?.totalCost || 0).toFixed(4)),
      totalTokens: stats?.totalTokens || 0,
      flaggedCount: stats?.flaggedCount || 0,
      totalSavings: parseFloat((stats?.totalSavings || 0).toFixed(4))
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// GET /api/analytics/usage?period=7d
exports.getUsage = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const days = req.query.period === '30d' ? 30 : 7
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const usage = await InteractionLog.aggregate([
      {
        $match: {
          orgId: new Types.ObjectId(orgId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalTokens: { $sum: '$tokens.total' },
          totalCost: { $sum: '$cost' },
          totalLogs: { $sum: 1 },
          avgRisk: { $avg: '$riskScore' },
          savings: { $sum: { $ifNull: ['$optimizer.savings', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({ usage })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// GET /api/analytics/top-users
exports.getTopUsers = async (req, res) => {
  try {
    const orgId = req.user.orgId

    const topUsers = await InteractionLog.aggregate([
      {
        $match: {
          orgId: new Types.ObjectId(orgId)
        }
      },
      {
        $group: {
          _id: '$userId',
          totalTokens: { $sum: '$tokens.total' },
          totalCost: { $sum: '$cost' },
          totalLogs: { $sum: 1 },
          avgRisk: { $avg: '$riskScore' }
        }
      },
      { $sort: { totalTokens: -1 } },
      { $limit: 10 }
    ])

    res.json({ topUsers })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// GET /api/analytics/high-risk
exports.getHighRisk = async (req, res) => {
  try {
    const orgId = req.user.orgId

    const highRisk = await InteractionLog.find({
      orgId,
      riskScore: { $gt: 50 }
    })
      .sort({ riskScore: -1 })
      .limit(20)
      .select('userId model riskScore flags createdAt prompt')

    res.json({ highRisk })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// GET /api/analytics/savings — "You saved $X this month"
exports.getSavings = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const days = parseInt(req.query.days) || 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [stats] = await InteractionLog.aggregate([
      {
        $match: {
          orgId: new Types.ObjectId(orgId),
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          totalSavings: { $sum: { $ifNull: ['$optimizer.savings', 0] } },
          optimizedCount: {
            $sum: { $cond: [{ $eq: ['$optimizer.wasOptimized', true] }, 1, 0] }
          },
          totalRequests: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      }
    ])

    const s = stats || {}
    res.json({
      period: `last_${days}_days`,
      totalSavings: parseFloat((s.totalSavings || 0).toFixed(4)),
      optimizedRequests: s.optimizedCount || 0,
      totalRequests: s.totalRequests || 0,
      totalCost: parseFloat((s.totalCost || 0).toFixed(4)),
      savingsPercentage: s.totalCost > 0
        ? parseFloat(((s.totalSavings / (s.totalCost + s.totalSavings)) * 100).toFixed(1))
        : 0
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// GET /api/analytics/cost-breakdown — cost by model
exports.getCostBreakdown = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const days = parseInt(req.query.days) || 30

    const byModel = await getCostByModel(orgId, days)
    const byUser = await getCostByUser(orgId, days)

    res.json({ byModel, byUser })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// GET /api/analytics/value-report — the hard ROI story
exports.getValueReport = async (req, res) => {
  try {
    const orgId = req.user.orgId
    const days = parseInt(req.query.days) || 30

    const report = await getValueReport(orgId, days)
    res.json(report)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

