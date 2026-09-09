const test = require('node:test')
const assert = require('node:assert/strict')
const { detectSensitiveKeywords } = require('../../src/utils/sensitiveKeywordDetector')

test('sensitive: built-in confidentiality marker', () => {
  const r = detectSensitiveKeywords('This document is CONFIDENTIAL and must not be distributed.')
  assert.equal(r.hasSensitive, true)
  assert.ok(r.matches.includes('confidential'))
})

test('sensitive: credential vocabulary', () => {
  const r = detectSensitiveKeywords('Here is the production database password and the private key.')
  assert.equal(r.hasSensitive, true)
  assert.ok(r.matches.includes('password'))
  assert.ok(r.matches.includes('private key'))
})

test('sensitive: org custom watch-words', () => {
  const r = detectSensitiveKeywords('The Project Titan roadmap leaked.', ['project titan'])
  assert.equal(r.hasSensitive, true)
  assert.ok(r.matches.includes('project titan'))
})

test('sensitive: clean text is not flagged', () => {
  const r = detectSensitiveKeywords('What time does the library open on Sunday?')
  assert.equal(r.hasSensitive, false)
  assert.equal(r.score, 0)
})

test('sensitive: single-word watch-words match on word boundary', () => {
  // "nda" should NOT match inside "Rwanda"
  const r = detectSensitiveKeywords('Rwanda is in East Africa.')
  assert.equal(r.hasSensitive, false)
})

test('sensitive: score scales with distinct hits and caps at 100', () => {
  const r = detectSensitiveKeywords('confidential classified proprietary trade secret nda password credentials')
  assert.ok(r.score <= 100)
  assert.ok(r.score >= 75)
})
