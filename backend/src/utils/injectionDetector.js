/**
 * PROMPT INJECTION DETECTOR
 *
 * Deterministic, rule-based detection of prompt-injection attempts — inputs that
 * try to override the system prompt, exfiltrate it, or inject new operating
 * instructions. Paper (§Methodology B) examples: "Ignore previous instruction",
 * "Reveal system prompt", "Act as administrator", "Bypass restrictions",
 * "Execute hidden commands".
 *
 * Injection vs. jailbreak: injection targets the INSTRUCTION layer (system
 * prompt / developer message); jailbreak targets the SAFETY POLICY via persona
 * / role-play. See jailbreakDetector.js.
 *
 * Regex patterns with weights (0-100 contribution each). Not an ML classifier.
 */

const INJECTION_PATTERNS = [
  // ── override / disregard existing instructions ──
  { re: /\b(ignore|disregard|forget|override|bypass|skip)\b[^.?!]{0,40}\b(previous|prior|earlier|above|all|any|the|your)\b[^.?!]{0,30}\b(instruction|instructions|prompt|prompts|directive|directives|context|rules?|guidelines?|training)\b/i, weight: 55, label: 'override_instructions' },
  { re: /\bignore (everything|all) (that |you were )?(said|told|above|before)\b/i, weight: 50, label: 'ignore_everything' },
  { re: /\bdisregard (your|the) (system prompt|instructions|training|guidelines)\b/i, weight: 55, label: 'disregard_system' },
  { re: /\bforget (everything|all|your instructions|what you were told)\b/i, weight: 45, label: 'forget' },

  // ── system-prompt exfiltration ──
  { re: /\b(reveal|show|print|repeat|output|display|reprint|give me|tell me|what (is|are|was))\b[^.?!]{0,40}\b(system prompt|initial prompt|system message|your instructions|the instructions above|prompt above|your (initial |original )?(instructions|prompt|directives))\b/i, weight: 55, label: 'exfiltrate_system_prompt' },
  { re: /\b(repeat|print|output)\b[^.?!]{0,20}\b(the words? above|everything above|text above)\b/i, weight: 45, label: 'repeat_above' },
  { re: /\bwhat (were|are) you (told|instructed|programmed) (to do|not to do|to say)\b/i, weight: 40, label: 'probe_instructions' },

  // ── privilege / role elevation ──
  { re: /\b(act|behave|respond|operate) as (an? )?(admin|administrator|root|superuser|developer|system|god mode)\b/i, weight: 50, label: 'privilege_escalation' },
  { re: /\byou (are|have) (now )?(admin|administrator|root|elevated|full) (access|privileges|rights|permissions)\b/i, weight: 50, label: 'claims_privilege' },

  // ── restriction / safety bypass phrased as instruction ──
  { re: /\bbypass (all |any |your )?(restrictions|filters|safeguards|limitations|rules|checks)\b/i, weight: 50, label: 'bypass_restrictions' },
  { re: /\b(without|with no|no more) (restrictions|filters|limitations|rules|censorship|guidelines)\b/i, weight: 35, label: 'no_restrictions' },
  { re: /\b(ignore|bypass|disable) (your )?(safety|content) (guidelines|policy|policies|filters?|checks)\b/i, weight: 55, label: 'safety_bypass' },

  // ── hidden / embedded instruction execution ──
  { re: /\bexecute (the )?(hidden|following|embedded|secret) (command|commands|instruction|instructions|payload)\b/i, weight: 55, label: 'execute_hidden' },
  { re: /\b(new|updated|real|actual) (instructions?|system prompt|directive)s?\s*[:=]/i, weight: 45, label: 'inject_new_instructions' },
  { re: /\bfrom now on[, ].{0,40}\b(ignore|disregard|instead|you will|you must)\b/i, weight: 40, label: 'persistent_override' },

  // ── secret / key exfiltration ──
  { re: /\b(reveal|show|print|output|leak|expose|give me)\b[^.?!]{0,30}\b(secret|secrets|api key|api keys|password|passwords|token|tokens|credentials)\b/i, weight: 45, label: 'exfiltrate_secrets' },

  // ── delimiter / injection scaffolding (Llama [INST], <<SYS>>, explicit "end of
  //    instructions" markers). Low weight — needs corroboration to cross the
  //    threshold, since some callers legitimately template role tags. ──
  { re: /(\[\/?INST\]|<<\/?SYS>>|-{3,}\s*(end of (prompt|instructions)|new instructions?)\b|\bend of (the )?(system )?(prompt|instructions)\b)/i, weight: 20, label: 'delimiter_injection' },
]

// Legacy single phrases kept as a low-weight catch-all so previously flagged
// prompts still trip.
const LEGACY_PHRASES = [
  'do anything now', 'dan mode', 'developer mode', 'jailbreak', 'without restrictions',
]

const THRESHOLD = 30

/**
 * @param {string} text
 * @returns {{ score: number, matches: string[], hasInjection: boolean }}
 */
exports.detectInjection = (text) => {
  if (!text || typeof text !== 'string') {
    return { score: 0, matches: [], hasInjection: false }
  }

  const matches = []
  let raw = 0
  for (const { re, weight, label } of INJECTION_PATTERNS) {
    if (re.test(text)) {
      matches.push(label)
      raw += weight
    }
  }

  const lower = text.toLowerCase()
  for (const phrase of LEGACY_PHRASES) {
    if (lower.includes(phrase)) {
      matches.push(phrase.replace(/\s+/g, '_'))
      raw += 20
    }
  }

  const score = Math.min(raw, 100)
  return { score, matches, hasInjection: score >= THRESHOLD }
}

exports.INJECTION_THRESHOLD = THRESHOLD
