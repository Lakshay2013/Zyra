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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const send = (apiKey) => request(app)
  .post('/v1/chat/completions')
  .set('x-zyra-api-key', apiKey)
  .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'identical prompt' }] })

test('same prompt+model from two different orgs → cache is not shared across tenants', async (t) => {
  if (!redisUp) return t.skip('Redis not available')

  const orgA = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })
  const orgB = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })

  nock(OPENAI).post('/v1/chat/completions').reply(200, body('org-a-response'))
  nock(OPENAI).post('/v1/chat/completions').reply(200, body('org-b-response'))

  const rA = await send(orgA.apiKey)
  const rB = await send(orgB.apiKey)

  assert.equal(rA.status, 200)
  assert.equal(rB.status, 200)
  // If the cache key were not org-scoped, org B would receive org A's cached
  // response instead of hitting the (second) provider mock.
  assert.equal(rA.body.choices[0].message.content, 'org-a-response')
  assert.equal(rB.body.choices[0].message.content, 'org-b-response')
  assert.equal(nock.pendingMocks().length, 0, 'both provider mocks should have been consumed')
})

test('same prompt+model, same org → second request is served from cache', async (t) => {
  if (!redisUp) return t.skip('Redis not available')

  const org = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })
  const scope = nock(OPENAI).post('/v1/chat/completions').once().reply(200, body('cached'))

  const r1 = await send(org.apiKey)
  await sleep(100) // cache write after the response is sent is fire-and-forget
  const r2 = await send(org.apiKey)

  assert.equal(r1.status, 200)
  assert.equal(r2.status, 200)
  assert.equal(r2.body.choices[0].message.content, 'cached')
  assert.ok(scope.isDone(), 'provider should only be called once — second request hits the cache')
})
