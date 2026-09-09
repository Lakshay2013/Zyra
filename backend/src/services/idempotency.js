/**
 * IDEMPOTENCY
 *
 * Guards POST /v1/chat/completions against duplicate provider execution when a
 * client retries with the same `Idempotency-Key`.
 *
 * Model (Redis-backed):
 *   idem:lock:<org>:<key>    short-lived lock held while the first request runs
 *   idem:res:<org>:<key>     JSON { status, body, fingerprint } of the completed result
 *
 * Behaviour:
 *   - first request for a key  → acquires the lock, runs normally, then stores the result
 *   - retry after completion    → returns the stored result, provider is NOT called again
 *   - retry while in flight      → waits briefly for the result; otherwise 409
 *   - same key, different body   → 422 (key reuse)
 *
 * Redis unavailable → idempotency is skipped (fail-open); the proxy still works.
 */

const crypto = require('crypto')
const { getRedis, isRedisReady } = require('./cacheLayer')

const LOCK_TTL_SECONDS = 90          // max time we expect a single upstream call to take
const RESULT_TTL_SECONDS = 24 * 3600 // how long a completed result is replayable
const WAIT_TIMEOUT_MS = 25_000       // how long a concurrent retry waits for the in-flight result
const WAIT_POLL_MS = 400

const fingerprint = (body) => {
  const canonical = JSON.stringify({
    model: body.model,
    messages: body.messages,
    temperature: body.temperature,
    max_tokens: body.max_tokens,
    top_p: body.top_p,
    stream: body.stream,
  })
  return crypto.createHash('sha256').update(canonical).digest('hex')
}

const lockKey = (orgId, key) => `idem:lock:${orgId}:${key}`
const resultKey = (orgId, key) => `idem:res:${orgId}:${key}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Begin an idempotent operation.
 * @returns {Promise<object>} one of:
 *   { mode: 'disabled' }                         – no key, or Redis down → run normally, don't finalize
 *   { mode: 'proceed', finalize }                – run normally, then call finalize(status, body)
 *   { mode: 'replay', status, body }             – return this stored result, do NOT call the provider
 *   { mode: 'conflict', status: 409 }            – another identical request is still in flight
 *   { mode: 'mismatch', status: 422 }            – key already used with a different request body
 */
const begin = async (orgId, idemKey, body) => {
  if (!idemKey || !isRedisReady()) return { mode: 'disabled' }

  const redis = getRedis()
  const fp = fingerprint(body)
  const rKey = resultKey(orgId, idemKey)
  const lKey = lockKey(orgId, idemKey)

  const existing = await redis.get(rKey)
  if (existing) return replayOrMismatch(existing, fp)

  // Try to acquire the lock
  const acquired = await redis.set(lKey, fp, 'EX', LOCK_TTL_SECONDS, 'NX')
  if (acquired === 'OK') {
    return {
      mode: 'proceed',
      finalize: async (status, respBody) => {
        try {
          await redis.set(rKey, JSON.stringify({ status, body: respBody, fingerprint: fp }), 'EX', RESULT_TTL_SECONDS)
          await redis.del(lKey)
        } catch { /* non-fatal */ }
      },
      release: async () => { try { await redis.del(lKey) } catch {} },
    }
  }

  // Lock held by someone else — if their body differs, it's key reuse
  const lockedFp = await redis.get(lKey)
  if (lockedFp && lockedFp !== fp) return { mode: 'mismatch', status: 422 }

  // Wait for the in-flight request to publish its result
  const deadline = Date.now() + WAIT_TIMEOUT_MS
  while (Date.now() < deadline) {
    await sleep(WAIT_POLL_MS)
    const done = await redis.get(rKey)
    if (done) return replayOrMismatch(done, fp)
    const stillLocked = await redis.get(lKey)
    if (!stillLocked) break // holder died without finalizing — let caller retry fresh
  }
  return { mode: 'conflict', status: 409 }
}

const replayOrMismatch = (stored, fp) => {
  try {
    const parsed = JSON.parse(stored)
    if (parsed.fingerprint && parsed.fingerprint !== fp) return { mode: 'mismatch', status: 422 }
    return { mode: 'replay', status: parsed.status, body: parsed.body }
  } catch {
    return { mode: 'disabled' }
  }
}

module.exports = { begin, fingerprint, LOCK_TTL_SECONDS, RESULT_TTL_SECONDS }
