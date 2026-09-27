export interface RailFeature {
  id: string
  title: string
  body: string
}

// Facts mirror backend/src/services/qualityGuard.js, retryHandler.js, utils/piiDetector.js.
export const RAIL_FEATURES: RailFeature[] = [
  {
    id: 'routing',
    title: 'Cost routing',
    body: 'Every prompt is classified simple, standard, or complex, then mapped to a quality tier — economy, standard, or premium. Zyra picks the cheapest model in that tier among the providers you’ve given keys for. Classification is length + keyword heuristics, not a trained model.',
  },
  {
    id: 'quality-guard',
    title: 'Quality guard',
    body: 'If a downgraded response comes back empty, very short, or matches a refusal pattern, Zyra retries once on the next tier up. Pattern matching, not a semantic quality score — it catches obvious failures, not subtle ones.',
  },
  {
    id: 'reliability',
    title: 'Retries and fallback',
    body: 'Bounded exponential backoff on 429, 500, 502, 503, 504, and connection errors. A 401, 403, or invalid-model response never retries — those are your problem, not the provider’s. After retries are exhausted, Zyra falls back to the next provider in your configured order.',
  },
  {
    id: 'preflight',
    title: 'Pre-flight blocking',
    body: 'Prompts containing an email, phone number, credit card, SSN, Aadhaar, or PAN are rejected with a 403 before they ever leave the gateway. The response names the category — it never echoes the matched value back.',
  },
]
