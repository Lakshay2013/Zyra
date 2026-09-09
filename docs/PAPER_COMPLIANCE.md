# Zyra — Paper ↔ Implementation Compliance Matrix

Source of truth: `docs/zyra-paper-v1.docx`
("Zyra: A Multi-Tenant SaaS Platform for Secure LLM Logging, Risk Monitoring, and Cost Analytics")

Classification legend:
- **WORKING** — implemented and verified end-to-end
- **BROKEN** — implemented but does not match the paper / does not function
- **PARTIAL** — partially implemented
- **MISSING** — not implemented
- **UNVERIFIED** — code exists, not yet verified on the running stack

`baseline` = state at commit `1fc25fa`, before this effort. `now` = branch `demo-prep-paper-compliance`.

| # | Paper feature | Baseline | Now | Tested | Demo-ready | Notes |
|---|---|---|---|---|---|---|
| 1 | Multi-tenant SaaS | WORKING | WORKING | yes | yes | every query scoped to `req.user.orgId` / `req.org`; `riskPipeline.test.js` + `demo-e2e` assert cross-tenant 404 |
| 2 | User management | WORKING | WORKING | yes | yes | register / OTP verify / login / change-password; roles admin·developer·viewer (`auth.test.js`) |
| 3 | Organization management | WORKING | WORKING | yes | yes | `orgController` settings / members / policies / optimizer / reliability |
| 4 | API key authentication | WORKING | WORKING | yes | yes | SHA-256 hash + prefix, `isActive`; create→auth→revoke (`orgAndKeys.test.js`) |
| 5 | LLM request logging | WORKING | WORKING | yes | yes | proxy → BullMQ `interaction-logs` → log worker → Mongo |
| 6 | Response logging | PARTIAL | WORKING | yes | yes | stored, and now **masked** before persistence |
| 7 | Token tracking | WORKING | WORKING | yes | yes | `tokens.{prompt,completion,total}` from provider usage |
| 8 | Latency tracking | WORKING | WORKING | yes | yes | `Date.now()-start` |
| 9 | Cost estimation | WORKING | WORKING | yes | yes | `(pt·Pp+ct·Pc)/1000`; `test:cost-accuracy` 0.0000% deviation |
| 10 | Prompt injection detection | PARTIAL | **WORKING** | yes | yes | rewritten weighted-regex `injectionDetector`; pre-flight block + `I` term; both modes tested |
| 11 | Jailbreak detection | **MISSING** | **WORKING** | yes | yes | new `jailbreakDetector`; own `J` term; optional pre-flight block; `jailbreakDetector.test.js` + pipeline test |
| 12 | PII detection | PARTIAL | **WORKING** | yes | yes | + apiKey / password / JWT; `maskPII()`; `piiDetector.test.js` |
| 13 | Sensitive keyword detection | PARTIAL | **WORKING** | yes | yes | own `sensitiveKeywordDetector`, org-configurable watch-list |
| 14 | Abuse detection | PARTIAL | WORKING | yes | yes | per-prompt heuristic + 24 h abuse-**frequency** term in risk worker |
| 15 | Risk score generation | **BROKEN** | **WORKING** | yes | yes | `riskEngine` implements `R = 0.35I+0.30J+0.20P+0.15A` exactly; `riskEngine.test.js` (incl. worked examples) |
| 16 | Risk severity | **MISSING** | **WORKING** | yes | yes | low/medium/high/critical at 25/50/80; on `InteractionLog` + `RiskReport` |
| 17 | Security alerts | **MISSING** | **WORKING** | yes | yes | `Notification` on `R > 80`; dashboard bell + `/api/security/notifications` |
| 18 | Audit logs | **MISSING** | **WORKING** | yes | yes | `AuditLog` model + service; auth / api-key / policy / provider events; `/dashboard/audit` (admin) |
| 19 | Analytics | WORKING | WORKING | yes | yes | overview / usage / top-users / high-risk / savings / cost-breakdown / value-report |
| 20 | User activity | WORKING | WORKING | yes | yes | `getTopUsers`; "most expensive users" on Cost dashboard |
| 21 | Model usage | PARTIAL | WORKING | yes | yes | `getCostByModel`; "cost by model" section |
| 22 | Cost analytics | WORKING | WORKING | yes | yes | `getCostComparison` (fixed the `$ifNull` baseline bug); `/dashboard/cost` |
| 23 | Dashboard | PARTIAL | **WORKING** | manual | yes | + Security & Risk, Cost Analytics, Audit pages; honest empty/loading states; fake stats removed |
| 24 | SDK integration | PARTIAL | **WORKING** | yes | yes | proxy + auto-patch + explicit `.log()` (Node + Python); `/v1/log` captures prompt+response masked |
| 25 | Asynchronous workers | WORKING | WORKING | yes | yes | two BullMQ queues; `workers/index.js` starts both; `:5001/health` published |
| 26 | MongoDB persistence | WORKING | WORKING | yes | yes | Mongoose; compose `zyra-mongo` |
| 27 | Redis queues / cache | WORKING | WORKING | yes | yes | queue + cache + idempotency + rate-limit; compose `zyra-redis`; `BULLMQ_PREFIX` isolates tests |
| 28 | Multi-provider support | PARTIAL | WORKING | yes | yes | OpenAI / Groq / Anthropic direct; Gemini translation layer (`gemini.test.js` ×2); simulator for demo |
| 29 | Cost optimization *(product add-on)* | WORKING | WORKING | yes | yes | `costOptimizer`; `model:"auto"`; `/dashboard/policies` optimizer tab |
| 30 | Provider fallback | WORKING | WORKING | yes | yes | `retryHandler` retry+backoff+cross-provider; `reliability.test.js` |
| 31 | Quality guard | WORKING | WORKING | yes | yes | `qualityGuard.validateResponse` + higher-tier retry; `qualityGuard.test.js` |

## Paper-reported experimental results (NOT to be presented as current results without reproduction)

| Metric | Paper value | How to reproduce | Current local result |
|---|---|---|---|
| Logging success rate | 99.96% (9,996 / 10,000) | `BENCH_N=2000 npm run benchmark:logging` | **100%** logs persisted (500–2000 req runs, local Docker) |
| Avg logging time | 47 ms | same | Logging is async (BullMQ enqueue only, ~2–5 ms). Full request-path overhead ≈ **110–125 ms p50** on local Windows Docker (Express + API-key lookup + Redis rate-limit + enqueue + simulator). Not the same quantity the paper measures. |
| Prompt injection precision | 96.0% | `npm run eval:security` | **84.6%** precision / 100% recall on the 45-prompt public set (FPs are cross-fires with jailbreak on multi-vector prompts) |
| Jailbreak precision | 94.4% | same | **91.7%** precision / 100% recall |
| PII / sensitive detection | 98.0% | same | **100%** precision & recall (PII + sensitive-keyword) on the public set |
| Benign false-positive rate | — | same | **0 / 12** benign prompts flagged |
| Cost estimation (formula) | error < ±2% vs invoices | `npm run test:cost-accuracy` | `calculateCost` implements `(pt·Pp + ct·Pc)/1000` with **0.0000%** deviation from hand computation over 60 model×case checks. Error vs a real provider invoice is **not reproducible offline** (needs live billing) — the ±2% figure stays paper-reported. |
| Dashboard load | < 2 s | manual | _to verify in browser_ |

> Reproduced numbers are on a **small public synthetic set** (`scripts/eval-security.js`) and a **local single-box Docker** stack, and are reported exactly as produced. The paper's figures are on the authors' larger private test set and their deployment — kept as "PAPER-REPORTED" throughout the demo.

## Risk severity bands (implementation choice — paper table is an image, not machine-readable)

| Band | Range | Dashboard treatment |
|---|---|---|
| low | 0–24 | normal |
| medium | 25–49 | highlighted |
| high | 50–79 | alert row |
| critical | 80–100 | alert row + admin notification (paper: "score over 80 → administrator dashboard notification") |

---

## What changed in this effort (branch `demo-prep-paper-compliance`)

### Newly implemented (was MISSING)
- **Jailbreak detector** (`utils/jailbreakDetector.js`) — deterministic, own `J` score, wired to risk + optional pre-flight block.
- **Risk engine** (`services/riskEngine.js`) — the paper's exact `R = 0.35I + 0.30J + 0.20P + 0.15A`, severity bands, `R > 80` notification.
- **Sensitive-keyword detector** (`utils/sensitiveKeywordDetector.js`) — split out, org-configurable.
- **`RiskReport`**, **`Notification`**, **`AuditLog`** collections + `/api/security/*` and `/api/audit` endpoints.
- **Security & Risk**, **Cost Analytics**, **Audit Log** dashboard pages; notifications bell.
- **Demo mode** (simulator provider) + `demo:seed` / `demo:reset` / `demo:e2e`.
- Reproducible metric scripts: `benchmark:logging`, `eval:security`, `test:cost-accuracy`.
- Explicit SDK `.log()` (Node + Python) + `/v1/log` prompt/response capture with masking.

### Fixed (was BROKEN / wrong)
- Risk formula was `0.4·PII + 0.4·injection + 0.2·abuse` with **no jailbreak term** → now the paper's formula.
- `injectionDetector` was brittle exact-substring → weighted regex (catches "ignore *all* previous instructions" etc.).
- PII: no masking, missing apiKey/password/JWT → all added; masked before storage.
- Cost "without Zyra" baseline used `$ifNull` on a field that defaults to `0`, so non-optimized rows contributed `0` → explicit `$cond`.
- `costCalculator` rounded to 6 dp (1.85% error on sub-µ$ costs) → 9 dp.
- Playground sent JWT to `/v1/*` (which needs an API key) and was silently unauthenticated → auto-mints a key.
- Worker MongoDB connection was opened in three places → owned by `workers/index.js` only.
- Test BullMQ queue shared the Redis keyspace with the running docker worker → `BULLMQ_PREFIX`.
- Compose services `ai-shield-mongo/redis` + DB `ai-shield` → `zyra-*` / `zyra`.

### Already working (verified, not rebuilt)
Multi-tenancy · auth + roles · API-key hashing · proxy pipeline · token/latency/cost capture ·
cost optimizer + `model:"auto"` · retry + cross-provider fallback · quality guard ·
Gemini translation layer · idempotency · atomic monthly limit · response cache.

## Current limitations (state honestly in the demo)
1. Detection is **rule-based** — novel phrasings can bypass pre-flight blocking (still logged + scored post-hoc).
2. No **response remediation** — Zyra can block a prompt but does not sanitise a model's output.
3. Pricing table is **hand-maintained**; drifts if a provider changes prices before the table is updated.
4. Dashboard "real-time" = **polling** (10–20 s), not WebSockets. The UI states this.
5. Reproduced security precision is on a **small public** set, lower than the paper's private-set numbers.
6. `47 ms logging time` and `< ±2% cost error` are **paper-reported**; not reproducible on this local single-box stack.
7. Real provider connectivity (OpenAI/Anthropic/Groq/Gemini) is covered by **mocked** tests + `npm run test:providers`; no live keys were used.

## Test inventory
| Suite | Count | Command |
|---|---|---|
| Backend (providers mocked) | 131 | `cd backend && npm test` |
| Node SDK | 12 | `cd sdk && npm test` |
| Python SDK | 7 | `cd sdk-python && python -m unittest discover -s tests` |
| Live end-to-end | 17 checks | `cd backend && node scripts/demo-e2e.js` |
| Frontend | lint + build | `cd zyra-landing && npm run lint && npm run build` |
