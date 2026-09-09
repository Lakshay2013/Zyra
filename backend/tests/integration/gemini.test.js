const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const nock = require('nock')

const { connectDb, clearDb, disconnectDb, createOrgWithKey, fakeProviderKeys } = require('../helpers')
const app = require('../../src/app')

test.before(connectDb)
test.beforeEach(async () => { await clearDb(); nock.cleanAll() })
test.after(async () => { nock.cleanAll(); await disconnectDb() })

const GEMINI = 'https://generativelanguage.googleapis.com'
const geminiBody = {
  candidates: [{ content: { parts: [{ text: 'Paris.' }] }, finishReason: 'STOP' }],
  usageMetadata: { promptTokenCount: 9, candidatesTokenCount: 2, totalTokenCount: 11 },
}

test('Gemini: OpenAI request is translated, response normalized to OpenAI shape', async () => {
  const { apiKey } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['gemini']) })

  let capturedPath, capturedHeaders, capturedBody
  nock(GEMINI)
    .post(/\/v1beta\/models\/.*:generateContent/)
    .reply(function (uri, reqBody) {
      capturedPath = uri
      capturedHeaders = this.req.headers
      capturedBody = reqBody
      return [200, geminiBody]
    })

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .send({
      model: 'gemini-2.0-flash',
      messages: [
        { role: 'system', content: 'Answer in one word.' },
        { role: 'user', content: 'Capital of France?' },
      ],
      temperature: 0.2,
    })

  assert.equal(res.status, 200)
  // response normalized
  assert.equal(res.body.object, 'chat.completion')
  assert.equal(res.body.choices[0].message.content, 'Paris.')
  assert.equal(res.body.usage.prompt_tokens, 9)
  assert.equal(res.body.usage.completion_tokens, 2)
  // request translated
  assert.match(capturedPath, /:generateContent/)
  assert.ok(capturedHeaders['x-goog-api-key'], 'uses x-goog-api-key header')
  assert.ok(!capturedHeaders.authorization, 'no Bearer auth header')
  assert.deepEqual(capturedBody.systemInstruction, { parts: [{ text: 'Answer in one word.' }] })
  assert.equal(capturedBody.contents[0].role, 'user')
  assert.equal(capturedBody.generationConfig.temperature, 0.2)
})

test('Gemini: streaming request returns a valid OpenAI SSE stream', async () => {
  const { apiKey } = await createOrgWithKey({ providerKeys: fakeProviderKeys(['gemini']) })
  nock(GEMINI).post(/:generateContent/).reply(200, geminiBody)

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .send({ model: 'gemini-2.0-flash', stream: true, messages: [{ role: 'user', content: 'hi' }] })

  assert.equal(res.status, 200)
  assert.match(res.headers['content-type'], /text\/event-stream/)
  assert.match(res.text, /data: /)
  assert.match(res.text, /\[DONE\]/)
  assert.match(res.text, /Paris\./)
})

test('Gemini: model:auto can route to Gemini when it is the only provider', async () => {
  const { apiKey } = await createOrgWithKey({
    providerKeys: fakeProviderKeys(['gemini']),
    optimizer: { autoOptimize: true, qualityTier: 'economy' },
  })
  const scope = nock(GEMINI).post(/:generateContent/).reply(200, geminiBody)

  const res = await request(app)
    .post('/v1/chat/completions')
    .set('x-zyra-api-key', apiKey)
    .send({ model: 'auto', messages: [{ role: 'user', content: 'hi' }] })

  assert.equal(res.status, 200)
  assert.ok(scope.isDone())
})
