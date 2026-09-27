const AuditLog = require('../models/AuditLog')

/**
 * Fire-and-forget audit record. Never throws — an audit write failure must not
 * break the action being audited.
 *
 * @param {object} entry
 * @param {string} entry.orgId
 * @param {string} [entry.userId]
 * @param {string} [entry.actorEmail]
 * @param {string} [entry.actorRole]
 * @param {string} entry.category  auth|api_key|organization|provider|policy|billing|security
 * @param {string} entry.action
 * @param {'success'|'failure'} [entry.outcome]
 * @param {string} [entry.targetType]
 * @param {string} [entry.targetId]
 * @param {object} [entry.req]     express req — pulls ip / user-agent
 * @param {object} [entry.meta]
 */
const recordAudit = (entry = {}) => {
  try {
    const { req, ...rest } = entry
    const doc = {
      ...rest,
      ip: req?.ip || req?.headers?.['x-forwarded-for'] || null,
      userAgent: req?.headers?.['user-agent'] || null,
    }
    // Do not await — best effort.
    AuditLog.create(doc).catch((err) => {
      if (process.env.NODE_ENV !== 'test') console.error('[audit] write failed:', err.message)
    })
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') console.error('[audit] error:', err.message)
  }
}

module.exports = { recordAudit }
