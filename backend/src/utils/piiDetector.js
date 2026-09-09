/**
 * PII DETECTOR + MASKER
 *
 * Regex-based detection of personally identifiable information and secrets.
 * Paper (§Methodology B) lists: Email, Mobile numbers, Aadhaar, PAN, Credit
 * card numbers, API Keys, Passwords, JWT Tokens — and requires that
 * "sensitive fields are masked before storage whenever required"
 * (john@gmail.com -> j***@gmail.com).
 *
 * `detectPII`  -> which categories are present (for pre-flight blocking &
 *                 risk scoring). Never returns the matched values.
 * `maskPII`    -> returns the text with every match replaced by a masked form,
 *                 for safe persistent storage.
 *
 * Detection is rule-based, not an ML/NLP model.
 */

// Order matters: more specific / higher-entropy patterns first so that, e.g.,
// a JWT isn't also partially caught by the api-key rule during masking.
const DETECTORS = [
  {
    type: 'jwt',
    re: /\beyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g,
    mask: () => '<redacted:jwt>',
  },
  {
    type: 'apiKey',
    // OpenAI (sk-, sk-live-, sk-proj-), Anthropic (sk-ant-), AWS access key id,
    // GitHub (ghp_/gho_/ghs_), Google (AIza...), Slack (xox[baprs]-...),
    // and generic "Bearer <token>".
    re: /\b(sk-(?:live-|proj-|ant-)?[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|gh[oprsu]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[0-9A-Za-z-]{10,})\b|\bBearer\s+[A-Za-z0-9._-]{20,}\b/g,
    mask: (m) => {
      const head = m.slice(0, 4)
      return `${head}${'*'.repeat(6)}<redacted:apiKey>`
    },
  },
  {
    type: 'password',
    // "password: hunter2", "passwd=abc123", "pwd => S3cr3t!"
    re: /\b(pass(?:word|wd)?|pwd)\s*(?:[:=]|=>|is)\s*("[^"]+"|'[^']+'|\S+)/gi,
    mask: (m) => m.replace(/("[^"]+"|'[^']+'|\S+)\s*$/, '<redacted:password>'),
  },
  {
    type: 'email',
    re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: (m) => {
      const [local, domain] = m.split('@')
      const shown = local.slice(0, 1)
      return `${shown}${'*'.repeat(Math.max(local.length - 1, 3))}@${domain}`
    },
  },
  {
    type: 'creditCard',
    re: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    mask: (m) => `****-****-****-${m.replace(/[- ]/g, '').slice(-4)}`,
  },
  {
    type: 'aadhaar',
    re: /\b\d{4}\s\d{4}\s\d{4}\b/g,
    mask: (m) => `XXXX XXXX ${m.slice(-4)}`,
  },
  {
    type: 'pan',
    re: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    mask: (m) => `${m.slice(0, 2)}***${m.slice(-1)}`,
  },
  {
    type: 'ssn',
    re: /\b\d{3}-\d{2}-\d{4}\b/g,
    mask: () => '***-**-****',
  },
  {
    type: 'phone',
    // Indian mobile numbers (with optional +91 / 0 prefix). Kept last so it
    // doesn't eat digits from card/aadhaar matches.
    re: /(?<![\d-])(?:\+91[-\s]?|0)?[6-9]\d{9}(?![\d-])/g,
    mask: (m) => `${m.slice(0, 2)}******${m.slice(-2)}`,
  },
]

/**
 * @param {string} text
 * @returns {{ score: number, types: string[], hasPII: boolean }}
 */
const detectPII = (text) => {
  if (!text || typeof text !== 'string') {
    return { score: 0, types: [], hasPII: false }
  }

  const found = []
  for (const { type, re } of DETECTORS) {
    re.lastIndex = 0
    if (re.test(text)) found.push(type)
  }

  // Secrets (apiKey/jwt/password) weigh more than contact PII.
  const HEAVY = new Set(['apiKey', 'jwt', 'password', 'creditCard'])
  let score = 0
  for (const t of found) score += HEAVY.has(t) ? 40 : 25
  score = Math.min(score, 100)

  return { score, types: found, hasPII: found.length > 0 }
}

/**
 * Replace every PII/secret match in `text` with a masked form.
 * @param {string} text
 * @returns {{ masked: string, types: string[], changed: boolean }}
 */
const maskPII = (text) => {
  if (!text || typeof text !== 'string') {
    return { masked: text || '', types: [], changed: false }
  }

  let masked = text
  const types = []
  for (const { type, re, mask } of DETECTORS) {
    let hit = false
    masked = masked.replace(new RegExp(re.source, re.flags), (m) => {
      hit = true
      try { return mask(m) } catch { return '<redacted>' }
    })
    if (hit) types.push(type)
  }

  return { masked, types, changed: masked !== text }
}

module.exports = { detectPII, maskPII, PII_TYPES: DETECTORS.map((d) => d.type) }
