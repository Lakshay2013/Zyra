const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const nock = require('nock')

const { connectDb, clearDb, disconnectDb, createOrgWithKey, fakeProviderKeys } = require('../helpers')
const app = require('../../src/app')

test.before(connectDb)
test.beforeEach(async () => { await clearDb(); nock.cleanAll() })
test.after(async () => { nock.cleanAll(); await disconnectDb() })

test('POST /api/org/providers/test reports real per-provider results', async () => {
  const { token } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai', 'anthropic', 'gemini']) })

  nock('https://api.openai.com').post('/v1/chat/completions').reply(200, {
    choices: [{ message: { role: 'assistant', content: 'x' } }], usage: { prompt_tokens: 1, completion_tokens: 1 },
  })
  nock('https://api.anthropic.com').post('/v1/messages').reply(401, { error: { message: 'invalid x-api-key' } })
  nock('https://generativelanguage.googleapis.com').post(/:generateContent/).reply(200, {
    candidates: [{ content: { parts: [{ text: 'x' }] } }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
  })

  const res = await request(app).post('/api/org/providers/test').set('Authorization', `Bearer ${token}`)
  assert.equal(res.status, 200)

  const byId = Object.fromEntries(res.body.results.map((r) => [r.provider, r]))
  assert.equal(byId.openai.ok, true)
  assert.ok(byId.openai.latencyMs >= 0)
  assert.equal(byId.anthropic.ok, false)
  assert.equal(byId.anthropic.status, 401)
  assert.match(byId.anthropic.error, /x-api-key/)
  assert.equal(byId.gemini.ok, true)
  assert.equal(byId.groq.error, 'not configured')
  assert.equal(res.body.summary.tested, 3)
  assert.equal(res.body.summary.passed, 2)
})

test('provider test with no keys configured returns all "not configured"', async () => {
  const { token } = await createOrgWithKey({ providerKeys: {} })
  const res = await request(app).post('/api/org/providers/test').set('Authorization', `Bearer ${token}`)
  assert.equal(res.status, 200)
  assert.equal(res.body.summary.tested, 0)
  assert.ok(res.body.results.every((r) => r.error === 'not configured'))
})
