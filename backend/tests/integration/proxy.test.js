const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const nock = require('nock')

const { connectDb, clearDb, disconnectDb, createOrgWithKey, fakeProviderKeys } = require('../helpers')
const app = require('../../src/app')

test.before(connectDb)
test.beforeEach(async () => { await clearDb(); nock.cleanAll() })
test.after(async () => { nock.cleanAll(); nock.enableNetConnect(); await disconnectDb() })

const OPENAI = 'https://api.openai.com'
const chatResponse = (model = 'gpt-4o-mini', content = 'Hello from the mock provider!') => ({
  id: 'chatcmpl-mock', object: 'chat.completion', model,
  choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
})

function mockOpenAI (times = 1, body = chatResponse()) {
  return nock(OPENAI).post('/v1/chat/completions').times(times).reply(200, body)
}

test('valid chat completion is proxied and returns provider body', async () => {
  const { apiKey } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['openai']) })
  const scope = mockOpenAI()

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] })

  assert.equal(res.status, 200)
  assert.equal(res.body.choices[0].message.content, 'Hello from the mock provider!')
  assert.ok(scope.isDone())
})

test('missing API key → 401', async () => {
  const res = await request(app).post('/v1/chat/completions').send({ model: 'auto', messages: [] })
  assert.equal(res.status, 401)
})

test('invalid API key → 401', async () => {
  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', 'sk-live-notreal')
    .send({ model: 'auto', messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(res.status, 401)
})

test('no provider key configured → 400 configuration_error, provider not called', async () => {
  const { apiKey } = await createOrgWithKey({ providerKeys: {} })
  const scope = nock(OPENAI).post('/v1/chat/completions').reply(200, chatResponse())

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] })

  assert.equal(res.status, 400)
  assert.equal(res.body.error.type, 'configuration_error')
  assert.equal(scope.isDone(), false)
})

test('debug headers expose routing decision', async () => {
  const { apiKey } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['openai']),
    optimizer: { autoOptimize: true, qualityTier: 'standard' },
  })
  mockOpenAI(1, chatResponse('gpt-4o-mini'))

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .set('x-zyra-debug', 'true')
    .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] })

  assert.equal(res.status, 200)
  assert.equal(res.headers['x-zyra-provider'], 'openai')
  assert.ok(res.headers['x-zyra-model'])
  assert.ok(res.headers['x-zyra-complexity'])
})

test('model:auto routes through the optimizer to a cheaper model', async () => {
  const { apiKey } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['openai']),
    optimizer: { autoOptimize: true, qualityTier: 'economy' },
  })
  let sentBody
  nock(OPENAI).post('/v1/chat/completions').reply(function (uri, body) {
    sentBody = body
    return [200, chatResponse(body.model)]
  })

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .set('x-zyra-debug', 'true')
    .send({ model: 'auto', messages: [{ role: 'user', content: 'hi' }] })

  assert.equal(res.status, 200)
  assert.notEqual(sentBody.model, 'auto')
  assert.notEqual(sentBody.model, 'gpt-4o') // downgraded from the gpt-4o baseline
})

test('policy: maxTokensPerRequest is clamped before forwarding', async () => {
  const { apiKey } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['openai']),
    policies: { maxTokensPerRequest: 100, blockInjection: true },
  })
  let sentBody
  nock(OPENAI).post('/v1/chat/completions').reply(function (uri, body) {
    sentBody = body
    return [200, chatResponse()]
  })

  await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }], max_tokens: 9000 })

  assert.equal(sentBody.max_tokens, 100)
})
