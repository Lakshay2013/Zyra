/**
 * cost-accuracy.js — verify Zyra's cost calculation.
 *
 *   npm run test:cost-accuracy
 *
 * The paper (§Methodology C) defines:
 *     Cost = (PromptTokens · Pp + CompletionTokens · Pc) / 1000
 * and reports estimation error < ±2% vs commercial providers' token billing.
 *
 * Two things are checked here:
 *   1. calculateCost() implements that exact formula for every priced model
 *      (independent hand-computed expected value → error must be ~0).
 *   2. A worked cost table for the demo.
 *
 * NOTE: "error vs a real provider invoice" (the paper's <2%) needs live billing
 * data, which this offline check does not have. Zyra's pricing table
 * (src/utils/costCalculator.js) is hand-maintained from published price sheets;
 * drift appears only if a provider changes prices before the table is updated.
 * The <2% figure is therefore reported as PAPER-REPORTED, not reproduced here.
 */
const { MODEL_PRICING, calculateCost } = require('../src/utils/costCalculator')

const CASES = [
  { pt: 1000, ct: 1000 },
  { pt: 500, ct: 1500 },
  { pt: 8000, ct: 400 },
  { pt: 120, ct: 60 },
]

let maxErr = 0
let checks = 0
console.log('\nCOST FORMULA VERIFICATION  —  Cost = (pt·Pp + ct·Pc) / 1000\n')
console.log('  model                       pt     ct     expected $    zyra $        err%')
console.log('  ' + '-'.repeat(78))

for (const [model, price] of Object.entries(MODEL_PRICING)) {
  if (model === 'default') continue
  for (const { pt, ct } of CASES) {
    const expected = (pt / 1000) * price.prompt + (ct / 1000) * price.completion
    const actual = calculateCost(model, pt, ct)
    const err = expected === 0 ? 0 : Math.abs(actual - expected) / expected * 100
    maxErr = Math.max(maxErr, err)
    checks++
    if (pt === 1000 && ct === 1000) {
      console.log(`  ${model.padEnd(26)} ${String(pt).padStart(5)} ${String(ct).padStart(6)}   ${expected.toFixed(6).padStart(10)}   ${actual.toFixed(6).padStart(10)}   ${err.toFixed(3).padStart(6)}`)
    }
  }
}

console.log('  ' + '-'.repeat(78))
console.log(`\n  ${checks} (model × case) checks — max deviation from the hand-computed formula: ${maxErr.toFixed(4)}%`)
console.log(`  ${maxErr < 0.001 ? '✅ PASS' : '❌ FAIL'} — calculateCost implements the paper formula exactly.`)

console.log('\n  Worked demo table (per 1M tokens, 50/50 split):')
for (const m of ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'llama-3.1-8b-instant', 'gemini-2.0-flash']) {
  const c = calculateCost(m, 500000, 500000)
  console.log(`    ${m.padEnd(24)} $${c.toFixed(2)} / 1M tokens`)
}

console.log('\n  PAPER-REPORTED: cost estimation error < ±2% vs provider token billing.')
console.log('  ^ needs live invoices to reproduce; not verified by this offline check.\n')

process.exit(maxErr < 0.001 ? 0 : 1)
