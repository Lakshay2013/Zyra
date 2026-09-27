/**
 * demo-reset.js — remove ONLY demo-tagged data.
 *
 *   npm run demo:reset
 *
 * Deletes organisations with `isDemo: true` and everything belonging to them
 * (users, API keys, interaction logs, risk reports, notifications, audit logs).
 * Real tenants are never touched.
 */
require('dotenv').config()
const mongoose = require('mongoose')

const User = require('../src/models/User')
const Organization = require('../src/models/Organization')
const ApiKey = require('../src/models/ApiKey')
const InteractionLog = require('../src/models/InteractionLog')
const RiskReport = require('../src/models/RiskReport')
const Notification = require('../src/models/Notification')
const AuditLog = require('../src/models/AuditLog')

async function main () {
  await mongoose.connect(process.env.MONGO_URI)

  const demoOrgs = await Organization.find({ isDemo: true }).select('_id name')
  if (demoOrgs.length === 0) {
    console.log('No demo organisations found. Nothing to reset.')
    return mongoose.disconnect()
  }
  const ids = demoOrgs.map((o) => o._id)
  console.log('Removing demo orgs:', demoOrgs.map((o) => o.name).join(', '))

  const res = await Promise.all([
    InteractionLog.deleteMany({ orgId: { $in: ids } }),
    RiskReport.deleteMany({ orgId: { $in: ids } }),
    Notification.deleteMany({ orgId: { $in: ids } }),
    AuditLog.deleteMany({ orgId: { $in: ids } }),
    ApiKey.deleteMany({ orgId: { $in: ids } }),
    User.deleteMany({ orgId: { $in: ids } }),
    Organization.deleteMany({ _id: { $in: ids } }),
  ])

  const [logs, reports, notifs, audits, keys, users, orgs] = res.map((r) => r.deletedCount)
  console.log(`Deleted: ${orgs} orgs, ${users} users, ${keys} keys, ${logs} logs, ${reports} risk reports, ${notifs} notifications, ${audits} audit entries.`)

  await mongoose.disconnect()
}

main().catch((err) => { console.error(err); process.exit(1) })
