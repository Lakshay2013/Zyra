/**
 * GEMINI ADAPTER
 *
 * Translates between the OpenAI chat-completions wire format (what Zyra speaks
 * everywhere else) and Google's Generative Language API (`generateContent`).
 *
 * Google's API is NOT OpenAI-compatible on the native endpoint:
 *   - auth is an `x-goog-api-key` header (or `?key=`), never a Bearer token
 *   - messages become `contents[].parts[].text` with role `user` | `model`
 *   - the system prompt is a separate `systemInstruction`
 *   - sampling params live under `generationConfig`
 *   - usage is reported as `usageMetadata.{promptTokenCount,candidatesTokenCount}`
 *
 * Google also ships an OpenAI-compatibility layer at `/v1beta/openai/*`, but the
 * native endpoint is the documented primary and gives us usage metadata reliably,
 * so we translate explicitly here.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

const DEFAULT_MODEL = 'gemini-2.0-flash'

/** Strip a leading `models/` and any `gemini/` provider prefix. */
const normalizeModelName = (model) => {
  if (!model) return DEFAULT_MODEL
  return model.replace(/^models\//, '').replace(/^gemini\//, '')
}

/** OpenAI role → Gemini role. */
const toGeminiRole = (role) => (role === 'assistant' ? 'model' : 'user')

/**
 * Convert an OpenAI-style body into a Gemini `generateContent` request body.
 * @param {object} body - { messages, temperature, max_tokens, top_p, stop, ... }
 */
const toGeminiRequest = (body = {}) => {
  const messages = Array.isArray(body.messages) ? body.messages : []

  const systemParts = []
  const contents = []

  for (const msg of messages) {
    const text = typeof msg.content === 'string'
      ? msg.content
      : Array.isArray(msg.content)
        ? msg.content.map((p) => (typeof p === 'string' ? p : p.text || '')).join('\n')
        : JSON.stringify(msg.content ?? '')

    if (msg.role === 'system') {
      systemParts.push({ text })
      continue
    }
    contents.push({ role: toGeminiRole(msg.role), parts: [{ text }] })
  }

  const generationConfig = {}
  if (body.temperature != null) generationConfig.temperature = body.temperature
  if (body.top_p != null) generationConfig.topP = body.top_p
  const maxTokens = body.max_tokens ?? body.max_output_tokens
  if (maxTokens != null) generationConfig.maxOutputTokens = maxTokens
  if (body.stop != null) {
    generationConfig.stopSequences = Array.isArray(body.stop) ? body.stop : [body.stop]
  }
  if (body.n != null) generationConfig.candidateCount = body.n

  const req = { contents }
  if (systemParts.length) req.systemInstruction = { parts: systemParts }
  if (Object.keys(generationConfig).length) req.generationConfig = generationConfig
  return req
}

const FINISH_REASON_MAP = {
  STOP: 'stop',
  MAX_TOKENS: 'length',
  SAFETY: 'content_filter',
  RECITATION: 'content_filter',
  OTHER: 'stop',
}

/**
 * Convert a Gemini `generateContent` response into an OpenAI chat-completion.
 * @param {object} data - raw Gemini response body
 * @param {string} model - the model id to echo back
 */
const toOpenAIResponse = (data = {}, model = DEFAULT_MODEL) => {
  const candidates = Array.isArray(data.candidates) ? data.candidates : []
  const usage = data.usageMetadata || {}

  const choices = candidates.map((c, i) => {
    const parts = c.content?.parts || []
    const text = parts.map((p) => p.text || '').join('')
    return {
      index: i,
      message: { role: 'assistant', content: text },
      finish_reason: FINISH_REASON_MAP[c.finishReason] || 'stop',
    }
  })

  if (choices.length === 0) {
    choices.push({ index: 0, message: { role: 'assistant', content: '' }, finish_reason: 'stop' })
  }

  const promptTokens = usage.promptTokenCount || 0
  const completionTokens = usage.candidatesTokenCount || 0

  return {
    id: `chatcmpl-gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: usage.totalTokenCount || promptTokens + completionTokens,
    },
  }
}

/** Extract { prompt, completion, total } from a raw Gemini response. */
const extractGeminiTokens = (data = {}) => {
  const u = data.usageMetadata || {}
  const prompt = u.promptTokenCount || 0
  const completion = u.candidatesTokenCount || 0
  return { prompt, completion, total: u.totalTokenCount || prompt + completion }
}

/**
 * Build an axios request config for a Gemini call from an OpenAI-style body.
 * @param {string} model
 * @param {object} openAiBody
 * @param {string} apiKey - raw Google API key (NOT "Bearer ...")
 * @param {object} opts   - { stream }
 */
const buildGeminiRequestConfig = (model, openAiBody, apiKey, opts = {}) => {
  const name = normalizeModelName(model)
  const method = opts.stream ? 'streamGenerateContent' : 'generateContent'
  const query = opts.stream ? '?alt=sse' : ''
  // Google accepts the key either as a header or ?key=. The header keeps it out
  // of URLs/logs, so prefer it.
  const rawKey = String(apiKey || '').replace(/^Bearer\s+/i, '')
  return {
    method: 'POST',
    url: `${GEMINI_BASE}/models/${name}:${method}${query}`,
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': rawKey,
    },
    data: toGeminiRequest(openAiBody),
    timeout: 60000,
  }
}

module.exports = {
  GEMINI_BASE,
  normalizeModelName,
  toGeminiRequest,
  toOpenAIResponse,
  extractGeminiTokens,
  buildGeminiRequestConfig,
}
