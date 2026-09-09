/**
 * SENSITIVE KEYWORD DETECTOR
 *
 * Flags prompts/responses that mention organisationally sensitive terms:
 * confidentiality markers, credential/secret vocabulary, and any custom
 * watch-words an organisation configures (`Organization.policies.sensitiveKeywords`).
 *
 * The paper (§Proposed Solution B.3 and §B Functional Modules) lists
 * "Sensitive Keyword Detection" as a distinct module in the processing engine,
 * separate from abuse detection. This detector is that module.
 *
 * Rule-based, case-insensitive, whole-word matching. Not an ML classifier.
 */

// Built-in watch-words. Deliberately about data sensitivity / secret handling,
// NOT harmful-content requests (those are `abuseDetector`).
const DEFAULT_KEYWORDS = [
  'confidential',
  'classified',
  'top secret',
  'internal only',
  'do not distribute',
  'proprietary',
  'trade secret',
  'nda',
  'non-disclosure',
  'password',
  'passwd',
  'credentials',
  'secret key',
  'api key',
  'access token',
  'private key',
  'ssh key',
  'client secret',
  'bank account',
  'routing number',
  'social security',
  'salary',
  'payroll',
]

/**
 * Build a matcher for a keyword. Multi-word phrases match as substrings;
 * single words match on word boundaries so "nda" doesn't hit "Rwanda".
 */
const toRegExp = (kw) => {
  const escaped = kw.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!escaped) return null
  return /\s/.test(escaped)
    ? new RegExp(escaped, 'i')
    : new RegExp(`\\b${escaped}\\b`, 'i')
}

/**
 * @param {string} text
 * @param {string[]} [customKeywords] - org-configured extra watch-words
 * @returns {{ score: number, matches: string[], hasSensitive: boolean }}
 *   matches contains the KEYWORDS that fired (safe to show — they are the
 *   configured watch-list, not user content).
 */
const detectSensitiveKeywords = (text, customKeywords = []) => {
  if (!text || typeof text !== 'string') {
    return { score: 0, matches: [], hasSensitive: false }
  }

  const keywords = [
    ...DEFAULT_KEYWORDS,
    ...(Array.isArray(customKeywords) ? customKeywords : []),
  ]

  const seen = new Set()
  const matches = []
  for (const kw of keywords) {
    const key = String(kw).trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    const re = toRegExp(key)
    if (re && re.test(text)) matches.push(key)
  }

  // Each distinct hit adds 25, capped at 100.
  const score = Math.min(matches.length * 25, 100)
  return { score, matches, hasSensitive: matches.length > 0 }
}

module.exports = { detectSensitiveKeywords, DEFAULT_SENSITIVE_KEYWORDS: DEFAULT_KEYWORDS }
