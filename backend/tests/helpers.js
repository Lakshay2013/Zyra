/**
 * Shared test helpers.
 *
 * DB: uses a throwaway database on the local Mongo that `docker compose` starts.
 *     Override with MONGO_URI_TEST. Never point this at a real database — every
 *     run drops all collections.
 */
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64)
process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27018/zyra_test'
// Keep Redis-backed features (cache, idempotency) off by default so unit-style
// integration tests are deterministic. Idempotency tests opt back in.
process.env.REDIS_HOST = process.env.REDIS_HOST_TEST || '127.0.0.1'
process.env.REDIS_PORT = process.env.REDIS_PORT_TEST || '6380'

const mongoose = require('mongoose')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const Organization = require('../src/models/Organization')
const User = require('../src/models/User')
const ApiKey = require('../src/models/ApiKey')

async function connectDb () {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI)
  }
}

async function clearDb () {
  await connectDb()
  const collections = await mongoose.connection.db.collections()
  await Promise.all(collections.map((c) => c.deleteMany({})))
}

async function disconnectDb () {
  await mongoose.connection.close()
}

/**
 * Create an org + admin user + API key.
 * @param {object} orgOverrides - merged into the Organization document
 * @returns {{ org, user, apiKey, token }}
 */
async function createOrgWithKey (orgOverrides = {}) {
  const org = await Organization.create({
    name: 'Test Org',
    plan: 'pro',
    monthlyLogLimit: 1000,
    ...orgOverrides,
  })
  const user = await User.create({
    orgId: org._id,
    name: 'Test Admin',
    email: `admin_${crypto.randomBytes(4).toString('hex')}@test.local`,
    passwordHash: 'password12345',
    role: 'admin',
    isEmailVerified: true,
  })
  const raw = `sk-live-${crypto.randomBytes(24).toString('hex')}`
  const keyHash = crypto.createHash('sha256').update(raw).digest('hex')
  await ApiKey.create({
    orgId: org._id,
    name: 'test key',
    prefix: raw.slice(0, 16),
    keyHash,
    createdBy: user._id,
  })
  const token = jwt.sign(
    { userId: user._id, orgId: org._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
  return { org, user, apiKey: raw, token }
}

// A valid encrypted provider key blob (value doesn't matter — provider HTTP is mocked)
const { encrypt } = require('../src/utils/crypto')
function fakeProviderKeys (providers = ['openai']) {
  const keys = {}
  for (const p of providers) keys[p] = encrypt(`test-${p}-key`)
  return keys
}

const { initRedis, isRedisReady, getRedis } = require('../src/services/cacheLayer')

/** Connect Redis and wait until it is actually ready (or give up after ~3s). */
async function initTestRedis () {
  initRedis()
  const deadline = Date.now() + 3000
  while (!isRedisReady() && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50))
  }
  return isRedisReady()
}

async function flushTestRedis () {
  try { await getRedis().flushdb() } catch {}
}

module.exports = {
  connectDb, clearDb, disconnectDb, createOrgWithKey, fakeProviderKeys, mongoose,
  initTestRedis, flushTestRedis, isRedisReady,
}
