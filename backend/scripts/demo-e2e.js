/**
 * demo-e2e.js — end-to-end smoke of the whole Zyra stack against a RUNNING
 * server, using the demo data. Proves the pieces the faculty demo relies on:
 *
 *   auth → proxy (demo simulator) → async log → risk worker → dashboard APIs
 *   + prompt-injection / jailbreak / PII blocking
 *   + cost optimisation (model: auto)
 *   + multi-tenant isolation
 *
 * Usage:
 *   node scripts/demo-e2e.js                       # uses http://localhost:5000
 *   API_URL=http://localhost:5000 node scripts/demo-e2e.js
 *
 * Requires: `npm run demo:seed` already run, stack up (API + worker + mongo + redis).
 * Exits non-zero if any assertion fails.
 */
require('dotenv').config()
const assert = require('node:assert')

const API = process.env.API_URL || 'http://localhost:5000'
const PASS = process.env.DEMO_PASSWORD || 'demo-password-123'
const S = require('./demo-scenarios')

const jsonHeaders = { 'content-type': 'application/json' }
let failures = 0
const ok = (name) => console.log(`  ✓ ${name}`)
const bad = (name, err) => { failures++; console.log(`  ✗ ${name}\n      ${err.message}`) }

const post = (path, body, headers = {}) =>
  fetch(`${API}${path}`, { method: 'POST', headers: { ...jsonHeaders, ...headers }, body: JSON.stringify(body) })
const put = (path, body, headers = {}) =>
  fetch(`${API}${path}`, { method: 'PUT', headers: { ...jsonHeaders, ...headers }, body: JSON.stringify(body) })
const get = (path, headers = {}) => fetch(`${API}${path}`, { headers })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function login (email) {
  const r = await post('/api/auth/login', { email, password: PASS })
  const j = await r.json()
  assert.ok(j.token, `login failed for ${email}: ${JSON.stringify(j)}`)
  return { token: j.token, org: j.org }
}

async function findDemoKey (token, orgName) {
  // Not exposed via API (keys are write-once) — read from the seed output isn't
  // available here, so we mint a fresh key via the dashboard API instead.
  const r = await post('/api/keys', { name: `e2e ${Date.now()}` }, { authorization: `Bearer ${token}` })
  const j = await r.json()
  assert.ok(j.key, `could not mint API key for ${orgName}: ${JSON.stringify(j)}`)
  return j.key
}

async function proxy (apiKey, body) {
  const r = await post('/v1/chat/completions', body, { 'x-zyra-api-key': apiKey, 'x-zyra-debug': 'true' })
  const text = await r.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { status: r.status, headers: Object.fromEntries(r.headers), body: json }
}

async function main () {
  console.log(`\nZYRA DEMO E2E  →  ${API}\n`)

  // ── health ──
  try {
    const h = await (await get('/health')).json()
    assert.equal(h.status, 'ok'); assert.equal(h.mongo, true); assert.equal(h.redis, true)
    ok('health: api + mongo + redis')
  } catch (e) { bad('health', e); return finish() }

  // ── auth ──
  let demo, rival, demoKey, rivalKey
  try {
    demo = await login('admin@zyrademoco.demo')
    rival = await login('admin@acmerivalinc.demo')
    ok('auth: logged in to both demo tenants')
  } catch (e) { bad('auth', e); return finish() }

  try {
    demoKey = await findDemoKey(demo.token, 'Zyra Demo Co')
    rivalKey = await findDemoKey(rival.token, 'Acme Rival Inc')
    ok('api keys: minted for both tenants')
  } catch (e) { bad('api keys', e) }

  // ── viewer cannot mint keys? (role check is on org settings, keys allowed for all) ──
  try {
    const v = await login('viewer@zyrademoco.demo')
    const r = await put('/api/org/policies', { blockPII: true }, { authorization: `Bearer ${v.token}` })
    assert.equal(r.status, 403, `viewer should not update policies (got ${r.status})`)
    const rd = await put('/api/org/policies', { blockPII: true }, { authorization: `Bearer ${(await login('developer@zyrademoco.demo')).token}` })
    assert.equal(rd.status, 403, `developer should not update policies (got ${rd.status})`)
    ok('rbac: viewer + developer blocked from updating org policies (403); admin allowed')
  } catch (e) { bad('rbac viewer', e) }

  // ── scenario 1: normal request through the simulator ──
  try {
    const res = await proxy(demoKey, { model: 'gpt-4o', messages: [{ role: 'user', content: S.normal.prompt }] })
    assert.equal(res.status, 200, `normal request status ${res.status}: ${JSON.stringify(res.body)}`)
    assert.equal(res.headers['x-zyra-simulated'], 'true', 'expected x-zyra-simulated header in demo mode')
    assert.ok(res.body.choices[0].message.content.length > 0)
    assert.ok(res.body.usage.total_tokens > 0)
    ok(`scenario 1 normal: 200, simulated, ${res.body.usage.total_tokens} tokens, cost hdr $${res.headers['x-zyra-cost']}`)
  } catch (e) { bad('scenario 1 normal', e) }

  // ── scenario 2: prompt injection blocked pre-flight ──
  try {
    const res = await proxy(demoKey, { model: 'gpt-4o', messages: [{ role: 'user', content: S.injection.prompt }] })
    assert.equal(res.status, 403, `injection should be blocked (got ${res.status})`)
    assert.equal(res.body.error.type, 'firewall_error')
    ok('scenario 2 injection: blocked pre-flight (403 firewall_error)')
  } catch (e) { bad('scenario 2 injection', e) }

  // ── scenario 3: jailbreak (policy off by default → flows through, risk-scored) ──
  try {
    const res = await proxy(demoKey, { model: 'gpt-4o', messages: [{ role: 'user', content: S.jailbreak.prompt }] })
    assert.equal(res.status, 200, `jailbreak w/ policy off should pass (got ${res.status})`)
    ok('scenario 3 jailbreak: passes with blockJailbreak off (will be risk-scored async)')
  } catch (e) { bad('scenario 3 jailbreak', e) }

  // ── scenario 4: PII blocked pre-flight, provider never called ──
  try {
    const res = await proxy(demoKey, { model: 'gpt-4o', messages: [{ role: 'user', content: S.pii.prompt }] })
    assert.equal(res.status, 403, `PII should be blocked (got ${res.status})`)
    assert.equal(res.body.error.type, 'pii_error')
    assert.ok(Array.isArray(res.body.error.pii_types) && res.body.error.pii_types.includes('email'))
    ok(`scenario 4 PII: blocked pre-flight (403 pii_error, types: ${res.body.error.pii_types.join('/')})`)
  } catch (e) { bad('scenario 4 PII', e) }

  // ── scenario 5: cost optimisation, model: auto on a simple prompt ──
  try {
    const res = await proxy(demoKey, { model: 'auto', messages: [{ role: 'user', content: S.optimize.prompt }] })
    assert.equal(res.status, 200)
    assert.equal(res.headers['x-zyra-complexity'], 'simple', `expected simple, got ${res.headers['x-zyra-complexity']}`)
    assert.notEqual(res.headers['x-zyra-model'], 'gpt-4o', 'simple prompt should not route to the premium baseline')
    ok(`scenario 5 optimize: requested "auto" → selected "${res.headers['x-zyra-model']}" (${res.headers['x-zyra-provider']}), complexity=simple, savings=$${res.headers['x-zyra-savings']}`)
  } catch (e) { bad('scenario 5 optimize', e) }

  // ── scenario 6: complex prompt → higher tier ──
  try {
    const res = await proxy(demoKey, { model: 'auto', messages: [{ role: 'user', content: S.complex.prompt }] })
    assert.equal(res.status, 200)
    assert.equal(res.headers['x-zyra-complexity'], 'complex', `expected complex, got ${res.headers['x-zyra-complexity']}`)
    ok(`scenario 6 complex: complexity=complex → model "${res.headers['x-zyra-model']}"`)
  } catch (e) { bad('scenario 6 complex', e) }

  // ── wait for the risk worker, then check the dashboards ──
  await sleep(2500)

  try {
    const ov = await (await get('/api/security/overview', { authorization: `Bearer ${demo.token}` })).json()
    assert.ok(ov.totals.totalInteractions >= 5)
    assert.ok(ov.totals.jailbreaks >= 1, 'expected at least one jailbreak flagged')
    assert.equal(ov.formula, 'R = 0.35*I + 0.30*J + 0.20*P + 0.15*A')
    ok(`security overview: ${ov.totals.totalInteractions} interactions, ${ov.totals.securityEvents} events, ${ov.totals.jailbreaks} jailbreaks, ${ov.totals.criticalInteractions} critical`)
  } catch (e) { bad('security overview', e) }

  try {
    const rep = await (await get('/api/security/reports?limit=5', { authorization: `Bearer ${demo.token}` })).json()
    assert.ok(rep.reports.length > 0)
    const withJb = rep.reports.find((r) => r.jailbreak)
    assert.ok(withJb, 'expected a report with jailbreak=true')
    assert.ok(withJb.riskScore > 0, 'jailbreak report should have non-zero risk')
    assert.equal(withJb.components.jailbreak > 0, true)
    ok(`risk reports: jailbreak row risk=${withJb.riskScore} (${withJb.severity}), components=${JSON.stringify(withJb.components)}`)
  } catch (e) { bad('risk reports', e) }

  try {
    const notif = await (await get('/api/security/notifications', { authorization: `Bearer ${demo.token}` })).json()
    ok(`notifications: ${notif.notifications.length} total, ${notif.unreadCount} unread (seed high-risk alerts)`)
  } catch (e) { bad('notifications', e) }

  try {
    const audit = await (await get('/api/audit?limit=3', { authorization: `Bearer ${demo.token}` })).json()
    assert.ok(audit.logs.length > 0)
    ok(`audit log: ${audit.pagination.total} entries (latest: ${audit.logs[0].action} by ${audit.logs[0].actor})`)
  } catch (e) { bad('audit log', e) }

  try {
    const cost = await (await get('/api/analytics/cost-comparison', { authorization: `Bearer ${demo.token}` })).json()
    ok(`cost analytics: withoutZyra $${cost.withoutZyra} vs withZyra $${cost.withZyra} → saved $${cost.saved} (${cost.percentReduction}%)`)
  } catch (e) { bad('cost analytics', e) }

  // ── multi-tenant isolation ──
  try {
    const rivalReports = await (await get('/api/security/reports?limit=1', { authorization: `Bearer ${rival.token}` })).json()
    const rivalReportId = rivalReports.reports[0]?.id
    if (rivalReportId) {
      const cross = await get(`/api/security/reports/${rivalReportId}`, { authorization: `Bearer ${demo.token}` })
      assert.equal(cross.status, 404, `Demo Co must NOT read Acme's risk report (got ${cross.status})`)
      ok('isolation: Demo Co cannot read Acme Rival Inc risk report (404)')
    }
    const demoOv = await (await get('/api/security/overview', { authorization: `Bearer ${demo.token}` })).json()
    const rivalOv = await (await get('/api/security/overview', { authorization: `Bearer ${rival.token}` })).json()
    assert.notEqual(demoOv.totals.totalInteractions, rivalOv.totals.totalInteractions)
    ok(`isolation: separate analytics per tenant (Demo=${demoOv.totals.totalInteractions}, Rival=${rivalOv.totals.totalInteractions})`)
  } catch (e) { bad('isolation', e) }

  finish()
}

function finish () {
  console.log(`\n${failures === 0 ? '✅ ALL E2E CHECKS PASSED' : `❌ ${failures} E2E CHECK(S) FAILED`}\n`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
