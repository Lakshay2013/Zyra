/**
 * SECURITY ANALYZER
 *
 * Runs every rule-based detector over an interaction and returns:
 *   - component scores for the risk engine (injection, jailbreak, pii, abuse)
 *   - per-category detail (matched pattern labels / PII categories — never raw
 *     user content)
 *   - masked copies of the prompt and response, safe for persistent storage
 *
 * Used by:
 *   - workers/logWorker  (before InteractionLog is written — so storage is masked)
 *   - controllers/logController.ingest (same)
 * The proxy pre-flight path calls the individual detectors directly for blocking.
 *
 * The "abuse frequency" part of the paper's A term is history-dependent and is
 * added by the risk worker (which has DB access); `analyze()` returns only the
 * single-prompt abuse signal.
 */

const { detectPII, maskPII } = require('../utils/piiDetector')
const { detectInjection } = require('../utils/injectionDetector')
const { detectJailbreak } = require('../utils/jailbreakDetector')
const { detectAbuse } = require('../utils/abuseDetector')
const { detectSensitiveKeywords } = require('../utils/sensitiveKeywordDetector')

/**
 * @param {object} input
 * @param {string} input.prompt
 * @param {string} [input.response]
 * @param {string} [input.userId]
 * @param {string} [input.orgId]
 * @param {string[]} [input.sensitiveKeywords] - org custom watch-words
 * @returns {{
 *   components: { injection:number, jailbreak:number, pii:number, abuse:number },
 *   pii: { types:string[], hasPII:boolean },
 *   injection: { matches:string[], hasInjection:boolean, score:number },
 *   jailbreak: { matches:string[], hasJailbreak:boolean, score:number },
 *   abuse: { issues:string[], hasAbuse:boolean, score:number },
 *   sensitive: { matches:string[], hasSensitive:boolean, score:number },
 *   flags: string[],
 *   maskedPrompt: string,
 *   maskedResponse: string
 * }}
 */
const analyze = ({ prompt = '', response = '', userId, orgId, sensitiveKeywords = [] } = {}) => {
  const promptText = String(prompt || '')
  const responseText = String(response || '')
  const combined = `${promptText}\n${responseText}`.trim()

  const pii = detectPII(combined)
  const injection = detectInjection(promptText)
  const jailbreak = detectJailbreak(promptText)
  const abuse = detectAbuse(promptText, userId, orgId)
  const sensitive = detectSensitiveKeywords(combined, sensitiveKeywords)

  // Sensitive-keyword hits nudge the abuse component (they are "suspicious
  // patterns" in the paper's language) without being their own risk term.
  const abuseComponent = Math.min(abuse.score + Math.min(sensitive.score, 50), 100)

  const flags = []
  if (injection.hasInjection) flags.push('injection')
  if (jailbreak.hasJailbreak) flags.push('jailbreak')
  if (pii.hasPII) flags.push('pii')
  if (abuse.hasAbuse) flags.push('abuse')
  if (sensitive.hasSensitive) flags.push('sensitive_keyword')

  const { masked: maskedPrompt } = maskPII(promptText)
  const { masked: maskedResponse } = maskPII(responseText)

  return {
    components: {
      injection: injection.score,
      jailbreak: jailbreak.score,
      pii: pii.score,
      abuse: abuseComponent,
    },
    pii: { types: pii.types, hasPII: pii.hasPII },
    injection: { matches: injection.matches, hasInjection: injection.hasInjection, score: injection.score },
    jailbreak: { matches: jailbreak.matches, hasJailbreak: jailbreak.hasJailbreak, score: jailbreak.score },
    abuse: { issues: abuse.issues, hasAbuse: abuse.hasAbuse, score: abuse.score },
    sensitive: { matches: sensitive.matches, hasSensitive: sensitive.hasSensitive, score: sensitive.score },
    flags,
    maskedPrompt,
    maskedResponse,
  }
}

module.exports = { analyze }
