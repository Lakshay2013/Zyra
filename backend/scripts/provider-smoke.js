/**
 * provider-smoke.js — real end-to-end check against each configured provider.
 *
 *   npm run test:providers
 *
 * This is NOT part of `npm test`. It makes real, billable (tiny) API calls and
 * only runs the providers whose keys are present in the environment:
 *
 *   OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, GEMINI_API_KEY
 *
 * Nothing is printed except pass/fail + latency. Keys are never logged.
 */
require('dotenv').config()
const axios = require('axios')
const geminiAdapter = require('../src/services/providers/gemini')

const CASES = [
  {
    provider: 'openai',
    env: 'OPENAI_API_KEY',
    build: (key) => ({
      method: 'POST', url: 'https://api.openai.com/v1/chat/completions',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: { model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 },
    }),
  },
  {
    provider: 'anthropic',
    env: 'ANTHROPIC_API_KEY',
    build: (key) => ({
      method: 'POST', url: 'https://api.anthropic.com/v1/messages',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      data: { model: 'claude-haiku-4-5', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 },
    }),
  },
  {
    provider: 'groq',
    env: 'GROQ_API_KEY',
    build: (key) => ({
      method: 'POST', url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      data: { model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 },
    }),
  },
  {
    provider: 'gemini',
    env: 'GEMINI_API_KEY',
    build: (key) => geminiAdapter.buildGeminiRequestConfig('gemini-2.0-flash', { messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }, key, { stream: false }),
  },
]

async function main () {
  let ran = 0
  let failed = 0
  for (const c of CASES) {
    const key = process.env[c.env]
    if (!key) {
      console.log(`  SKIP  ${c.provider.padEnd(10)} (${c.env} not set)`)
      continue
    }
    ran++
    const started = Date.now()
    try {
      const res = await axios({ ...c.build(key), timeout: 20000, validateStatus: () => true })
      const ms = Date.now() - started
      if (res.status >= 200 && res.status < 300) {
        console.log(`  PASS  ${c.provider.padEnd(10)} ${ms}ms`)
      } else {
        failed++
        const msg = res.data?.error?.message || res.data?.error?.status || `HTTP ${res.status}`
        console.log(`  FAIL  ${c.provider.padEnd(10)} ${ms}ms — ${String(msg).slice(0, 120)}`)
      }
    } catch (err) {
      failed++
      console.log(`  FAIL  ${c.provider.padEnd(10)} — ${err.code || err.message}`)
    }
  }

  console.log(`\n${ran} provider(s) tested, ${ran - failed} passed, ${failed} failed.`)
  if (ran === 0) console.log('Set at least one of OPENAI_API_KEY / ANTHROPIC_API_KEY / GROQ_API_KEY / GEMINI_API_KEY to run this.')
  process.exit(failed > 0 ? 1 : 0)
}

main()
