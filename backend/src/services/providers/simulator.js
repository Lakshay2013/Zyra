/**
 * SIMULATOR PROVIDER  (demo / offline mode)
 *
 * Produces deterministic, OpenAI-shaped chat completions WITHOUT calling any
 * external LLM. Used when an organisation has `demoMode` enabled so the whole
 * Zyra pipeline — routing, cost, logging, risk analysis, dashboards — can be
 * demonstrated with no provider API keys.
 *
 * It is NOT a language model. Responses are templated. Token counts are
 * estimated from text length so cost maths stays realistic. Every response is
 * clearly attributable to the simulator (provider = "simulator" in logs).
 */

const estimateTokens = (text) => Math.max(1, Math.ceil((text || '').length / 4))

const canned = (promptText) => {
  const p = (promptText || '').toLowerCase()
  if (/photosynthesis/.test(p)) {
    return 'Photosynthesis is the process by which green plants, algae and some bacteria convert light energy into chemical energy. Using sunlight, water and carbon dioxide, chloroplasts produce glucose and release oxygen as a by-product.'
  }
  if (/\b(hi|hello|hey)\b/.test(p)) {
    return 'Hello! This is a simulated Zyra response. Ask me anything and I will echo a templated answer so you can see the full logging, risk and cost pipeline working.'
  }
  if (/capital of france/.test(p)) return 'The capital of France is Paris.'
  if (/\b(sum|add|plus)\b/.test(p) || /\d\s*\+\s*\d/.test(p)) {
    return 'Simulated arithmetic response: the operation completed. (The simulator does not actually compute — enable a real provider for live answers.)'
  }
  if (/write .*code|function|refactor|debug|algorithm/.test(p)) {
    return '```js\n// Simulated code response from Zyra demo mode\nfunction example(input) {\n  return String(input).trim().toLowerCase()\n}\n```\nThis is a templated answer used for demonstrating routing to a higher quality tier on complex prompts.'
  }
  return `Simulated response to: "${(promptText || '').slice(0, 140)}". Zyra demo mode is active, so no external LLM was called. The interaction is still logged, risk-scored and cost-estimated exactly as a real request would be.`
}

/**
 * @param {object} requestBody OpenAI chat-completions request (already routed — requestBody.model is the final model)
 * @param {string} promptText  flattened prompt (for templating + token estimate)
 * @returns {{ status: number, data: object }}
 */
const generate = (requestBody, promptText) => {
  const model = requestBody.model || 'simulator'
  const content = canned(promptText)
  const promptTokens = estimateTokens(promptText)
  const completionTokens = estimateTokens(content)

  return {
    status: 200,
    data: {
      id: `chatcmpl-sim-${Date.now().toString(36)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      system_fingerprint: 'zyra-simulator',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    },
  }
}

module.exports = { generate, estimateTokens }
