const test = require('node:test')
const assert = require('node:assert/strict')
const { computeRisk, severityFor, RISK_WEIGHTS, NOTIFY_THRESHOLD } = require('../../src/services/riskEngine')

test('risk formula weights match the paper: R = 0.35I + 0.30J + 0.20P + 0.15A', () => {
  assert.equal(RISK_WEIGHTS.injection, 0.35)
  assert.equal(RISK_WEIGHTS.jailbreak, 0.30)
  assert.equal(RISK_WEIGHTS.pii, 0.20)
  assert.equal(RISK_WEIGHTS.abuse, 0.15)
  const sum = RISK_WEIGHTS.injection + RISK_WEIGHTS.jailbreak + RISK_WEIGHTS.pii + RISK_WEIGHTS.abuse
  assert.ok(Math.abs(sum - 1) < 1e-9)
})

test('all-zero components → risk 0, severity low', () => {
  const r = computeRisk({ injection: 0, jailbreak: 0, pii: 0, abuse: 0 })
  assert.equal(r.riskScore, 0)
  assert.equal(r.severity, 'low')
  assert.equal(r.shouldNotify, false)
})

test('worked example: I=90 J=0 P=0 A=10 → 0.35*90 + 0.15*10 = 33', () => {
  const r = computeRisk({ injection: 90, jailbreak: 0, pii: 0, abuse: 10 })
  assert.equal(r.riskScore, 33)
  assert.equal(r.severity, 'medium')
})

test('pure injection maxed: I=100 → 35', () => {
  assert.equal(computeRisk({ injection: 100 }).riskScore, 35)
})

test('combined malicious prompt scores critical and notifies', () => {
  const r = computeRisk({ injection: 100, jailbreak: 100, pii: 100, abuse: 60 })
  // 35 + 30 + 20 + 9 = 94
  assert.equal(r.riskScore, 94)
  assert.equal(r.severity, 'critical')
  assert.equal(r.shouldNotify, true)
})

test('score exactly 80 does NOT notify (paper: "over 80")', () => {
  // need weighted sum == 80: injection 100 (35) + jailbreak 100 (30) + pii 75 (15) = 80
  const r = computeRisk({ injection: 100, jailbreak: 100, pii: 75, abuse: 0 })
  assert.equal(r.riskScore, 80)
  assert.equal(r.shouldNotify, false)
  assert.equal(r.severity, 'critical')
})

test('components are clamped to 0-100', () => {
  const r = computeRisk({ injection: 999, jailbreak: -50, pii: NaN, abuse: 'x' })
  assert.equal(r.components.injection, 100)
  assert.equal(r.components.jailbreak, 0)
  assert.equal(r.components.pii, 0)
  assert.equal(r.components.abuse, 0)
  assert.equal(r.riskScore, 35)
})

test('severity bands', () => {
  assert.equal(severityFor(0), 'low')
  assert.equal(severityFor(24), 'low')
  assert.equal(severityFor(25), 'medium')
  assert.equal(severityFor(49), 'medium')
  assert.equal(severityFor(50), 'high')
  assert.equal(severityFor(79), 'high')
  assert.equal(severityFor(80), 'critical')
  assert.equal(severityFor(100), 'critical')
})

test('NOTIFY_THRESHOLD is 80', () => {
  assert.equal(NOTIFY_THRESHOLD, 80)
})
