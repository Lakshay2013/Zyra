const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const nock = require('nock')

const { connectDb, clearDb, disconnectDb, createOrgWithKey, fakeProviderKeys } = require('../helpers')
const app = require('../../src/app')

test.before(connectDb)
test.beforeEach(async () => { await clearDb(); nock.cleanAll() })
test.after(async () => { nock.cleanAll(); await disconnectDb() })

const OPENAI = 'https://api.openai.com'
const ANTHROPIC = 'https://api.anthropic.com'

const openAiOk = {
  id: 'x', object: 'chat.completion', model: 'gpt-4o',
  choices: [{ index: 0, message: { role: 'assistant', content: 'primary ok' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
}
const anthropicOk = {
  id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-sonnet-4-6',
  content: [{ type: 'text', text: 'fallback ok' }],
  usage: { input_tokens: 5, output_tokens: 3 },
}

test('retryable 429 then 200 → request succeeds after retry', async () => {
  const { apiKey } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['openai']),
    reliability: { enableRetry: true, maxRetries: 2, fallbackOrder: [] },
  })
  nock(OPENAI).post('/v1/chat/completions').reply(429, { error: { message: 'rate limited' } })
  nock(OPENAI).post('/v1/chat/completions').reply(200, openAiOk)

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .set('x-zyra-debug', 'true')
    .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] })

  assert.equal(res.status, 200)
  assert.equal(res.body.choices[0].message.content, 'primary ok')
})

test('non-retryable 401 → fails fast, no retry', async () => {
  const { apiKey } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['openai']),
    reliability: { enableRetry: true, maxRetries: 3, fallbackOrder: [] },
  })
  const scope = nock(OPENAI).post('/v1/chat/completions').reply(401, { error: { message: 'bad key' } })
  // A second interceptor that must NOT be consumed
  const extra = nock(OPENAI).post('/v1/chat/completions').reply(200, openAiOk)

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] })

  assert.equal(res.status, 401)
  assert.ok(scope.isDone())
  assert.equal(extra.isDone(), false, 'must not retry a 401')
})

test('primary provider fails → fallback provider answers', async () => {
  const { apiKey } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['openai', 'anthropic']),
    reliability: { enableRetry: true, maxRetries: 1, fallbackOrder: ['openai', 'anthropic'] },
  })
  nock(OPENAI).post('/v1/chat/completions').times(2).reply(503, { error: { message: 'down' } })
  nock(ANTHROPIC).post('/v1/messages').reply(200, anthropicOk)

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .set('x-zyra-debug', 'true')
    .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] })

  assert.equal(res.status, 200)
  assert.equal(res.headers['x-zyra-fallback'], 'anthropic')
})
