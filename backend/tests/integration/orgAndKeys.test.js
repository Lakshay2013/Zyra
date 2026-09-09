const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const nock = require('nock')

const { connectDb, clearDb, disconnectDb, createOrgWithKey, fakeProviderKeys } = require('../helpers')
const app = require('../../src/app')

test.before(connectDb)
test.beforeEach(async () => { await clearDb(); nock.cleanAll() })
test.after(async () => { nock.cleanAll(); await disconnectDb() })

const auth = (token) => ({ Authorization: `Bearer ${token}` })

test('API key lifecycle: create → authenticates proxy → revoke → 401', async () => {
  const { token } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })

  const created = await request(app).post('/api/keys').set(auth(token)).send({ name: 'ci-key' })
  assert.equal(created.status, 201)
  const raw = created.body.key
  assert.match(raw, /^sk-live-/)

  const list = await request(app).get('/api/keys').set(auth(token))
  assert.equal(list.status, 200)
  assert.ok(list.body.keys.every((k) => k.keyHash === undefined), 'raw hash never returned')

  nock('https://api.openai.com').post('/v1/chat/completions').reply(200, {
    id: 'x', choices: [{ message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  })
  const proxied = await request(app).post('/v1/chat/completions')
    .set('x-zyra-api-key', raw)
    .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(proxied.status, 200)

  const id = created.body.id
  const revoked = await request(app).delete(`/api/keys/${id}`).set(auth(token))
  assert.equal(revoked.status, 200)

  const afterRevoke = await request(app).post('/v1/chat/completions')
    .set('x-zyra-api-key', raw)
    .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(afterRevoke.status, 401)
})

test('optimizer settings: GET defaults, PUT persists, reflected on re-GET', async () => {
  const { token } = await createOrgWithKey()

  const g1 = await request(app).get('/api/org/optimizer').set(auth(token))
  assert.equal(g1.status, 200)
  assert.equal(g1.body.optimizer.autoOptimize, false)

  const put = await request(app).put('/api/org/optimizer').set(auth(token))
    .send({ autoOptimize: true, qualityTier: 'economy' })
  assert.equal(put.status, 200)
  assert.equal(put.body.optimizer.autoOptimize, true)

  const g2 = await request(app).get('/api/org/optimizer').set(auth(token))
  assert.equal(g2.body.optimizer.autoOptimize, true)
  assert.equal(g2.body.optimizer.qualityTier, 'economy')
})

test('reliability settings: PUT fallbackOrder persists and clamps maxRetries', async () => {
  const { token } = await createOrgWithKey()
  const put = await request(app).put('/api/org/reliability').set(auth(token))
    .send({ enableRetry: true, maxRetries: 99, fallbackOrder: ['anthropic', 'openai'] })
  assert.equal(put.status, 200)
  assert.equal(put.body.reliability.maxRetries, 5)
  assert.deepEqual(put.body.reliability.fallbackOrder, ['anthropic', 'openai'])
})

test('policies settings: PUT persists PII/injection/maxTokens', async () => {
  const { token } = await createOrgWithKey()
  const put = await request(app).put('/api/org/policies').set(auth(token))
    .send({ blockPII: true, blockInjection: false, maxTokensPerRequest: 1234 })
  assert.equal(put.status, 200)
  assert.equal(put.body.policies.blockPII, true)
  assert.equal(put.body.policies.blockInjection, false)
  assert.equal(put.body.policies.maxTokensPerRequest, 1234)

  const get = await request(app).get('/api/org/policies').set(auth(token))
  assert.equal(get.body.policies.blockPII, true)
})

test('non-admin cannot change optimizer settings', async () => {
  const { org } = await createOrgWithKey()
  const jwt = require('jsonwebtoken')
  const User = require('../../src/models/User')
  const dev = await User.create({ orgId: org._id, name: 'D', email: 'd@test.local', passwordHash: 'password12345', role: 'developer', isEmailVerified: true })
  const devToken = jwt.sign({ userId: dev._id, orgId: org._id, role: 'developer' }, process.env.JWT_SECRET)
  const r = await request(app).put('/api/org/optimizer').set(auth(devToken)).send({ autoOptimize: true })
  assert.equal(r.status, 403)
})
