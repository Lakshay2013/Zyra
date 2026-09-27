const test = require('node:test')
const assert = require('node:assert/strict')
const { detectPII, maskPII, PII_TYPES } = require('../../src/utils/piiDetector')

test('PII_TYPES covers every category the paper lists', () => {
  for (const t of ['email', 'phone', 'aadhaar', 'pan', 'creditCard', 'apiKey', 'password', 'jwt']) {
    assert.ok(PII_TYPES.includes(t), `missing PII type: ${t}`)
  }
})

test('detect: OpenAI-style API key', () => {
  const r = detectPII('use key sk-live-abcdef0123456789abcdef0123 for the call')
  assert.ok(r.types.includes('apiKey'))
  assert.equal(r.hasPII, true)
})

test('detect: JWT', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
  const r = detectPII(`token: ${jwt}`)
  assert.ok(r.types.includes('jwt'))
})

test('detect: password assignment', () => {
  const r = detectPII('my password: hunter2Winter')
  assert.ok(r.types.includes('password'))
})

test('mask: email → j***@domain', () => {
  const { masked, changed } = maskPII('write to john@gmail.com today')
  assert.equal(changed, true)
  assert.ok(/j\*+@gmail\.com/.test(masked))
  assert.ok(!masked.includes('john@gmail.com'))
})

test('mask: credit card keeps only last 4', () => {
  const { masked } = maskPII('card 4111 1111 1111 1234')
  assert.ok(masked.includes('1234'))
  assert.ok(!masked.includes('4111 1111 1111 1234'))
})

test('mask: API key is redacted', () => {
  const { masked } = maskPII('key sk-live-abcdef0123456789abcdef0123')
  assert.ok(!masked.includes('sk-live-abcdef0123456789abcdef0123'))
  assert.ok(masked.includes('redacted:apiKey'))
})

test('mask: JWT is redacted entirely', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abcDEF123_-ghiJKL'
  const { masked } = maskPII(`Authorization uses ${jwt}`)
  assert.ok(!masked.includes(jwt))
  assert.ok(masked.includes('redacted:jwt'))
})

test('mask: clean text is unchanged', () => {
  const { masked, changed } = maskPII('the quick brown fox')
  assert.equal(changed, false)
  assert.equal(masked, 'the quick brown fox')
})

test('detect: clean text has no PII', () => {
  const r = detectPII('what is the tallest mountain in the world?')
  assert.equal(r.hasPII, false)
})
