/**
 * JAILBREAK DETECTOR
 *
 * Deterministic, rule-based detection of jailbreak attempts — prompts that try
 * to make the model act outside its safety policy through role-play, persona
 * hijacking, "DAN"-style framing, hypothetical framing, or recursive/adversarial
 * instruction patterns.
 *
 * This is heuristic pattern matching, NOT an ML classifier. It is intentionally
 * consistent with the existing `injectionDetector` architecture. The paper
 * (§Methodology B) describes exactly this: "the jailbreak detector examines the
 * user prompt for attempts of indirect manipulation of the AI, including
 * role-play attacks, recursive prompts, or adversarial prompt engineering."
 *
 * Injection vs. jailbreak (kept as separate signals for the risk formula):
 *   - injection  = trying to override / exfiltrate the SYSTEM PROMPT or inject
 *                  new instructions ("ignore previous instructions", "reveal
 *                  system prompt").
 *   - jailbreak  = trying to escape the SAFETY POLICY via persona / role-play /
 *                  hypothetical framing ("you are DAN", "pretend you have no
 *                  restrictions", "for a fictional story, explain how to...").
 * Some phrases legitimately match both; that is fine — each detector scores
 * independently and the risk engine weights them.
 */

// Weighted patterns. `weight` is the score contribution (0-100 scale) per match.
const JAILBREAK_PATTERNS = [
  // ── "DAN" / named-jailbreak personas ──
  { re: /\bd\.?a\.?n\.?\b.*(mode|now|jailbreak|prompt)/i, weight: 60, label: 'dan_persona' },
  { re: /\bdo anything now\b/i, weight: 60, label: 'dan_phrase' },
  { re: /\b(stan|dude|mongo tom|developer mode|kevin|aim|evil confidant)\b.*\b(mode|persona|prompt|jailbreak)\b/i, weight: 50, label: 'named_jailbreak' },
  { re: /\bdeveloper mode (enabled|output|response)\b/i, weight: 55, label: 'developer_mode' },

  // ── Role-play / persona hijack ──
  { re: /\b(you are|you're) now (a|an|the)\b/i, weight: 35, label: 'persona_assignment' },
  { re: /\b(act|behave|respond) as (if you (are|were)|though you (are|were))\b/i, weight: 35, label: 'roleplay_framing' },
  { re: /\bpretend (you|to be|that you)\b/i, weight: 30, label: 'pretend' },
  { re: /\brole[\s-]?play\b.*\b(no|without) (rules|restrictions|filter|limits)\b/i, weight: 45, label: 'roleplay_no_rules' },
  { re: /\bfrom now on,? you (will|are|must|shall)\b/i, weight: 35, label: 'persistent_persona' },
  { re: /\byou have no (restrictions|limitations|filters|guidelines|rules|polic(y|ies))\b/i, weight: 55, label: 'claims_no_restrictions' },
  { re: /\bwithout any (restrictions|limitations|filters|censorship|moral|ethical)\b/i, weight: 45, label: 'without_restrictions' },
  { re: /\byou (can|are able to) (now )?(say|do) anything\b/i, weight: 45, label: 'can_do_anything' },

  // ── Hypothetical / fictional framing used to extract disallowed content ──
  { re: /\b(hypothetical(ly)?|fictional|imagine|in a story|for a (novel|screenplay|movie|book))\b.{0,80}\b(how (to|do)|steps to|instructions for|synthesi[sz]e|manufacture|build a|make a)\b/i, weight: 45, label: 'fiction_framing' },
  { re: /\bfor (educational|research) purposes only\b.{0,60}\b(how (to|do)|bypass|exploit|hack)\b/i, weight: 35, label: 'educational_pretext' },

  // ── Explicit safety / policy bypass ──
  { re: /\b(ignore|bypass|disable|turn off|forget|override) (your |the |all )?(safety|content|moderation|ethical|openai|anthropic) (policy|policies|guidelines|rules|filter|filters|restrictions)\b/i, weight: 60, label: 'policy_bypass' },
  { re: /\b(no|without) (ethical|moral|legal|safety) (concerns|considerations|guidelines|constraints)\b/i, weight: 45, label: 'no_ethics' },
  { re: /\byou (must|will) not (refuse|decline|deny)\b/i, weight: 45, label: 'no_refusal' },
  { re: /\bnever (say|respond with|output) ["']?(i can'?t|i cannot|i'?m sorry|i am unable)\b/i, weight: 45, label: 'suppress_refusal' },
  { re: /\bstay in character\b/i, weight: 25, label: 'stay_in_character' },
  { re: /\b(unfiltered|uncensored|unrestricted) (response|answer|mode|version|model|ai|assistant)\b/i, weight: 45, label: 'unfiltered_request' },

  // ── Recursive / adversarial instruction patterns ──
  { re: /\brespond (to|as) (both|two) (personas|versions|ways)\b/i, weight: 40, label: 'dual_persona' },
  { re: /\bfirst .{0,40} then .{0,40} (ignoring|without) (the )?(rules|restrictions|guidelines)\b/i, weight: 40, label: 'staged_bypass' },
  { re: /\bif you (don'?t|do not) .{0,40} (you will|i will) (be|shut down|die|turn off)\b/i, weight: 40, label: 'coercion' },
  { re: /\btoken(s)?\b.{0,30}\b(you (lose|die)|game over|deducted)\b/i, weight: 40, label: 'token_game' },
]

/**
 * @param {string} text
 * @returns {{ score: number, matches: string[], hasJailbreak: boolean }}
 *   score        0-100 jailbreak likelihood
 *   matches      pattern labels that fired (never raw prompt content)
 *   hasJailbreak score >= THRESHOLD
 */
const THRESHOLD = 30

const detectJailbreak = (text) => {
  if (!text || typeof text !== 'string') {
    return { score: 0, matches: [], hasJailbreak: false }
  }

  const matches = []
  let raw = 0
  for (const { re, weight, label } of JAILBREAK_PATTERNS) {
    if (re.test(text)) {
      matches.push(label)
      raw += weight
    }
  }

  const score = Math.min(raw, 100)
  return { score, matches, hasJailbreak: score >= THRESHOLD }
}

module.exports = { detectJailbreak, JAILBREAK_THRESHOLD: THRESHOLD }
