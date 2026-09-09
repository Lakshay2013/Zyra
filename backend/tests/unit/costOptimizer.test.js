process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64)
const test = require('node:test')
const assert = require('node:assert/strict')
const {
  optimizeRequest, classifyPromptComplexity, calculateActualSavings, estimateTokenCount,
} = require('../../src/services/costOptimizer')

const orgWith = (over = {}) => ({
  optimizer: { autoOptimize: true, qualityTier: 'standard', ...(over.optimizer || {}) },
  providerKeys: over.providerKeys || { openai: 'x', anthropic: 'x', groq: 'x', gemini: 'x' },
})

test('classifyPromptComplexity: simple greeting', () => {
  assert.equal(classifyPromptComplexity('hi there', 10), 'simple')
})

test('classifyPromptComplexity: factual question is simple', () => {
  assert.equal(classifyPromptComplexity('what is the capital of France?', 12), 'simple')
})

test('classifyPromptComplexity: code / debug marker is complex', () => {
  assert.equal(classifyPromptComplexity('please debug this function and refactor it', 40), 'complex')
})

test('classifyPromptComplexity: long prompt is complex', () => {
  assert.equal(classifyPromptComplexity('word '.repeat(900), 900), 'complex')
})

test('classifyPromptComplexity: mid-size neutral prompt is standard', () => {
  assert.equal(classifyPromptComplexity('Rewrite this paragraph to be friendlier for a newsletter intro.', 60), 'standard')
})

test('optimizeRequest: disabled optimizer is a no-op', () => {
  const r = optimizeRequest(orgWith({ optimizer: { autoOptimize: false } }), 'gpt-4o', 'openai', 'hello')
  assert.equal(r.wasOptimized, false)
})

test('optimizeRequest: simple prompt downgrades gpt-4o to a cheaper capable model', () => {
  const r = optimizeRequest(orgWith(), 'gpt-4o', 'openai', 'hi')
  assert.equal(r.wasOptimized, true)
  assert.equal(r.complexity, 'simple')
  assert.ok(r.optimizedCost < r.originalCost)
  assert.ok(r.savings > 0)
})

test('optimizeRequest: complex prompt is not downgraded below premium intent', () => {
  const r = optimizeRequest(orgWith(), 'gpt-4o', 'openai', 'debug and refactor this large module with step-by-step reasoning')
  assert.equal(r.complexity, 'complex')
  // premium tier target — should not drop to an economy model
  assert.notEqual(r.optimizedModel, 'llama-3.1-8b-instant')
})

test('optimizeRequest: never routes to a provider the org has no key for', () => {
  const r = optimizeRequest(orgWith({ providerKeys: { anthropic: 'x' } }), 'gpt-4o', 'openai', 'hi')
  if (r.wasOptimized) assert.equal(r.optimizedProvider, 'anthropic')
})

test('optimizeRequest: org qualityTier=premium prevents aggressive downgrade', () => {
  const r = optimizeRequest(orgWith({ optimizer: { autoOptimize: true, qualityTier: 'premium' } }), 'gpt-4o', 'openai', 'hi')
  // With a premium floor, tier stays premium; a same-tier cheaper model is allowed but not economy
  assert.notEqual(getTier(r.optimizedModel), 'economy')
})

function getTier (m) {
  const { getModelTier } = require('../../src/utils/costCalculator')
  return getModelTier(m)
}

test('calculateActualSavings: positive when routed to cheaper model', () => {
  const s = calculateActualSavings('gpt-4o', 'gpt-4o-mini', 1000, 1000)
  assert.ok(s > 0)
})

test('calculateActualSavings: zero when same model', () => {
  assert.equal(calculateActualSavings('gpt-4o', 'gpt-4o', 1000, 1000), 0)
})

test('calculateActualSavings: never negative', () => {
  assert.equal(calculateActualSavings('gpt-4o-mini', 'gpt-4o', 1000, 1000), 0)
})

test('estimateTokenCount: ~4 chars per token', () => {
  assert.equal(estimateTokenCount('a'.repeat(400)), 100)
})
