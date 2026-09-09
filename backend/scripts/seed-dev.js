/**
 * seed-dev.js — create a verified admin user + organization + API key for local testing.
 *
 * Usage:  node scripts/seed-dev.js
 *
 * Prints a ready-to-use Zyra API key and a JWT for the dashboard API.
 * Safe to re-run: it upserts the demo user/org and always mints a fresh API key.
 */
require('dotenv').config()
const mongoose = require('mongoose')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const User = require('../src/models/User')
const Organization = require('../src/models/Organization')
const ApiKey = require('../src/models/ApiKey')

const DEMO_EMAIL = process.env.SEED_EMAIL || 'demo@zyra.local'
const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'demo-password-123'

async function main() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to', process.env.MONGO_URI)

  let user = await User.findOne({ email: DEMO_EMAIL })
  let org

  if (!user) {
    org = await Organization.create({
      name: 'Zyra Demo Org',
      plan: 'pro',
      monthlyLogLimit: 100000,
      optimizer: { autoOptimize: true, qualityTier: 'standard' },
      reliability: { enableRetry: true, maxRetries: 2, fallbackOrder: ['openai', 'anthropic', 'groq', 'gemini'] },
      policies: { blockInjection: true, blockPII: true, maxTokensPerRequest: 2000 },
    })
    user = await User.create({
      orgId: org._id,
      name: 'Demo Admin',
      email: DEMO_EMAIL,
      passwordHash: DEMO_PASSWORD,
      role: 'admin',
      isEmailVerified: true,
    })
    console.log('Created demo user + org')
  } else {
    org = await Organization.findById(user.orgId)
    user.isEmailVerified = true
    user.role = 'admin'
    await user.save()
    console.log('Reused existing demo user + org')
  }

  // Mint a fresh API key
  const raw = `sk-live-${crypto.randomBytes(24).toString('hex')}`
  const keyHash = crypto.createHash('sha256').update(raw).digest('hex')
  await ApiKey.create({
    orgId: org._id,
    name: `dev-seed ${new Date().toISOString().slice(0, 16)}`,
    prefix: raw.substring(0, 16),
    keyHash,
    createdBy: user._id,
  })

  const token = jwt.sign(
    { userId: user._id, orgId: org._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  console.log('\n─────────────────────────────────────────────')
  console.log('  ORG ID          :', org._id.toString())
  console.log('  USER            :', DEMO_EMAIL, '/', DEMO_PASSWORD)
  console.log('  ZYRA API KEY     :', raw)
  console.log('  DASHBOARD JWT    :', token)
  console.log('─────────────────────────────────────────────\n')

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
