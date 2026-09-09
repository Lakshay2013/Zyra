const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const { connectDb, clearDb, clearQueues, disconnectDb, createOrgWithKey } = require('../helpers')
const app = require('../../src/app')
const InteractionLog = require('../../src/models/InteractionLog')
const { processLogJob } = require('../../src/workers/logWorker')
const { getLogQueue } = require('../../src/config/queue')

test.before(connectDb)
test.beforeEach(async () => { await clearDb(); await clearQueues() })
test.after(async () => { await clearQueues(); await disconnectDb() })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// universalLog is fire-and-forget (responds 202, queues after). Wait for the job
// to land, then run it through the real log worker.
async function drainLogQueue () {
  const q = getLogQueue()
  for (let i = 0; i < 20; i++) {
    const jobs = await q.getJobs(['waiting', 'delayed', 'active', 'paused'])
    if (jobs.length) {
      for (const j of jobs) {
        await processLogJob({ data: j.data }, { enqueueRisk: false })
        await j.remove()
      }
      return
    }
    await sleep(100)
  }
}

test('POST /v1/log (explicit .log() shape) stores a MASKED prompt + response', async () => {
  const { apiKey } = await createOrgWithKey()

  const res = await request(app)
    .post('/v1/log')
    .set('x-zyra-api-key', apiKey)
    .send({
      userId: 'USR001',
      prompt: 'My email is jane@example.com and card 4111 1111 1111 1111',
      response: 'Noted, jane@example.com.',
      model: 'gpt-4o',
      promptTokens: 20,
      completionTokens: 8,
    })

  assert.equal(res.status, 202)
  assert.equal(res.body.accepted, true)

  await drainLogQueue()

  const log = await InteractionLog.findOne({ userId: 'USR001' }).lean()
  assert.ok(log, 'interaction log should be created')
  assert.equal(log.model, 'gpt-4o')
  assert.equal(log.sdk_language, 'node')
  assert.ok(!log.prompt.includes('jane@example.com'), 'raw email must be masked')
  assert.ok(!log.prompt.includes('4111 1111 1111 1111'), 'raw card must be masked')
  assert.ok(!log.response.includes('jane@example.com'), 'response must be masked too')
  assert.ok(log.flags.includes('pii'))
  assert.equal(log.tokens.total, 28)
})

test('POST /v1/log (canonical telemetry shape) still works', async () => {
  const { apiKey } = await createOrgWithKey()

  const res = await request(app)
    .post('/v1/log')
    .set('x-zyra-api-key', apiKey)
    .send({
      sdk_language: 'python',
      provider: 'openai',
      model_requested: 'gpt-4o',
      model_routed_to: 'gpt-4o-mini',
      prompt_tokens: 100,
      completion_tokens: 50,
      latency_ms: 320,
      status: 'success',
    })

  assert.equal(res.status, 202)
  await drainLogQueue()

  const log = await InteractionLog.findOne({ sdk_language: 'python' }).lean()
  assert.ok(log)
  assert.equal(log.model, 'gpt-4o-mini')
  assert.equal(log.optimizer.wasOptimized, true)
  assert.equal(log.tokens.total, 150)
})

test('POST /v1/log requires a valid API key', async () => {
  const res = await request(app).post('/v1/log').send({ prompt: 'x', response: 'y', model: 'gpt-4o' })
  assert.equal(res.status, 401)
})
