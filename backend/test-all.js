/**
 * ZYRA END-TO-END TEST SUITE
 * Tests every feature: auth, optimizer, quality guard, analytics, org settings
 */
const http = require('http')
const fs = require('fs')

const BASE = 'http://localhost:5000'
let TOKEN = null
let ORG_ID = null
let API_KEY = null

const results = []
let passed = 0
let failed = 0

const RESULTS_FILE = 'test-output.log'
fs.writeFileSync(RESULTS_FILE, '', 'utf8')
const log = (msg) => { fs.appendFileSync(RESULTS_FILE, msg + '\n', 'utf8') }

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE)
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', ...headers }
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

const authedRequest = (method, path, body = null) =>
  request(method, path, body, { Authorization: `Bearer ${TOKEN}` })

const test = async (name, fn) => {
  try {
    await fn()
    passed++
    results.push(`  [PASS] ${name}`)
    log(`  [PASS] ${name}`)
  } catch (err) {
    failed++
    results.push(`  [FAIL] ${name}: ${err.message}`)
    log(`  [FAIL] ${name}: ${err.message}`)
  }
}

const assert = (condition, msg) => { if (!condition) throw new Error(msg) }

async function runTests() {
  log('ZYRA FULL TEST SUITE')
  log('==================================================')

  // 1. HEALTH
  log('\n[Health Check]')
  await test('Server is running', async () => {
    const res = await request('GET', '/health')
    assert(res.status === 200, `Expected 200, got ${res.status}`)
  })

  // 2. AUTH
  log('\n[Authentication]')
  const testEmail = `test_${Date.now()}@zyra.test`
  const testPass = 'TestPass123!'

  await test('Register new user', async () => {
    const res = await request('POST', '/api/auth/register', {
      name: 'Test User', email: testEmail, password: testPass, orgName: 'Test Org'
    })
    assert(res.status === 201 || res.status === 200, `Register: ${res.status} ${JSON.stringify(res.data)}`)
    // Registration returns message + requiresOtp, not a token
    assert(res.data.message, 'Should return a message')
  })

  await test('Login after register', async () => {
    // OTP check is disabled in the code, so login should work immediately
    const res = await request('POST', '/api/auth/login', { email: testEmail, password: testPass })
    assert(res.status === 200, `Login: ${res.status} ${JSON.stringify(res.data)}`)
    TOKEN = res.data.token
    assert(TOKEN, 'No token returned from login')
  })

  await test('Protected route without token = 401', async () => {
    const res = await request('GET', '/api/analytics/overview')
    assert(res.status === 401, `Expected 401, got ${res.status}`)
  })

  // 3. API KEYS
  log('\n[API Keys]')
  await test('Create API key', async () => {
    const res = await authedRequest('POST', '/api/keys', { name: 'Test Key' })
    assert(res.status === 201 || res.status === 200, `Create: ${res.status}`)
    API_KEY = res.data.key
    assert(API_KEY, 'No key')
  })

  await test('List API keys', async () => {
    const res = await authedRequest('GET', '/api/keys')
    assert(res.status === 200 && res.data.keys?.length > 0, 'Should have keys')
  })

  // 4. ORG SETTINGS
  log('\n[Org Settings]')
  await test('GET /api/org/providers', async () => {
    const res = await authedRequest('GET', '/api/org/providers')
    assert(res.status === 200, `${res.status}`)
  })
  await test('GET /api/org/policies', async () => {
    const res = await authedRequest('GET', '/api/org/policies')
    assert(res.status === 200, `${res.status}`)
  })
  await test('GET /api/org/billing', async () => {
    const res = await authedRequest('GET', '/api/org/billing')
    assert(res.status === 200 && res.data.billing, 'No billing')
  })
  await test('GET /api/org/members', async () => {
    const res = await authedRequest('GET', '/api/org/members')
    assert(res.status === 200, `${res.status}`)
  })

  // 5. OPTIMIZER SETTINGS
  log('\n[Optimizer Settings]')
  await test('GET /api/org/optimizer', async () => {
    const res = await authedRequest('GET', '/api/org/optimizer')
    assert(res.status === 200, `${res.status}`)
  })
  await test('PUT optimizer ON', async () => {
    const res = await authedRequest('PUT', '/api/org/optimizer', { autoOptimize: true, qualityTier: 'standard' })
    assert(res.status === 200 && res.data.optimizer?.autoOptimize === true, 'Should be on')
  })
  await test('PUT optimizer OFF', async () => {
    const res = await authedRequest('PUT', '/api/org/optimizer', { autoOptimize: false })
    assert(res.status === 200 && res.data.optimizer?.autoOptimize === false, 'Should be off')
  })

  // 6. RELIABILITY SETTINGS
  log('\n[Reliability Settings]')
  await test('GET /api/org/reliability', async () => {
    const res = await authedRequest('GET', '/api/org/reliability')
    assert(res.status === 200, `${res.status}`)
  })
  await test('PUT reliability config', async () => {
    const res = await authedRequest('PUT', '/api/org/reliability', {
      enableRetry: true, maxRetries: 3, fallbackOrder: ['groq', 'openai']
    })
    assert(res.status === 200, `${res.status}`)
  })

  // 7. ANALYTICS
  log('\n[Analytics Endpoints]')
  await test('GET /api/analytics/overview', async () => {
    const res = await authedRequest('GET', '/api/analytics/overview')
    assert(res.status === 200 && res.data.totalLogs !== undefined && res.data.totalSavings !== undefined, 'Bad overview')
  })
  await test('GET /api/analytics/usage?period=7d', async () => {
    const res = await authedRequest('GET', '/api/analytics/usage?period=7d')
    assert(res.status === 200, `${res.status}`)
  })
  await test('GET /api/analytics/top-users', async () => {
    const res = await authedRequest('GET', '/api/analytics/top-users')
    assert(res.status === 200, `${res.status}`)
  })
  await test('GET /api/analytics/high-risk', async () => {
    const res = await authedRequest('GET', '/api/analytics/high-risk')
    assert(res.status === 200, `${res.status}`)
  })

  // 8. SAVINGS + COST (THE MONEY FEATURE)
  log('\n[Savings & Cost Analytics]')
  await test('GET /api/analytics/savings - spec format', async () => {
    const res = await authedRequest('GET', '/api/analytics/savings')
    assert(res.status === 200, `${res.status}`)
    const d = res.data
    assert(d.totalSaved !== undefined, 'no totalSaved')
    assert(d.percentReduction !== undefined, 'no percentReduction')
    assert(d.breakdown?.optimization !== undefined, 'no breakdown.optimization')
    assert(d.details?.period !== undefined, 'no details.period')
  })
  await test('GET /api/analytics/savings?days=7', async () => {
    const res = await authedRequest('GET', '/api/analytics/savings?days=7')
    assert(res.status === 200 && res.data.details.period === 'last_7_days', `Bad period`)
  })
  await test('GET /api/analytics/cost-breakdown', async () => {
    const res = await authedRequest('GET', '/api/analytics/cost-breakdown')
    assert(res.status === 200 && Array.isArray(res.data.byModel), 'Bad breakdown')
  })
  await test('GET /api/analytics/cost-comparison', async () => {
    const res = await authedRequest('GET', '/api/analytics/cost-comparison')
    assert(res.status === 200, `${res.status}`)
    const d = res.data
    assert(d.withoutZyra !== undefined, 'no withoutZyra')
    assert(d.withZyra !== undefined, 'no withZyra')
    assert(d.saved !== undefined, 'no saved')
    assert(Array.isArray(d.modelSwaps), 'no modelSwaps')
  })
  await test('GET /api/analytics/value-report', async () => {
    const res = await authedRequest('GET', '/api/analytics/value-report')
    assert(res.status === 200 && res.data.moneySaved !== undefined, 'Bad report')
  })

  // 9. COST OPTIMIZER UNIT TESTS
  log('\n[Cost Optimizer Logic]')
  await test('Complexity: simple question = simple', async () => {
    const { classifyPromptComplexity } = require('./src/services/costOptimizer')
    assert(classifyPromptComplexity('What is Node.js?', 10) === 'simple', 'Should be simple')
  })
  await test('Complexity: code request = complex', async () => {
    const { classifyPromptComplexity } = require('./src/services/costOptimizer')
    assert(classifyPromptComplexity('Write code for a REST API with auth', 50) === 'complex', 'Should be complex')
  })
  await test('Complexity: step-by-step = complex', async () => {
    const { classifyPromptComplexity } = require('./src/services/costOptimizer')
    assert(classifyPromptComplexity('Explain step-by-step how Docker works', 30) === 'complex', 'Should be complex')
  })
  await test('Complexity: normal question = standard', async () => {
    const { classifyPromptComplexity } = require('./src/services/costOptimizer')
    assert(classifyPromptComplexity('How does React handle state management with hooks?', 50) === 'standard', 'Should be standard')
  })
  await test('Optimizer: downgrades when keys available', async () => {
    const { optimizeRequest } = require('./src/services/costOptimizer')
    const org = { optimizer: { autoOptimize: true, qualityTier: 'economy' }, providerKeys: { openai: 'x', groq: 'x', gemini: 'x' } }
    const r = optimizeRequest(org, 'gpt-4o', 'openai', 'Hello world')
    assert(r.wasOptimized === true && r.savings > 0, 'Should optimize+save')
  })
  await test('Optimizer: does nothing when off', async () => {
    const { optimizeRequest } = require('./src/services/costOptimizer')
    const org = { optimizer: { autoOptimize: false }, providerKeys: { openai: 'x' } }
    assert(optimizeRequest(org, 'gpt-4o', 'openai', 'Hello').wasOptimized === false, 'Should not optimize')
  })
  await test('Optimizer: response has correct schema', async () => {
    const { optimizeRequest } = require('./src/services/costOptimizer')
    const org = { optimizer: { autoOptimize: true }, providerKeys: { openai: 'x' } }
    const r = optimizeRequest(org, 'gpt-4o', 'openai', 'Test')
    const keys = ['originalModel','optimizedModel','originalCost','optimizedCost','savings','wasOptimized','complexity']
    keys.forEach(k => assert(r[k] !== undefined, `Missing ${k}`))
  })

  // 10. QUALITY GUARD UNIT TESTS
  log('\n[Quality Guard Logic]')
  await test('QG: passes valid response', async () => {
    const { validateResponse } = require('./src/services/qualityGuard')
    assert(validateResponse('TypeScript is a typed language that adds static types to JS.', 'What is TS?', 10).passed === true, 'Should pass')
  })
  await test('QG: catches empty response', async () => {
    const { validateResponse } = require('./src/services/qualityGuard')
    const r = validateResponse('', 'What is TS?', 10)
    assert(r.passed === false && r.reason === 'empty_response', 'Should catch empty')
  })
  await test('QG: catches too short for long prompt', async () => {
    const { validateResponse } = require('./src/services/qualityGuard')
    const r = validateResponse('Yes', 'Explain in detail the architecture of microservices', 100)
    assert(r.passed === false && r.reason === 'too_short', 'Should catch short')
  })
  await test('QG: catches refusal pattern', async () => {
    const { validateResponse } = require('./src/services/qualityGuard')
    const r = validateResponse("I'm sorry, I'm unable to help with that.", 'Write code', 20)
    assert(r.passed === false && r.reason === 'refusal_detected', 'Should catch refusal')
  })
  await test('QG: allows short answer for simple prompt', async () => {
    const { validateResponse } = require('./src/services/qualityGuard')
    assert(validateResponse('Hello!', 'Hi', 5).passed === true, 'Should allow')
  })
  await test('QG: returns higher-tier fallback', async () => {
    const { getQualityFallbackModel } = require('./src/services/qualityGuard')
    const org = { providerKeys: { openai: 'x', anthropic: 'x' } }
    const r = getQualityFallbackModel('gpt-3.5-turbo', org)
    assert(r !== null && r.model !== 'gpt-3.5-turbo', 'Should return upgrade')
  })

  // 11. COST CALCULATOR UNIT TESTS
  log('\n[Cost Calculator]')
  await test('calculateCost returns correct value', async () => {
    const { calculateCost } = require('./src/utils/costCalculator')
    const cost = calculateCost('gpt-4o', 1000, 500)
    assert(Math.abs(cost - 0.0125) < 0.0001, `Expected ~0.0125, got ${cost}`)
  })
  await test('Model tier classification', async () => {
    const { getModelTier } = require('./src/utils/costCalculator')
    assert(getModelTier('gpt-4o') === 'premium', 'gpt-4o = premium')
    assert(getModelTier('gpt-4o-mini') === 'standard', 'gpt-4o-mini = standard')
    assert(getModelTier('gpt-3.5-turbo') === 'economy', 'gpt-3.5 = economy')
  })
  await test('getCheapestInTier sorts correctly', async () => {
    const { getCheapestInTier } = require('./src/utils/costCalculator')
    const m = getCheapestInTier('economy', 1000)
    assert(m.length > 0, 'Need economy models')
    for (let i = 1; i < m.length; i++) assert(m[i].estimatedCost >= m[i-1].estimatedCost, 'Bad sort')
  })

  // 12. PROXY PIPELINE
  log('\n[Proxy Pipeline]')
  await test('Proxy rejects bad provider', async () => {
    const res = await request('POST', '/proxy/fakeprovider/v1/chat',
      { model: 'test', messages: [{ role: 'user', content: 'hi' }] },
      { 'x-zyra-api-key': API_KEY })
    assert(res.status === 400, `Expected 400, got ${res.status}`)
  })
  await test('Proxy rejects missing auth', async () => {
    const res = await request('POST', '/proxy/openai/v1/chat/completions',
      { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: 'hi' }] })
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`)
  })
  await test('Proxy rejects no provider key configured', async () => {
    const res = await request('POST', '/proxy/openai/v1/chat/completions',
      { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: 'hi' }] },
      { 'x-zyra-api-key': API_KEY })
    assert(res.status === 400 || res.status === 502, `Expected 400/502, got ${res.status}`)
  })

  // 13. POLICIES
  log('\n[Firewall Policies]')
  await test('Update policies', async () => {
    const res = await authedRequest('PUT', '/api/org/policies', { blockInjection: true, blockPII: true, maxTokensPerRequest: 4000 })
    assert(res.status === 200, `${res.status}`)
  })
  await test('Read policies', async () => {
    const res = await authedRequest('GET', '/api/org/policies')
    assert(res.status === 200 && res.data.policies.blockInjection === true, 'Policy not saved')
  })

  // 14. LOGS
  log('\n[Logs]')
  await test('GET /api/logs for new org', async () => {
    const res = await authedRequest('GET', '/api/logs?limit=10')
    assert(res.status === 200 && Array.isArray(res.data.logs), 'Bad logs')
  })

  // ── FINAL REPORT ──
  log('\n==================================================')
  log('RESULTS')
  log('==================================================')
  results.forEach(r => log(r))
  log('--------------------------------------------------')
  log(`  TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)
  log('==================================================')

  console.log(`\nTest results written to ${RESULTS_FILE}`)
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)

  if (failed > 0) process.exit(1)
}

runTests().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
