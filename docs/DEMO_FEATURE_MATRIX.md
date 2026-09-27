# Zyra — Demo Feature Matrix

Source of truth: `docs/zyra-paper-v1.docx` + `docs/PAPER_COMPLIANCE.md`.
Verification method: this table is not copied from prior docs — every row was re-checked against the running stack on 2026-09-19 (`docker compose up -d --build`, `npm run demo:seed`, `node scripts/demo-e2e.js`, `npm test`, `npm run eval:security`, `npm run test:cost-accuracy`, frontend `npm run build`). Where a row says "verified", that command or click-path was actually run this session, not assumed from code.

| # | Paper feature | Current implementation | Demoable? | Status | Required fix | How it's demonstrated |
|---|---|---|---|---|---|---|
| 1 | Multi-tenant organization system | `Organization`/`User`/`ApiKey` all carry `orgId`; every controller filters by `req.user.orgId` / `req.org` | Yes | WORKING | none | Log in as two seeded tenants (`admin@zyrademoco.demo`, `admin@acmerivalinc.demo`); compare `/dashboard/security` totals |
| 2 | User authentication | JWT (dashboard) + bcrypt password hash + OTP + Google OAuth | Yes | WORKING | none | Register → OTP → login flow; or use seeded accounts directly |
| 3 | API keys | `sk-live-<hex>`, stored as SHA-256 hash + prefix, create/list/revoke | Yes | WORKING | none | `/dashboard/apikeys` — create a key, use it in the Playground |
| 4 | LLM request logging | Proxy → BullMQ `interaction-logs` → `logWorker` → `InteractionLog` | Yes | WORKING | none | Send a Playground request, then `/dashboard/logs` shows it within seconds |
| 5 | Prompt/response metadata | Prompt + response stored **masked**; model, provider, `simulated` flag | Yes | WORKING | none | `/dashboard/logs` row detail |
| 6 | Token usage | `tokens.{prompt,completion,total}` from provider/simulator usage | Yes | WORKING | none | Playground response panel + Logs page |
| 7 | Latency | `Date.now()-start`, stored per interaction | Yes | WORKING | none | Playground response panel |
| 8 | Cost estimation | `(prompt_tokens·Pp + completion_tokens·Pc)/1000`, centralized pricing table | Yes | WORKING | none | Playground shows cost; `npm run test:cost-accuracy` → **0.0000% deviation**, re-verified this session |
| 9 | Model/provider tracking | `model`, `provider`, `model_requested` all persisted | Yes | WORKING | none | Logs page, `x-zyra-model`/`x-zyra-provider` debug headers |
| 10 | Prompt injection detection | Weighted-regex `injectionDetector`; pre-flight block when `policies.blockInjection` | Yes | WORKING | none | Playground "Injection" preset → confirmed 403 this session (`scenario 2 injection: blocked pre-flight`) |
| 11 | Jailbreak detection | Weighted-regex `jailbreakDetector`; own risk term, block optional (off by default) | Yes | WORKING | none | Playground "Jailbreak" preset → confirmed 200 + risk-scored this session (risk 37, jailbreak component 100) |
| 12 | PII detection | Regex per category (email, phone, Aadhaar, PAN, card, SSN, API key, password, JWT) | Yes | WORKING | none | Playground "PII" preset → confirmed 403 with `pii_types: email/creditCard/aadhaar/pan/phone` this session |
| 13 | Sensitive keyword detection | Org-configurable watch-list + built-in defaults | Yes | WORKING | none | "Sensitive" preset (cheat sheet) → `sensitive_keyword` flag |
| 14 | Abuse/suspicious activity analysis | Per-prompt keyword heuristic + 24h abuse-**frequency** term (risk worker) | Yes | WORKING | none | Seed data includes repeated-activity scenario; `/dashboard/security` abuse count |
| 15 | Risk score generation | `R = 0.35I + 0.30J + 0.20P + 0.15A` exactly, in `services/riskEngine.js` | Yes | WORKING | none | Verified this session: jailbreak-only prompt → components `{injection:20, jailbreak:100, pii:0, abuse:0}` → risk 37, matches formula (0.35×20+0.30×100=37) |
| 16 | Risk severity | low/medium/high/critical bands at 25/50/80 (implementation choice, documented) | Yes | WORKING | none | `/dashboard/security` Risk Reports table, severity column |
| 17 | Security alerts/notifications | `Notification` created when `R > 80`; dashboard bell | Yes | WORKING | none | Seed produces 3 notifications, confirmed this session |
| 18 | Audit logs | `AuditLog` model; login/api_key/policy/provider events | Yes | WORKING | none | `/dashboard/audit`; confirmed 7 entries after fresh seed + e2e run this session |
| 19 | Analytics dashboard | `/dashboard` overview + `/dashboard/cost` + `/dashboard/security` | Yes | WORKING | none | Real Mongo aggregations, no hardcoded numbers (read every aggregation pipeline in the audit pass) |
| 20 | Model usage trends | `getCostByModel`, "cost by model" section | Yes | WORKING | none | `/dashboard/cost` |
| 21 | User activity | `getTopUsers`, "most expensive users" | Yes | WORKING | none | `/dashboard/cost` |
| 22 | Cost analytics | `getCostComparison` (without-Zyra vs with-Zyra) | Yes | WORKING | none | Confirmed this session: `withoutZyra $1.79 vs withZyra $0.75 → saved 58%` on seed data |
| 23 | SDK integration | Node SDK (extends OpenAI client) + Python SDK, proxy + explicit `.log()` | Yes | WORKING | none | 12/12 Node SDK tests + 7/7 Python SDK tests, both re-run this session |
| 24 | Async worker processing | Two BullMQ queues (`interaction-logs`, `risk-analysis`), independent worker process | Yes | WORKING | none | Worker `/health` shows both workers running; confirmed this session (`:5001/health` → `{"logs":true,"risk":true}`) |
| 25 | MongoDB persistence | Mongoose, 8 collections, per-tenant indexes | Yes | WORKING | none | `/health` → `mongo:true`; data visible in every dashboard page |
| 26 | Redis usage | Queue backend + response cache + idempotency + rate limiting | Yes | WORKING | Fixed this session — see below | `/health` → `redis:true`; idempotency + fallback tests |
| 27 | Multi-provider LLM gateway | OpenAI, Groq, Anthropic (direct), Gemini (real translation layer), simulator (demo mode) | Yes | WORKING | none | Provider-prefixed model names in Playground; `gemini.test.js` (unit + integration) |
| 28 | Cost optimization / intelligent routing | `costOptimizer.js` — complexity → tier → cheapest available model | Yes | WORKING | none | Confirmed this session: `auto` on a simple prompt → routed to `llama-3.1-8b-instant` (groq), complexity `simple`; complex prompt → `gemini-1.5-pro` |
| 29 | Reliability / fallback | `retryHandler.js` — retry retryable statuses, cross-provider fallback, quality-guard upgrade | Yes | WORKING | none (verify via mocked test, not live provider outage) | `node --test tests/integration/reliability.test.js` — 429→retry→200, 401→fail-fast, primary failure→fallback provider |

## Fixed during this pass

Two real bugs in the response-cache path, found only by actually exercising it (not by reading the code) — both in `services/cacheLayer.js` / `controllers/unifiedProxyController.js`:

1. **Cache was not tenant-scoped.** `buildCacheKey` hashed only `model + messages + temperature + max_tokens` — two different organizations sending byte-identical prompts to the same model would have received each other's cached response. Real cross-tenant leak (feature #1/#26 above).
   - **Fix**: `buildCacheKey` now takes `orgId` and folds it into the key (`zyra:cache:<orgId>:<hash>`).
2. **Cache write key never matched the read key.** The lookup (Step 4) hashed the post-clamp `requestBody.max_tokens`; the store (Step 9) hashed the raw, pre-clamp `req.body.max_tokens`. For any caller that didn't explicitly set `max_tokens` (the common case), those two values differed (`4096` vs `undefined`), so the store key never matched a later lookup key — **the cache silently never hit for typical requests.** This predates this session; it was masked because nothing exercised repeat-identical-request behavior end to end before.
   - **Fix**: Step 9 now hashes the same `requestBody` values Step 4 used.
- **Regression tests added**: `tests/integration/cache.test.js` — asserts two orgs with an identical prompt each get their own provider response (not each other's cache), and that same-org caching now actually works (provider called once for two identical requests, second one served from cache).
- One existing test (`tests/integration/idempotency.test.js`, "different keys → provider called for each") relied on the cache being broken — it sent two requests with identical prompt text differing only by `Idempotency-Key`, which (now that caching works) both correctly resolve to one provider call for a different reason (cache) than the test intended (idempotency). Updated it to use distinct prompt text so it isolates what it's actually testing.
- Full suite re-run twice after the fix for stability: **133/133 backend tests pass**, consistently. Also re-verified live: rebuilt the Docker images, re-seeded demo data, re-ran `node scripts/demo-e2e.js` — **all 17 checks pass** against the rebuilt stack.

## Not independently reproduced (paper-reported only — do not present as current results)

Per Phase 17's academic-integrity rule, these paper numbers are **not** claimed as reproduced by this build. Current local numbers (re-run this session) are reported separately:

| Metric | Paper value | Current local evaluation (this session) |
|---|---|---|
| Logging success rate | 99.96% | Not re-benchmarked this session (`BENCH_N=2000 npm run benchmark:logging` available; last recorded local result was 100% per `PAPER_COMPLIANCE.md`) |
| Avg logging time | 47 ms | Not the same quantity — Zyra's logging step is an async queue enqueue (~2–5 ms); full request-path overhead was last measured at ≈110–125 ms p50 (not re-run this session) |
| Prompt injection precision | 96.0% | **84.6%** precision / 100% recall — re-run this session (`npm run eval:security`), identical to prior recorded result |
| Jailbreak precision | 94.4% | **91.7%** precision / 100% recall — re-run this session, identical to prior recorded result |
| PII / sensitive detection | 98.0% | **100%** precision & recall — re-run this session, identical to prior recorded result |
| Cost estimation error | < ±2% vs invoices | Formula verified exact (0.0000% deviation vs hand computation) — re-run this session; error vs a real provider invoice needs live billing data, not reproducible offline |

All reproduced numbers are labeled **"Current local evaluation"** everywhere they appear in the demo materials; the paper's own numbers are labeled **"Reported in the research paper."**
