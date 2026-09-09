const Organization = require('../models/Organization')

/**
 * Atomically reserve one unit of monthly usage for an organization.
 *
 * Uses a single conditional MongoDB update so two concurrent requests can never
 * both cross the monthly limit boundary: the `$lt` guard and the `$inc` are one
 * document operation.
 *
 * @param {string} orgId
 * @returns {Promise<{ ok: boolean, current: number|null, limit: number|null }>}
 *   ok:false means the limit is already reached (nothing was incremented).
 */
const reserveMonthlyLog = async (orgId) => {
  const org = await Organization.findOneAndUpdate(
    { _id: orgId, $expr: { $lt: ['$currentMonthlyLogs', '$monthlyLogLimit'] } },
    { $inc: { currentMonthlyLogs: 1 } },
    { new: true, projection: { currentMonthlyLogs: 1, monthlyLogLimit: 1 } }
  )

  if (!org) {
    const existing = await Organization.findById(orgId).select('currentMonthlyLogs monthlyLogLimit').lean()
    return { ok: false, current: existing?.currentMonthlyLogs ?? null, limit: existing?.monthlyLogLimit ?? null }
  }
  return { ok: true, current: org.currentMonthlyLogs, limit: org.monthlyLogLimit }
}

/** Give a reserved unit back (used when a reserved request never reaches a provider). */
const releaseMonthlyLog = async (orgId) => {
  await Organization.findOneAndUpdate(
    { _id: orgId, currentMonthlyLogs: { $gt: 0 } },
    { $inc: { currentMonthlyLogs: -1 } }
  ).catch(() => {})
}

module.exports = { reserveMonthlyLog, releaseMonthlyLog }
