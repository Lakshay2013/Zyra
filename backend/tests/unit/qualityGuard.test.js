process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64)
const test = require('node:test')
const assert = require('node:assert/strict')
const { validateResponse, getQualityFallbackModel } = require('../../src/services/qualityGuard')

test('validateResponse: good answer passes', () => {
  const r = validateResponse('The capital of France is Paris.', 'What is the capital of France?', 10)
  assert.equal(r.passed, true)
})

test('validateResponse: empty response fails', () => {
  const r = validateResponse('', 'anything', 10)
  assert.equal(r.passed, false)
  assert.equal(r.reason, 'empty_response')
})

test('validateResponse: too-short answer to a non-trivial prompt fails', () => {
  const r = validateResponse('ok', 'Explain the Raft consensus algorithm in depth', 80)
  assert.equal(r.passed, false)
  assert.equal(r.reason, 'too_short')
})

test('validateResponse: refusal pattern fails', () => {
  const r = validateResponse("I'm sorry, I am unable to help with that request.", 'do a thing', 20)
  assert.equal(r.passed, false)
  assert.equal(r.reason, 'refusal_detected')
})

test('getQualityFallbackModel: returns a higher tier the org has keys for', () => {
  const up = getQualityFallbackModel('gpt-4o-mini', { providerKeys: { openai: 'x', anthropic: 'x' } })
  assert.ok(up)
  const { getModelTier } = require('../../src/utils/costCalculator')
  assert.equal(getModelTier(up.model), 'premium')
})

test('getQualityFallbackModel: null when already premium', () => {
  const up = getQualityFallbackModel('gpt-4o', { providerKeys: { openai: 'x' } })
  assert.equal(up, null)
})

test('getQualityFallbackModel: null when org has no usable provider key', () => {
  const up = getQualityFallbackModel('gpt-4o-mini', { providerKeys: {} })
  assert.equal(up, null)
})
