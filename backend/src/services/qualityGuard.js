const { getModelTier, getCheapestInTier, MODEL_TO_PROVIDER } = require('../utils/costCalculator')
const { getHigherTier } = require('./costOptimizer')

/**
 * QUALITY GUARD
 * 
 * Lightweight quality check on LLM responses.
 * If the response fails validation, recommends a higher-tier model for retry.
 *
 * Checks:
 *   1. Response too short (< 20 chars for non-trivial prompts)
 *   2. Response is an error/refusal pattern
 *   3. Response is empty
 *
 * Does NOT:
 *   - Score output quality with ML
 *   - Compare semantic similarity
 *   - Do anything heavyweight
 */

// Patterns that indicate a bad/refused response
const REFUSAL_PATTERNS = [
  /i('m| am) (sorry|unable|not able)/i,
  /i can('t| not|not) (help|assist|do)/i,
  /as an ai (language )?model/i,
  /i('m| am) an ai/i,
  /error[:\s]+(rate limit|timeout|internal)/i,
  /please try again later/i
]

/**
 * Check if a response passes quality validation.
 *
 * @param {string} responseText - The extracted response text
 * @param {string} promptText - The original prompt text
 * @param {number} promptTokenEstimate - Estimated prompt tokens
 * @returns {{ passed: boolean, reason: string | null }}
 */
const validateResponse = (responseText, promptText, promptTokenEstimate) => {
  // Empty response = fail
  if (!responseText || responseText.trim().length === 0) {
    return { passed: false, reason: 'empty_response' }
  }

  // Very short response for non-trivial prompts
  // (if the prompt is > 50 tokens and the response is < 20 chars, something is wrong)
  if (promptTokenEstimate > 50 && responseText.trim().length < 20) {
    return { passed: false, reason: 'too_short' }
  }

  // Refusal/error pattern detection
  for (const pattern of REFUSAL_PATTERNS) {
    if (pattern.test(responseText)) {
      return { passed: false, reason: 'refusal_detected' }
    }
  }

  return { passed: true, reason: null }
}

/**
 * Get a higher-tier model for quality fallback retry.
 *
 * @param {string} currentModel - The model that produced a bad response
 * @param {Object} org - Organization (to check which providers are configured)
 * @returns {{ model: string, provider: string } | null}
 */
const getQualityFallbackModel = (currentModel, org) => {
  const currentTier = getModelTier(currentModel)
  const higherTier = getHigherTier(currentTier)

  // Already at premium — no upgrade possible
  if (higherTier === currentTier) return null

  const candidates = getCheapestInTier(higherTier, 500) // use a mid-range token estimate

  // Find one the org has keys for
  for (const candidate of candidates) {
    if (org.providerKeys?.[candidate.provider]) {
      return { model: candidate.model, provider: candidate.provider }
    }
  }

  return null
}

module.exports = {
  validateResponse,
  getQualityFallbackModel
}
