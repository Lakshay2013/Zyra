/**
 * PROVIDER TESTER
 *
 * Runs a minimal, real request against each configured provider to verify the
 * stored API key actually works. Used by the dashboard "Test All" button.
 *
 * Keeps requests tiny (1 output token, a 3-char prompt) and never stores or
 * returns response content or the API key.
 */

const axios = require('axios')
const { decrypt } = require('../utils/crypto')
const geminiAdapter = require('./providers/gemini')

const TEST_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5',
  groq: 'llama-3.1-8b-instant',
  gemini: 'gemini-2.0-flash',
}

const buildConfig = (provider, rawKey) => {
  const messages = [{ role: 'user', content: 'ping' }]
  const common = { timeout: 15000, validateStatus: () => true }

  if (provider === 'openai' || provider === 'groq') {
    const base = provider === 'openai' ? 'https://api.openai.com' : 'https://api.groq.com/openai'
    return {
      ...common,
      method: 'POST',
      url: `${base}/v1/chat/completions`,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rawKey}` },
      data: { model: TEST_MODELS[provider], messages, max_tokens: 1 },
    }
  }
  if (provider === 'anthropic') {
    return {
      ...common,
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      headers: { 'Content-Type': 'application/json', 'x-api-key': rawKey, 'anthropic-version': '2023-06-01' },
      data: { model: TEST_MODELS.anthropic, messages, max_tokens: 1 },
    }
  }
  if (provider === 'gemini') {
    return { ...common, ...geminiAdapter.buildGeminiRequestConfig(TEST_MODELS.gemini, { messages, max_tokens: 1 }, rawKey, { stream: false }), validateStatus: () => true }
  }
  return null
}

/**
 * Test one provider.
 * @returns {Promise<{ provider, ok, status, latencyMs, error }>}
 */
const testProvider = async (provider, encryptedKey) => {
  const started = Date.now()
  if (!encryptedKey) {
    return { provider, ok: false, status: null, latencyMs: 0, error: 'not configured' }
  }

  let rawKey
  try {
    rawKey = decrypt(encryptedKey).replace(/^Bearer\s+/i, '')
  } catch {
    return { provider, ok: false, status: null, latencyMs: 0, error: 'stored key could not be decrypted' }
  }

  const config = buildConfig(provider, rawKey)
  if (!config) return { provider, ok: false, status: null, latencyMs: 0, error: 'unsupported provider' }

  try {
    const res = await axios(config)
    const latencyMs = Date.now() - started
    if (res.status >= 200 && res.status < 300) {
      return { provider, ok: true, status: res.status, latencyMs, error: null }
    }
    // Surface a short, safe reason
    const msg = res.data?.error?.message || res.data?.error?.status || res.data?.message || `HTTP ${res.status}`
    return { provider, ok: false, status: res.status, latencyMs, error: String(msg).slice(0, 200) }
  } catch (err) {
    return { provider, ok: false, status: null, latencyMs: Date.now() - started, error: (err.code || err.message || 'request failed').slice(0, 200) }
  }
}

const testAll = async (providerKeys = {}) => {
  const providers = ['openai', 'anthropic', 'groq', 'gemini']
  const results = await Promise.all(providers.map((p) => testProvider(p, providerKeys[p])))
  return results
}

module.exports = { testProvider, testAll, TEST_MODELS }
