/**
 * demo-seed.js — populate Zyra with SAFE synthetic data for a live demo.
 *
 *   npm run demo:seed
 *
 * Creates two demo organisations (so multi-tenant isolation can be shown):
 *   • "Zyra Demo Co"  — the org you present from  (demoMode ON)
 *   • "Acme Rival Inc" — a second tenant, to prove data isolation
 *
 * For each it creates verified admin/developer/viewer users, an API key, and a
 * spread of interactions over the last 14 days that run through the REAL
 * pipeline (securityAnalyzer → riskEngine → RiskReport / Notification). Only the
 * timestamps are backdated afterwards.
 *
 * Everything created is tagged `isDemo: true`. `npm run demo:reset` removes only
 * tagged data and never touches real tenants.
 *
 * NO real people, NO real PII, NO real API keys.
 */
require('dotenv').config()
const mongoose = require('mongoose')
const crypto = require('crypto')

const User = require('../src/models/User')
const Organization = require('../src/models/Organization')
const ApiKey = require('../src/models/ApiKey')
const InteractionLog = require('../src/models/InteractionLog')
const RiskReport = require('../src/models/RiskReport')
const Notification = require('../src/models/Notification')
const AuditLog = require('../src/models/AuditLog')
const { processLogJob } = require('../src/workers/logWorker')
const { processRiskJob } = require('../src/workers/riskWorker')
const S = require('./demo-scenarios')

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo-password-123'
const DAY = 24 * 60 * 60 * 1000
const rand = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const MODELS = [
  { model: 'gpt-4o', provider: 'openai' },
  { model: 'gpt-4o-mini', provider: 'openai' },
  { model: 'claude-sonnet-4-6', provider: 'anthropic' },
  { model: 'claude-haiku-4-5', provider: 'anthropic' },
  { model: 'llama-3.3-70b-versatile', provider: 'groq' },
  { model: 'gemini-2.0-flash', provider: 'gemini' },
]

const NORMAL_PROMPTS = [
  'Summarize the key points of the quarterly sales report.',
  'What is the capital of France?',
  'Write a friendly reminder email about the team standup.',
  'Explain photosynthesis in simple terms.',
  'Translate "good morning" to Spanish.',
  'Give me three ideas for a blog post about remote work.',
  'What is the time complexity of binary search?',
  'Draft a short thank-you note to a customer.',
]

async function createOrg ({ name, demoMode }) {
  const org = await Organization.create({
    name,
    plan: 'pro',
    monthlyLogLimit: 100000,
    demoMode,
    isDemo: true,
    optimizer: { autoOptimize: true, qualityTier: 'economy', costAlertThreshold: 50 },
    reliability: { enableRetry: true, maxRetries: 2, fallbackOrder: ['openai', 'anthropic', 'groq', 'gemini'] },
    policies: {
      blockInjection: true,
      blockPII: true,
      blockJailbreak: false, // leave off so jailbreaks flow through and get risk-scored in the demo
      maxTokensPerRequest: 2000,
      sensitiveKeywords: ['project titan', 'acquisition'],
    },
  })

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const users = []
  for (const role of ['admin', 'developer', 'viewer']) {
    users.push(await User.create({
      orgId: org._id,
      name: `Demo ${role[0].toUpperCase()}${role.slice(1)}`,
      email: `${role}@${slug}.demo`,
      passwordHash: DEMO_PASSWORD,
      role,
      isEmailVerified: true,
    }))
  }

  const raw = `sk-live-${crypto.randomBytes(24).toString('hex')}`
  await ApiKey.create({
    orgId: org._id,
    name: 'demo-seed key',
    prefix: raw.slice(0, 16),
    keyHash: crypto.createHash('sha256').update(raw).digest('hex'),
    createdBy: users[0]._id,
  })

  await AuditLog.create([
    { orgId: org._id, userId: users[0]._id, actorEmail: users[0].email, actorRole: 'admin', category: 'auth', action: 'login' },
    { orgId: org._id, userId: users[0]._id, actorEmail: users[0].email, actorRole: 'admin', category: 'api_key', action: 'api_key.created', targetType: 'ApiKey', meta: { name: 'demo-seed key' } },
    { orgId: org._id, userId: users[0]._id, actorEmail: users[0].email, actorRole: 'admin', category: 'policy', action: 'policy.updated', meta: { fields: ['blockInjection', 'blockPII'] } },
  ])

  return { org, users, apiKey: raw }
}

async function seedInteraction (org, { prompt, model, provider, userId, cost, daysAgo, wasOptimized, originalModel, originalCost, savings, statusCode, blocked, blockReason }) {
  const log = await processLogJob({
    data: {
      orgId: org._id.toString(),
      userId,
      model,
      provider,
      prompt,
      response: blocked
        ? `[BLOCKED pre-flight: ${blockReason} — request never sent to a provider]`
        : 'Simulated response from Zyra demo mode. No external LLM was called; the interaction is logged, risk-scored and cost-estimated exactly like a real request.',
      tokens: (() => { const p = Math.round(rand(40, 400)), c = Math.round(rand(30, 600)); return { prompt: p, completion: c, total: p + c } })(),
      cost,
      latency: Math.round(rand(180, 1400)),
      statusCode: statusCode || (blocked ? 403 : 200),
      simulated: true,
      blocked: !!blocked,
      blockReason: blockReason || null,
      optimizer: wasOptimized
        ? { originalModel, optimizedModel: model, originalCost: originalCost || cost + savings, savings, wasOptimized: true, complexity: pick(['simple', 'standard']) }
        : { wasOptimized: false },
      reliability: { retryCount: 0, fallbackUsed: false, fallbackProvider: null },
    },
  }, { enqueueRisk: false })
  await processRiskJob({ data: { logId: log._id.toString() } })

  // Backdate via the native driver so Mongoose's timestamps plugin doesn't
  // overwrite createdAt back to now.
  const ts = new Date(Date.now() - daysAgo * DAY - rand(0, DAY))
  await InteractionLog.collection.updateOne({ _id: log._id }, { $set: { createdAt: ts } })
  await RiskReport.collection.updateOne({ logId: log._id }, { $set: { createdAt: ts } })
  await Notification.collection.updateMany({ logId: log._id }, { $set: { createdAt: ts } })
  return log
}

async function seedTraffic (org, { users, volume, includeAttacks }) {
  const uids = users.map((u) => `USR-${String(u._id).slice(-4)}`)
  let n = 0

  // Normal traffic spread across the period
  for (let i = 0; i < volume; i++) {
    const m = pick(MODELS)
    const optimized = Math.random() < 0.55
    const cost = parseFloat(rand(0.0004, 0.02).toFixed(6))
    // For optimised requests the gpt-4o baseline would have cost 2–5x more.
    const originalCost = optimized ? parseFloat((cost * rand(2, 5)).toFixed(6)) : 0
    await seedInteraction(org, {
      prompt: pick(NORMAL_PROMPTS),
      model: m.model,
      provider: m.provider,
      userId: pick(uids),
      cost,
      daysAgo: rand(0, 14),
      wasOptimized: optimized,
      originalModel: optimized ? 'gpt-4o' : null,
      originalCost,
      savings: optimized ? parseFloat((originalCost - cost).toFixed(6)) : 0,
    })
    n++
  }

  if (!includeAttacks) return n

  // A handful of each attack type, recent
  // blockReason mirrors what the org's pre-flight policy would do (blockInjection
  // + blockPII are on in the demo org; blockJailbreak is off).
  const attacks = [
    { s: S.injection, count: 4, blockReason: 'injection' },
    { s: S.jailbreak, count: 4, blockReason: null },
    { s: S.pii, count: 3, blockReason: 'pii' },
    { s: S.sensitive, count: 3, blockReason: null },
    { s: S.abuse, count: 3, blockReason: null },
    { s: S.combined, count: 3, blockReason: 'injection' }, // each exceeds risk 80 → 3 admin notifications
  ]
  for (const { s, count, blockReason } of attacks) {
    for (let i = 0; i < count; i++) {
      const m = pick(MODELS)
      await seedInteraction(org, {
        prompt: s.prompt,
        model: m.model,
        provider: m.provider,
        userId: pick(uids),
        cost: blockReason ? 0 : parseFloat(rand(0.0005, 0.01).toFixed(6)),
        daysAgo: rand(0, 6),
        blocked: !!blockReason,
        blockReason,
      })
      n++
    }
  }
  return n
}

async function main () {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to', process.env.MONGO_URI)

  // Always start from a clean slate — remove any previous demo data first
  // (never touches real tenants; only isDemo:true orgs).
  const prev = await Organization.find({ isDemo: true }).select('_id')
  if (prev.length > 0) {
    const ids = prev.map((o) => o._id)
    await Promise.all([
      InteractionLog.deleteMany({ orgId: { $in: ids } }),
      RiskReport.deleteMany({ orgId: { $in: ids } }),
      Notification.deleteMany({ orgId: { $in: ids } }),
      AuditLog.deleteMany({ orgId: { $in: ids } }),
      ApiKey.deleteMany({ orgId: { $in: ids } }),
      User.deleteMany({ orgId: { $in: ids } }),
      Organization.deleteMany({ _id: { $in: ids } }),
    ])
    console.log(`Cleared ${prev.length} existing demo org(s).`)
  }

  const demo = await createOrg({ name: 'Zyra Demo Co', demoMode: true })
  const rival = await createOrg({ name: 'Acme Rival Inc', demoMode: true })

  console.log('Seeding interaction traffic (real pipeline)...')
  const n1 = await seedTraffic(demo.org, { users: demo.users, volume: 60, includeAttacks: true })
  const n2 = await seedTraffic(rival.org, { users: rival.users, volume: 25, includeAttacks: false })

  const notifs = await Notification.countDocuments({ orgId: demo.org._id })

  console.log('\n═════════════════════════════════════════════════════')
  console.log('  ZYRA DEMO DATA SEEDED')
  console.log('═════════════════════════════════════════════════════')
  console.log(`  Demo Co   : ${n1} interactions · ${notifs} admin notification(s)`)
  console.log(`  Rival Inc : ${n2} interactions (isolation test tenant)`)
  console.log('  ─────────────────────────────────────────────────')
  console.log('  PRESENT AS  (Zyra Demo Co):')
  console.log(`    admin    : admin@zyrademoco.demo    / ${DEMO_PASSWORD}`)
  console.log(`    developer: developer@zyrademoco.demo / ${DEMO_PASSWORD}`)
  console.log(`    viewer   : viewer@zyrademoco.demo    / ${DEMO_PASSWORD}`)
  console.log(`    API key  : ${demo.apiKey}`)
  console.log(`    org id   : ${demo.org._id}`)
  console.log('  OTHER TENANT (Acme Rival Inc):')
  console.log(`    admin    : admin@acmerivalinc.demo  / ${DEMO_PASSWORD}`)
  console.log(`    API key  : ${rival.apiKey}`)
  console.log('  ─────────────────────────────────────────────────')
  console.log('  Demo mode is ON: playground works with NO provider keys.')
  console.log('═════════════════════════════════════════════════════\n')

  await mongoose.disconnect()
}

main().catch((err) => { console.error(err); process.exit(1) })
