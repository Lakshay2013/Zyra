const InteractionLog = require('../models/InteractionLog')
const mongoose = require('mongoose')
const { Types } = mongoose

/**
 * Aggregates the "hard value" story — the ROI that justifies a Zyra subscription.
 *
 * @param {string} orgId - Organization ID
 * @param {number} days - Period to aggregate (default: 30)
 * @returns {Object} Full value report
 */
const getValueReport = async (orgId, days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const matchStage = {
    $match: {
      orgId: new Types.ObjectId(orgId),
      createdAt: { $gte: since }
    }
  }

  const [stats] = await InteractionLog.aggregate([
    matchStage,
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalCost: { $sum: '$cost' },
        totalTokens: { $sum: '$tokens.total' },
        totalSavings: { $sum: { $ifNull: ['$optimizer.savings', 0] } },
        optimizedCount: {
          $sum: { $cond: [{ $eq: ['$optimizer.wasOptimized', true] }, 1, 0] }
        },
        fallbackCount: {
          $sum: { $cond: [{ $eq: ['$reliability.fallbackUsed', true] }, 1, 0] }
        },
        retryTotal: { $sum: { $ifNull: ['$reliability.retryCount', 0] } },
        successCount: {
          $sum: { $cond: [{ $and: [{ $gte: ['$statusCode', 200] }, { $lt: ['$statusCode', 400] }] }, 1, 0] }
        },
        flaggedCount: {
          $sum: { $cond: [{ $gt: ['$riskScore', 50] }, 1, 0] }
        },
        injectionCount: {
          $sum: { $cond: [{ $in: ['injection', { $ifNull: ['$flags', []] }] }, 1, 0] }
        },
        piiCount: {
          $sum: { $cond: [{ $in: ['pii', { $ifNull: ['$flags', []] }] }, 1, 0] }
        },
        abuseCount: {
          $sum: { $cond: [{ $in: ['abuse', { $ifNull: ['$flags', []] }] }, 1, 0] }
        },
        avgLatency: { $avg: '$latency' }
      }
    }
  ])

  const s = stats || {}
  const totalRequests = s.totalRequests || 0
  const successCount = s.successCount || totalRequests // defaults to all success if statusCode not tracked yet

  return {
    period: `last_${days}_days`,
    moneySaved: {
      optimization: parseFloat((s.totalSavings || 0).toFixed(4)),
      total: parseFloat((s.totalSavings || 0).toFixed(4))
    },
    costReport: {
      totalSpent: parseFloat((s.totalCost || 0).toFixed(4)),
      totalTokens: s.totalTokens || 0,
      optimizedRequests: s.optimizedCount || 0
    },
    reliability: {
      totalRequests,
      successRate: totalRequests > 0 ? parseFloat(((successCount / totalRequests) * 100).toFixed(1)) : 100,
      fallbacksUsed: s.fallbackCount || 0,
      retriesUsed: s.retryTotal || 0,
      avgLatency: Math.round(s.avgLatency || 0)
    },
    attacksBlocked: {
      injections: s.injectionCount || 0,
      pii: s.piiCount || 0,
      abuse: s.abuseCount || 0,
      total: s.flaggedCount || 0
    }
  }
}

/**
 * Get cost breakdown by model.
 */
const getCostByModel = async (orgId, days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  return InteractionLog.aggregate([
    {
      $match: {
        orgId: new Types.ObjectId(orgId),
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$model',
        totalCost: { $sum: '$cost' },
        totalTokens: { $sum: '$tokens.total' },
        totalLogs: { $sum: 1 },
        avgLatency: { $avg: '$latency' },
        totalSavings: { $sum: { $ifNull: ['$optimizer.savings', 0] } }
      }
    },
    { $sort: { totalCost: -1 } }
  ])
}

/**
 * Get cost breakdown by user.
 */
const getCostByUser = async (orgId, days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  return InteractionLog.aggregate([
    {
      $match: {
        orgId: new Types.ObjectId(orgId),
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalCost: { $sum: '$cost' },
        totalTokens: { $sum: '$tokens.total' },
        totalLogs: { $sum: 1 }
      }
    },
    { $sort: { totalCost: -1 } },
    { $limit: 20 }
  ])
}

module.exports = {
  getValueReport,
  getCostByModel,
  getCostByUser
}
