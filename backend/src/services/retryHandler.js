const axios = require('axios')

// Status codes that are safe to retry
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])
const RETRYABLE_ERROR_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN'])

/**
 * Execute an HTTP request with retry + exponential backoff + fallback.
 *
 * @param {Object} primaryRequest - The axios request config for the primary provider
 * @param {Object} options
 * @param {number} options.maxRetries - Max retry attempts (default: 2)
 * @param {number} options.baseDelay - Base delay in ms (default: 500)
 * @param {Object[]} options.fallbacks - Array of { requestConfig, provider, model } for fallback providers
 * @returns {Object} { response, provider, model, retryCount, fallbackUsed, fallbackProvider }
 */
const executeWithRetry = async (primaryRequest, options = {}) => {
  const {
    maxRetries = 2,
    baseDelay = 500,
    fallbacks = [],
    provider: primaryProvider = 'unknown',
    model: primaryModel = 'unknown'
  } = options

  // Try primary provider with retries
  const primaryResult = await attemptWithRetries(primaryRequest, maxRetries, baseDelay)

  if (primaryResult.success) {
    return {
      response: primaryResult.response,
      provider: primaryProvider,
      model: primaryModel,
      retryCount: primaryResult.attempts - 1,
      fallbackUsed: false,
      fallbackProvider: null
    }
  }

  // Primary failed after all retries — try fallbacks in order
  for (const fallback of fallbacks) {
    console.warn(`[RetryHandler] Primary ${primaryProvider} failed. Trying fallback: ${fallback.provider}`)

    const fallbackResult = await attemptWithRetries(fallback.requestConfig, 1, baseDelay)

    if (fallbackResult.success) {
      return {
        response: fallbackResult.response,
        provider: fallback.provider,
        model: fallback.model,
        retryCount: primaryResult.attempts - 1,
        fallbackUsed: true,
        fallbackProvider: fallback.provider
      }
    }
  }

  // Everything failed — throw the original error
  throw primaryResult.lastError
}

/**
 * Attempt a request with retries and exponential backoff.
 */
const attemptWithRetries = async (requestConfig, maxRetries, baseDelay) => {
  let lastError = null
  const totalAttempts = maxRetries + 1 // 1 initial + N retries

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      const response = await axios(requestConfig)
      return { success: true, response, attempts: attempt }
    } catch (err) {
      lastError = err

      // Check if this is a retryable error
      const statusCode = err.response?.status
      const errorCode = err.code

      const isRetryable = (statusCode && RETRYABLE_STATUS_CODES.has(statusCode)) ||
                          (errorCode && RETRYABLE_ERROR_CODES.has(errorCode))

      if (!isRetryable || attempt >= totalAttempts) {
        return { success: false, attempts: attempt, lastError: err }
      }

      // Exponential backoff with jitter
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * 200, 10000)
      console.warn(`[RetryHandler] Attempt ${attempt}/${totalAttempts} failed (${statusCode || errorCode}). Retrying in ${Math.round(delay)}ms...`)
      await sleep(delay)
    }
  }

  return { success: false, attempts: totalAttempts, lastError }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

module.exports = { executeWithRetry }
