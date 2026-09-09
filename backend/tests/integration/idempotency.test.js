const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const nock = require('nock')

const {
  connectDb, clearDb, disconnectDb, createOrgWithKey, fakeProviderKeys,
  initTestRedis, flushTestRedis,
} = require('../helpers')
const app = require('../../src/app')

const OPENAI = 'https://api.openai.com'
let redisUp = false

test.before(async () => {
  await connectDb()
  redisUp = await initTestRedis()
})
test.beforeEach(async () => { await clearDb(); await flushTestRedis(); nock.cleanAll() })
test.after(async () => { nock.cleanAll(); await disconnectDb() })

const body = (content) => ({
  id: `chatcmpl-${content}`, object: 'chat.completion', model: 'gpt-4o',
  choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
})

const send = (apiKey, key, content = 'hi') => request(app)
  .post('/v1/chat/completions')
  .set('x-zyra-api-key', apiKey)
  .set('Idempotency-Key', key)
  .send({ model: 'gpt-4o', messages: [{ role: 'user', content }] })

test('same Idempotency-Key twice → provider called once, same body returned', async (t) => {
  if (!redisUp) return t.skip('Redis not available')
  const { apiKey } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })
  const scope = nock(OPENAI).post('/v1/chat/completions').once().reply(200, body('first'))

  const r1 = await send(apiKey, 'key-A')
  const r2 = await send(apiKey, 'key-A')

  assert.equal(r1.status, 200)
  assert.equal(r2.status, 200)
  assert.equal(r1.body.choices[0].message.content, 'first')
  assert.equal(r2.body.choices[0].message.content, 'first')
  assert.ok(scope.isDone())
  assert.equal(nock.pendingMocks().length, 0)
})

test('concurrent duplicates → provider called once', async (t) => {
  if (!redisUp) return t.skip('Redis not available')
  const { apiKey } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })
  let hits = 0
  nock(OPENAI).post('/v1/chat/completions').twice().reply(() => {
    hits++
    return [200, body('concurrent')]
  })

  const [a, b] = await Promise.all([send(apiKey, 'key-C'), send(apiKey, 'key-C')])
  const statuses = [a.status, b.status].sort()

  assert.equal(hits, 1, 'provider should be hit exactly once')
  // one wins with 200; the other either replays 200 or gets 409 while in flight
  assert.ok(statuses[1] === 200)
  assert.ok(statuses[0] === 200 || statuses[0] === 409)
})

test('different keys → provider called for each', async (t) => {
  if (!redisUp) return t.skip('Redis not available')
  const { apiKey } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })
  nock(OPENAI).post('/v1/chat/completions').twice().reply(200, body('x'))

  const r1 = await send(apiKey, 'key-D1')
  const r2 = await send(apiKey, 'key-D2')
  assert.equal(r1.status, 200)
  assert.equal(r2.status, 200)
  assert.equal(nock.pendingMocks().length, 0)
})

test('same key, different body → 422', async (t) => {
  if (!redisUp) return t.skip('Redis not available')
  const { apiKey } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })
  nock(OPENAI).post('/v1/chat/completions').once().reply(200, body('e'))

  const r1 = await send(apiKey, 'key-E', 'first question')
  const r2 = await send(apiKey, 'key-E', 'a totally different question')
  assert.equal(r1.status, 200)
  assert.equal(r2.status, 422)
})

test('expired/absent result → new key behaves normally', async (t) => {
  if (!redisUp) return t.skip('Redis not available')
  const { apiKey } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })
  nock(OPENAI).post('/v1/chat/completions').once().reply(200, body('fresh'))
  const r = await send(apiKey, 'key-F-' + Date.now())
  assert.equal(r.status, 200)
})
