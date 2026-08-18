const assert = require('node:assert/strict')
const test = require('node:test')

test('exports primary SDK surface', () => {
  const sdk = require('../src')

  assert.equal(typeof sdk.Zyra, 'function')
  assert.equal(typeof sdk.AIShield, 'function')
  assert.equal(typeof sdk.OpenAIShield, 'function')
  assert.equal(typeof sdk.ZyraError, 'function')
})

test('Zyra requires an API key', () => {
  const { Zyra, ZyraError } = require('../src')

  assert.throws(() => new Zyra(), ZyraError)
})

test('logger dispatch is fire-and-forget', () => {
  const { dispatchLog } = require('../src/logger')

  assert.doesNotThrow(() => {
    dispatchLog({
      sdkLanguage: 'node',
      provider: 'openai',
      modelRequested: 'gpt-4o-mini',
      promptTokens: 1,
      completionTokens: 1,
      latencyMs: 1,
      status: 'success'
    })
  })
})
