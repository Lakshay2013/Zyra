process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64)
const test = require('node:test')
const assert = require('node:assert/strict')
const {
  calculateCost, estimateCost, getModelTier, getCheapestInTier, matchModel, getPricing, MODEL_PRICING,
} = require('../../src/utils/costCalculator')

test('calculateCost: gpt-4o priced per 1k tokens', () => {
  // 1000 prompt @ 0.005 + 1000 completion @ 0.015 = 0.02
  assert.equal(calculateCost('gpt-4o', 1000, 1000), 0.02)
})

test('calculateCost: unknown model falls back to default pricing', () => {
  const c = calculateCost('some-unknown-model-xyz', 1000, 0)
  assert.equal(c, MODEL_PRICING.default.prompt)
})

test('calculateCost: zero tokens => zero cost', () => {
  assert.equal(calculateCost('gpt-4o-mini', 0, 0), 0)
})

test('matchModel: exact and fuzzy matching, mini before base', () => {
  assert.equal(matchModel('gpt-4o'), 'gpt-4o')
  assert.equal(matchModel('gpt-4o-mini-2024-07-18'), 'gpt-4o-mini')
  assert.equal(matchModel('claude-haiku-4-5-20251001'), 'claude-haiku-4-5')
})

test('getModelTier: known tiers', () => {
  assert.equal(getModelTier('gpt-4o'), 'premium')
  assert.equal(getModelTier('gpt-4o-mini'), 'standard')
  assert.equal(getModelTier('llama-3.1-8b-instant'), 'economy')
})

test('getCheapestInTier: returns models sorted cheapest-first with provider', () => {
  const list = getCheapestInTier('economy', 500)
  assert.ok(list.length >= 2)
  for (let i = 1; i < list.length; i++) {
    assert.ok(list[i].estimatedCost >= list[i - 1].estimatedCost)
  }
  assert.ok(list[0].provider)
})

test('estimateCost: monotonic in token count', () => {
  assert.ok(estimateCost('gpt-4o', 2000) > estimateCost('gpt-4o', 200))
})

test('pricing data is isolated from routing logic (plain object of {prompt,completion})', () => {
  for (const [model, p] of Object.entries(MODEL_PRICING)) {
    assert.equal(typeof p.prompt, 'number', `${model} prompt price`)
    assert.equal(typeof p.completion, 'number', `${model} completion price`)
  }
})
