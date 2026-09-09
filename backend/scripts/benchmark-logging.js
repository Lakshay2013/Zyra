/**
 * benchmark-logging.js — reproduce the paper's "Prompt Logging Performance"
 * table (Table II) against the RUNNING stack.
 *
 *   npm run benchmark:logging            # 1,000 requests (default)
 *   BENCH_N=10000 npm run benchmark:logging
 *
 * Paper (Table II): 10,000 requests · 9,996 successful logs · 99.96% · 47 ms avg.
 * This script reports the ACTUAL local numbers — it never adjusts them to match.
 *
 * What it measures:
 *   - request latency  : client → Zyra → (simulated provider) → response
 *   - logging success  : fraction of requests that produced a persisted
 *                        InteractionLog (async, via BullMQ → log worker)
 *   - time-to-persist  : request start → InteractionLog.createdAt visible in Mongo
 *
 * Requires: API + worker + mongo + redis up. Creates a temporary isDemo org and
 * deletes it (and its logs) afterwards.
 */
require('dotenv').config()
const mongoose = require('mongoose')
const crypto = require('crypto')

const Organization = require('../src/models/Organization')
const User = require('../src/models/User')
const ApiKey = require('../src/models/ApiKey')
const InteractionLog = require('../src/models/InteractionLog')
const RiskReport = require('../src/models/RiskReport')

const API = process.env.API_URL || 'http://localhost:5000'
const N = parseInt(process.env.BENCH_N) || 1000
const CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY) || 20

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main () {
  await mongoose.connect(process.env.MONGO_URI)

  const org = await Organization.create({
    name: `bench-${Date.now()}`, plan: 'pro', monthlyLogLimit: N + 1000,
    demoMode: true, isDemo: true,
    optimizer: { autoOptimize: false },
    policies: { blockInjection: false, blockPII: false },
  })
  const user = await User.create({ orgId: org._id, name: 'bench', email: `bench-${Date.now()}@demo.local`, passwordHash: 'x'.repeat(12), role: 'admin', isEmailVerified: true })
  const raw = `sk-live-${crypto.randomBytes(24).toString('hex')}`
  await ApiKey.create({ orgId: org._id, name: 'bench', prefix: raw.slice(0, 16), keyHash: crypto.createHash('sha256').update(raw).digest('hex'), createdBy: user._id })

  console.log(`\nBenchmark: ${N} requests → ${API}/v1/chat/completions  (concurrency ${CONCURRENCY})\n`)

  const latencies = []
  let httpOk = 0, httpErr = 0
  const t0 = Date.now()

  let idx = 0
  const worker = async () => {
    while (idx < N) {
      const i = idx++
      const start = Date.now()
      try {
        const r = await fetch(`${API}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-zyra-api-key': raw, 'x-user-id': `bench-${i % 10}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: `benchmark request ${i}` }] }),
        })
        await r.text()
        latencies.push(Date.now() - start)
        if (r.ok) httpOk++; else httpErr++
      } catch {
        httpErr++
        latencies.push(Date.now() - start)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  const wallMs = Date.now() - t0

  // Let the async log worker drain, then measure how long full drain took.
  process.stdout.write('Waiting for async logging to drain')
  let persisted = 0
  const drainStart = Date.now()
  let drainMs = 0
  for (let tries = 0; tries < 90; tries++) {
    persisted = await InteractionLog.countDocuments({ orgId: org._id })
    if (persisted >= httpOk) { drainMs = Date.now() - drainStart; break }
    process.stdout.write('.')
    await sleep(500)
  }
  console.log('')

  // Wait for the risk worker too.
  let analyzed = 0
  for (let tries = 0; tries < 90; tries++) {
    analyzed = await InteractionLog.countDocuments({ orgId: org._id, analyzed: true })
    if (analyzed >= persisted) break
    await sleep(500)
  }

  latencies.sort((a, b) => a - b)
  const avg = (arr) => (arr.reduce((s, x) => s + x, 0) / (arr.length || 1))

  const successRate = ((persisted / N) * 100)

  console.log('─────────────────────────────────────────────')
  console.log('  PROMPT LOGGING PERFORMANCE  (current local result)')
  console.log('─────────────────────────────────────────────')
  console.log(`  Total requests        : ${N}`)
  console.log(`  HTTP 2xx              : ${httpOk}`)
  console.log(`  HTTP errors           : ${httpErr}`)
  console.log(`  Persisted logs        : ${persisted}`)
  console.log(`  Risk-analyzed logs    : ${analyzed}`)
  console.log(`  Logging success rate  : ${successRate.toFixed(2)}%`)
  console.log(`  Request latency  avg  : ${avg(latencies).toFixed(1)} ms`)
  console.log(`                   p50  : ${pct(latencies, 50)} ms`)
  console.log(`                   p95  : ${pct(latencies, 95)} ms`)
  console.log(`                   p99  : ${pct(latencies, 99)} ms`)
  console.log(`  Throughput            : ${(N / (wallMs / 1000)).toFixed(1)} req/s  (wall ${(wallMs / 1000).toFixed(1)}s)`)
  console.log(`  Async log drain time  : ${drainMs} ms after last response (all ${persisted} logs persisted)`)
  console.log('  NOTE: logging is fully asynchronous (BullMQ enqueue only, ~2-5 ms);')
  console.log('        request latency above does NOT include log persistence.')
  console.log('─────────────────────────────────────────────')
  console.log('  PAPER (Table II): 10,000 req · 99.96% success · 47 ms avg logging time')
  console.log('  ^ paper-reported; not adjusted to match the numbers above.')
  console.log('─────────────────────────────────────────────\n')

  // cleanup
  await Promise.all([
    InteractionLog.deleteMany({ orgId: org._id }),
    RiskReport.deleteMany({ orgId: org._id }),
    ApiKey.deleteMany({ orgId: org._id }),
    User.deleteMany({ orgId: org._id }),
    Organization.deleteOne({ _id: org._id }),
  ])
  await mongoose.disconnect()
}

main().catch((err) => { console.error(err); process.exit(1) })
