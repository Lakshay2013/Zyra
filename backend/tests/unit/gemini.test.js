const test = require('node:test')
const assert = require('node:assert/strict')
const {
  toGeminiRequest, toOpenAIResponse, buildGeminiRequestConfig, extractGeminiTokens, normalizeModelName,
} = require('../../src/services/providers/gemini')

test('normalizeModelName: strips models/ and gemini/ prefixes', () => {
  assert.equal(normalizeModelName('models/gemini-2.0-flash'), 'gemini-2.0-flash')
  assert.equal(normalizeModelName('gemini/gemini-1.5-pro'), 'gemini-1.5-pro')
  assert.equal(normalizeModelName(''), 'gemini-2.0-flash')
})

test('toGeminiRequest: maps roles and pulls out system instruction', () => {
  const r = toGeminiRequest({
    messages: [
      { role: 'system', content: 'Be terse' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
      { role: 'user', content: '2+2?' },
    ],
    temperature: 0.5,
    max_tokens: 128,
    top_p: 0.9,
    stop: ['END'],
  })
  assert.deepEqual(r.systemInstruction, { parts: [{ text: 'Be terse' }] })
  assert.equal(r.contents.length, 3)
  assert.equal(r.contents[0].role, 'user')
  assert.equal(r.contents[1].role, 'model')
  assert.equal(r.contents[2].parts[0].text, '2+2?')
  assert.equal(r.generationConfig.temperature, 0.5)
  assert.equal(r.generationConfig.maxOutputTokens, 128)
  assert.equal(r.generationConfig.topP, 0.9)
  assert.deepEqual(r.generationConfig.stopSequences, ['END'])
})

test('toGeminiRequest: array content parts are joined', () => {
  const r = toGeminiRequest({ messages: [{ role: 'user', content: [{ text: 'a' }, { text: 'b' }] }] })
  assert.equal(r.contents[0].parts[0].text, 'a\nb')
})

test('toOpenAIResponse: normalizes candidates + usage', () => {
  const r = toOpenAIResponse({
    candidates: [{ content: { parts: [{ text: 'Four' }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 3, totalTokenCount: 13 },
  }, 'gemini-2.0-flash')
  assert.equal(r.object, 'chat.completion')
  assert.equal(r.model, 'gemini-2.0-flash')
  assert.equal(r.choices[0].message.role, 'assistant')
  assert.equal(r.choices[0].message.content, 'Four')
  assert.equal(r.choices[0].finish_reason, 'stop')
  assert.deepEqual(r.usage, { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13 })
})

test('toOpenAIResponse: MAX_TOKENS maps to length; empty candidates safe', () => {
  assert.equal(toOpenAIResponse({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [] } }] }).choices[0].finish_reason, 'length')
  const empty = toOpenAIResponse({})
  assert.equal(empty.choices[0].message.content, '')
})

test('extractGeminiTokens', () => {
  assert.deepEqual(
    extractGeminiTokens({ usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 7, totalTokenCount: 12 } }),
    { prompt: 5, completion: 7, total: 12 }
  )
})

test('buildGeminiRequestConfig: uses x-goog-api-key header, not Bearer; correct URL', () => {
  const cfg = buildGeminiRequestConfig('gemini-2.0-flash', { messages: [{ role: 'user', content: 'hi' }] }, 'Bearer AIzaSECRET', { stream: false })
  assert.equal(cfg.headers['x-goog-api-key'], 'AIzaSECRET')
  assert.ok(!cfg.headers.Authorization)
  assert.match(cfg.url, /\/v1beta\/models\/gemini-2\.0-flash:generateContent$/)
})

test('buildGeminiRequestConfig: stream uses streamGenerateContent?alt=sse', () => {
  const cfg = buildGeminiRequestConfig('gemini-2.0-flash', { messages: [] }, 'k', { stream: true })
  assert.match(cfg.url, /:streamGenerateContent\?alt=sse$/)
})
