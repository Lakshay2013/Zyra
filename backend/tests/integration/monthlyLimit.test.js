const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const nock = require('nock')

const { connectDb, clearDb, disconnectDb, createOrgWithKey, fakeProviderKeys } = require('../helpers')
const app = require('../../src/app')
const Organization = require('../../src/models/Organization')

test.before(connectDb)
test.beforeEach(async () => { await clearDb(); nock.cleanAll() })
test.after(async () => { nock.cleanAll(); await disconnectDb() })

const OPENAI = 'https://api.openai.com'
const okBody = {
  id: 'x', object: 'chat.completion', model: 'gpt-4o',
  choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
}
const send = (apiKey) => request(app)
  .post('/v1/chat/completions')
  .set('x-zyra-api-key', apiKey)
  .send({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] })

test('request past the monthly limit is rejected with 429', async () => {
  const { apiKey, org } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['openai']), monthlyLogLimit: 2, currentMonthlyLogs: 2,
  })
  const scope = nock(OPENAI).post('/v1/chat/completions').reply(200, okBody)
  const res = await send(apiKey)
  assert.equal(res.status, 429)
  assert.equal(scope.isDone(), false)
})

test('concurrent requests cannot both cross the limit boundary', async () => {
  // Limit is exactly 1 slot away. Fire 5 concurrent requests; only 1 may reach the provider.
  const { apiKey } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['openai']), monthlyLogLimit: 10, currentMonthlyLogs: 9,
  })
  let providerHits = 0
  nock(OPENAI).post('/v1/chat/completions').times(10).reply(() => {
    providerHits++
    return [200, okBody]
  })

  const results = await Promise.all(Array.from({ length: 5 }, () => send(apiKey)))
  const ok = results.filter((r) => r.status === 200).length
  const limited = results.filter((r) => r.status === 429).length

  assert.equal(ok, 1, 'exactly one request may succeed')
  assert.equal(limited, 4)
  assert.equal(providerHits, 1, 'provider hit exactly once')

  const org = await Organization.findOne().lean()
  assert.equal(org.currentMonthlyLogs, 10, 'counter lands exactly on the limit, never past it')
})

test('failed provider call refunds the reserved slot', async () => {
  const { apiKey } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['openai']), monthlyLogLimit: 10, currentMonthlyLogs: 0,
    reliability: { enableRetry: false, maxRetries: 0, fallbackOrder: [] },
  })
  nock(OPENAI).post('/v1/chat/completions').reply(500, { error: { message: 'boom' } })

  const res = await send(apiKey)
  assert.equal(res.status, 500)

  const org = await Organization.findOne().lean()
  assert.equal(org.currentMonthlyLogs, 0, 'slot was refunded after total failure')
})
