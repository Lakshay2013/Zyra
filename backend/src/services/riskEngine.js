/**
 * RISK ENGINE
 *
 * Single source of truth for Zyra's risk score.
 *
 * Paper (§Methodology D — Risk Score Generation):
 *
 *     R = 0.35·I + 0.30·J + 0.20·P + 0.15·A
 *
 *   I = Prompt Injection Score   (0-100)
 *   J = Jailbreak Score          (0-100)
 *   P = PII Exposure Score       (0-100)
 *   A = Abuse Frequency Score    (0-100)
 *
 *   Result R is on a 0-100 scale.
 *   "Whenever the score reaches over 80, the administrator gets a dashboard
 *    notification."
 *
 * Severity bands are an implementation choice (the paper's interpretation table
 * is a figure, not machine-readable) — documented in docs/PAPER_COMPLIANCE.md.
 */

const WEIGHTS = { injection: 0.35, jailbreak: 0.30, pii: 0.20, abuse: 0.15 }

const NOTIFY_THRESHOLD = 80

const clamp = (n) => {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
}

/**
 * @param {number} score 0-100
 * @returns {'low'|'medium'|'high'|'critical'}
 */
const severityFor = (score) => {
  if (score >= 80) return 'critical'
  if (score >= 50) return 'high'
  if (score >= 25) return 'medium'
  return 'low'
}

/**
 * Compute the composite risk score from the four component scores.
 *
 * @param {object} components
 * @param {number} components.injection  I — prompt injection score (0-100)
 * @param {number} components.jailbreak  J — jailbreak score (0-100)
 * @param {number} components.pii        P — PII exposure score (0-100)
 * @param {number} components.abuse      A — abuse frequency score (0-100)
 * @returns {{
 *   riskScore: number, severity: string, shouldNotify: boolean,
 *   weights: object, components: { injection, jailbreak, pii, abuse }
 * }}
 */
const computeRisk = (components = {}) => {
  const c = {
    injection: clamp(components.injection),
    jailbreak: clamp(components.jailbreak),
    pii: clamp(components.pii),
    abuse: clamp(components.abuse),
  }

  const riskScore = Math.round(
    WEIGHTS.injection * c.injection +
    WEIGHTS.jailbreak * c.jailbreak +
    WEIGHTS.pii * c.pii +
    WEIGHTS.abuse * c.abuse
  )

  return {
    riskScore,
    severity: severityFor(riskScore),
    shouldNotify: riskScore > NOTIFY_THRESHOLD,
    weights: { ...WEIGHTS },
    components: c,
  }
}

module.exports = { computeRisk, severityFor, RISK_WEIGHTS: WEIGHTS, NOTIFY_THRESHOLD }
