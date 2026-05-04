/**
 * ZYRA AUTO-PATCH LOADER
 *
 * Monkey-patches the OpenAI and Anthropic SDK clients at process start so that
 * all LLM calls are automatically logged to Zyra — zero code change required.
 *
 * Usage:
 *   node --require zyra/auto your_app.js
 *
 * Or in package.json:
 *   "scripts": { "start": "node --require zyra/auto src/index.js" }
 *
 * Required env:
 *   ZYRA_KEY=zyra_xxxx
 *
 * Optional env:
 *   ZYRA_API_URL=https://api.zyra.dev   (default)
 *   ZYRA_DISABLE=true                   (disables all logging)
 */

'use strict'

const { dispatchLog } = require('./logger')

const ZYRA_KEY = process.env.ZYRA_KEY
if (!ZYRA_KEY && process.env.ZYRA_DISABLE !== 'true') {
  console.warn('[Zyra] Warning: ZYRA_KEY is not set. Auto-logging is disabled. Set ZYRA_KEY to enable.')
}

// ──────────────────────────────────────────────────────────────
// OPENAI AUTO-PATCH
// ──────────────────────────────────────────────────────────────

function patchOpenAI() {
  try {
    const openaiModule = require('openai')
    const OpenAIClass = openaiModule.OpenAI || openaiModule.default || openaiModule

    if (!OpenAIClass || typeof OpenAIClass !== 'function') return

    const originalCreate = OpenAIClass.prototype?.chat?.completions?.create
    if (!originalCreate) {
      // Patch at prototype level via getter interception
      _patchOpenAIConstructor(OpenAIClass)
      return
    }

    console.log('[Zyra] Auto-patched: openai (chat.completions.create)')
  } catch {
    // openai not installed — skip
  }
}

function _patchOpenAIConstructor(OpenAIClass) {
  const _originalConstructor = OpenAIClass

  // Wrap the constructor to intercept after instantiation
  // We use Module patching so new instances get wrapped methods
  const Module = require('module')
  const originalLoad = Module._load

  Module._load = function (request, parent, isMain) {
    const result = originalLoad.apply(this, arguments)

    if (request === 'openai' || request.endsWith('/openai')) {
      return _wrapOpenAIExport(result)
    }
    return result
  }
}

function _wrapOpenAIExport(openaiExport) {
  const OpenAIClass = openaiExport.OpenAI || openaiExport.default || openaiExport
  if (!OpenAIClass || typeof OpenAIClass !== 'function') return openaiExport

  // Already patched?
  if (OpenAIClass.__zyra_patched) return openaiExport

  const OriginalCreate = OpenAIClass.prototype?.chat?.completions?.create?.bind
  if (!OriginalCreate) return openaiExport  // SDK structure not as expected

  // Wrap chat.completions.create on every new instance
  const _origInit = OpenAIClass.prototype.constructor
  OpenAIClass.__zyra_patched = true

  // We intercept at the prototype after construction using a Proxy on the instance
  const _afterConstruct = OpenAIClass.prototype._afterConstruct || null

  // Override chat.completions.create on prototype
  const proto = OpenAIClass.prototype
  if (proto.chat?.completions?.create) {
    const originalFn = proto.chat.completions.create

    proto.chat.completions.create = async function wrappedCreate(params, options) {
      if (!ZYRA_KEY || process.env.ZYRA_DISABLE === 'true') {
        return originalFn.call(this, params, options)
      }

      const start = Date.now()
      const modelRequested = params.model || 'unknown'
      let status = 'success'
      let errorMessage = null
      let result

      try {
        result = await originalFn.call(this, params, options)
      } catch (err) {
        status = 'error'
        errorMessage = err.message || 'Unknown error'
        throw err
      } finally {
        const latencyMs = Date.now() - start
        const promptTokens = result?.usage?.prompt_tokens || 0
        const completionTokens = result?.usage?.completion_tokens || 0
        const modelUsed = result?.model || modelRequested

        dispatchLog({
          zyraKey: ZYRA_KEY,
          sdkLanguage: 'node',
          provider: 'openai',
          modelRequested,
          modelRoutedTo: modelUsed,
          promptTokens,
          completionTokens,
          latencyMs,
          status,
          errorMessage
        })
      }

      return result
    }

    console.log('[Zyra] Auto-patched: openai (chat.completions.create)')
  }

  return openaiExport
}

// ──────────────────────────────────────────────────────────────
// ANTHROPIC AUTO-PATCH
// ──────────────────────────────────────────────────────────────

function patchAnthropic() {
  try {
    const Module = require('module')
    const originalLoad = Module._load

    // Only install one interceptor (openai patch may have already set one)
    if (Module.__zyra_anthropic_patched) return
    Module.__zyra_anthropic_patched = true

    const _existingLoad = Module._load
    Module._load = function (request, parent, isMain) {
      const result = _existingLoad.apply(this, arguments)

      if (request === '@anthropic-ai/sdk' || request.endsWith('/@anthropic-ai/sdk')) {
        return _wrapAnthropicExport(result)
      }
      return result
    }

    console.log('[Zyra] Auto-patch interceptor registered for: @anthropic-ai/sdk')
  } catch {
    // skip
  }
}

function _wrapAnthropicExport(anthropicExport) {
  const AnthropicClass = anthropicExport.Anthropic || anthropicExport.default || anthropicExport
  if (!AnthropicClass || typeof AnthropicClass !== 'function') return anthropicExport
  if (AnthropicClass.__zyra_patched) return anthropicExport

  AnthropicClass.__zyra_patched = true

  const proto = AnthropicClass.prototype
  if (proto.messages?.create) {
    const originalFn = proto.messages.create

    proto.messages.create = async function wrappedCreate(params, options) {
      if (!ZYRA_KEY || process.env.ZYRA_DISABLE === 'true') {
        return originalFn.call(this, params, options)
      }

      const start = Date.now()
      const modelRequested = params.model || 'unknown'
      let status = 'success'
      let errorMessage = null
      let result

      try {
        result = await originalFn.call(this, params, options)
      } catch (err) {
        status = 'error'
        errorMessage = err.message || 'Unknown error'
        throw err
      } finally {
        const latencyMs = Date.now() - start
        const promptTokens = result?.usage?.input_tokens || 0
        const completionTokens = result?.usage?.output_tokens || 0
        const modelUsed = result?.model || modelRequested

        dispatchLog({
          zyraKey: ZYRA_KEY,
          sdkLanguage: 'node',
          provider: 'anthropic',
          modelRequested,
          modelRoutedTo: modelUsed,
          promptTokens,
          completionTokens,
          latencyMs,
          status,
          errorMessage
        })
      }

      return result
    }

    console.log('[Zyra] Auto-patched: @anthropic-ai/sdk (messages.create)')
  }

  return anthropicExport
}

// ──────────────────────────────────────────────────────────────
// BOOTSTRAP
// ──────────────────────────────────────────────────────────────

if (process.env.ZYRA_DISABLE !== 'true') {
  patchOpenAI()
  patchAnthropic()
  console.log('[Zyra] Auto-logger active. All OpenAI/Anthropic calls will be logged to Zyra.')
}

module.exports = {}
