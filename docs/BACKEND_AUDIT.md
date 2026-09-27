# Zyra Backend Audit

Date: 2026-09-19
Scope: `backend/` only (per instructions — frontend/`zyra-landing`, `stitch-designs`, and `sdk*` are out of scope except where they interact with the backend contract).
Method: full manual read of every file under `backend/src`, `backend/tests`, root configs (`docker-compose.yml`, `.gitignore`), `PROGRESS.md`, `docs/`. Ran `npm run test:unit` (Docker was not running, so Mongo/Redis-backed integration tests could not be executed in this pass — see §18).

## 0. Headline finding — read this first

**This is not a legacy codebase that needs a rewrite.** It already went through one full cleanup pass (`PROGRESS.md`, "ZYRA MVP RECOVERY", 2026-08-30 → 2026-09-03) and a second pass aligning it to an academic paper's spec (`docs/PAPER_COMPLIANCE.md`, branch `demo-prep-paper-compliance`, current branch). There is:

- **one** proxy implementation in active use (`unifiedProxyController.js`), with a second, explicitly-labeled-deprecated one kept only for backward compatibility (`proxyController.js` — see §13).
- **no** `v2`/`v3` directories, no AIShield/OpenAIShield branding left in code (removed per `PROGRESS.md` item 16; confirmed by repo-wide grep — only a historical mention survives in `PROGRESS.md`'s own change-log prose).
- **no** fake/simulated functionality disguised as real — the one simulator (`services/providers/simulator.js`) is explicitly gated behind `org.demoMode`, is labeled in every response (`simulated: true`, `provider: "simulator"`), and is documented as non-real in its own header comment.
- 80/80 pure unit tests pass right now (detectors, cost calculator, cost optimizer, quality guard, gemini adapter, risk engine). Integration suite (86 tests per `PROGRESS.md`, last verified 2026-09-03) needs Docker (Mongo:27018 + Redis:6380), which was not running during this audit — needs re-verification, not assumed broken.

The remaining work is targeted cleanup, not a rebuild. Treat every "Recommended" item below as a candidate, not a mandate — several are genuinely optional given the project's actual purpose (an academic demo, not a production SaaS).

## 1. Current architecture

```
backend/src/
  app.js            Express app: middleware, route mounting, /health, error handler
  index.js          Entrypoint: env validation, Mongo connect, Redis warm-up, HTTP server, graceful shutdown
  config/queue.js   BullMQ Queue factories (risk-analysis, interaction-logs), namespaced by BULLMQ_PREFIX
  routes/           10 route files, thin — auth + role checks + controller wiring only
  controllers/      11 files — request handling, no direct DB schema knowledge beyond Mongoose calls
  services/         Business logic: cost optimizer, quality guard, retry/fallback, idempotency, cache,
                     usage limiter, risk engine, security analyzer, audit, provider tester, value metrics
  services/providers/  Provider-specific adapters: gemini.js (real translation layer), simulator.js (demo mode)
  models/           8 Mongoose schemas
  middleware/       auth (JWT + API key), rate limiting, sanitize (NoSQL-injection stripping), security headers
  utils/            Stateless detectors (PII, injection, jailbreak, abuse, sensitive keywords), cost calculator,
                     AES-256-GCM crypto, mailer
  workers/          BullMQ workers: logWorker (persists InteractionLog), riskWorker (scores + RiskReport + Notification)
```

Single Express app (`app.js`) + a separate worker process (`workers/index.js`) sharing one Mongo connection pool model but running as independent Node processes — matches Phase 15's "API and worker run independently" requirement already.

## 2. Active backend entry points

- `backend/src/index.js` — API server (`npm start` / `npm run dev`). Fails fast if `JWT_SECRET`, `MONGO_URI`, or `ENCRYPTION_KEY` are missing (good — Phase 15 requirement met).
- `backend/src/workers/index.js` — worker process (`npm run worker`), owns its own Mongo connection, exposes `/health` on `WORKER_HEALTH_PORT` (default 5001) that reports `mongo` + per-worker `isRunning()` state — **not** a fake health check.
- `backend/scripts/*.js` — 14 dev/ops scripts (seeding, demo reset, cost-accuracy check, provider smoke test, security eval, benchmarks). Not part of the runtime; several look like they may overlap (`demo-e2e.js`, `integration-test.js`, `prelaunch-test.js`, `test-all.js`, `dashboard-test.js` — names suggest redundant purposes; not opened in this pass, listed here for the Phase-2 duplicate check to actually run against).

## 3. All API routes

| Mount | File | Auth | Notes |
|---|---|---|---|
| `/v1/*` | `routes/v1.js` | API key | Canonical OpenAI-compatible gateway: `chat/completions`, `completions` (legacy alias, rewrites to chat), `embeddings`, `messages` (Anthropic-native passthrough), `log` (universal SDK ingest) |
| `/proxy/*` | `routes/proxy.js` | API key | **Deprecated**, explicitly commented as such. Provider-prefixed legacy path (`/proxy/openai/...`). |
| `/api/auth/*` | `routes/auth.js` | mixed | register, login, verify-otp, google, me (JWT), change-password (JWT) |
| `/api/keys/*` | `routes/apiKeys.js` | JWT | CRUD for API keys, admin-only create/revoke |
| `/api/logs/*` | `routes/logs.js` | mixed | `POST /ingest` (API key, SDK), `GET /` (JWT, dashboard) |
| `/api/analytics/*` | `routes/analytics.js` | JWT | overview, usage, top-users, high-risk, recent, savings, cost-breakdown, cost-comparison, value-report |
| `/api/org/*` | `routes/org.js` | JWT | settings, providers (+ test), policies, billing, members, optimizer, reliability |
| `/api/payments/*` | `routes/payments.js` | mixed | plans (public), webhook (signature-verified, public), create-order/verify/history (JWT) |
| `/api/security/*` | `routes/security.js` | JWT | overview, reports, report detail, notifications |
| `/api/audit/*` | `routes/audit.js` | JWT, admin-only | Audit trail |
| `/health` | `app.js` | none | Real Mongo `readyState` + Redis `PING` check, not hardcoded |

## 4. Controllers / services map

- **unifiedProxyController.js** (canonical, 1136 lines) — model resolution (`auto` / `provider/model` / bare model), cost-optimizer routing, pre-flight firewall (injection/jailbreak/PII), idempotency, exact-match cache, streaming (native OpenAI/Groq passthrough, buffered-then-re-emitted Gemini, simulated SSE for demo mode), retry+fallback execution, quality-guard upgrade retry, debug headers (`x-zyra-*`), async logging via BullMQ.
- **proxyController.js** (legacy, 411 lines) — same shape, narrower: no Gemini translation, no idempotency, no cache, no demo-mode simulator. Only reachable via `/proxy/*`.
- **universalLogController.js** — fire-and-forget ingest (`202` always) for non-proxy SDK integrations (Python, curl, etc.), accepts two payload shapes.
- **logController.js** — `POST /ingest` (similar to universalLog but synchronous ack + explicit fields) and `GET /` (dashboard log listing, filterable, paginated).
  - **Overlap to resolve**: `logController.ingest`, `universalLogController.universalLog`, and the proxy controllers' own inline logging all write `InteractionLog` via slightly different field-mapping code paths. They are not byte-identical duplicates (each serves a different caller contract), but the risk-analysis-enqueue / masking logic is copy-pasted between `logController.ingest` and `workers/logWorker.processLogJob` instead of both calling `services/securityAnalyzer.analyze` through one shared "create a masked, scored InteractionLog" helper. See §13.
- **authController / orgController / apiKeyController / analyticsController / auditController / securityController / paymentController** — each owns one resource, consistently scoped by `req.user.orgId` (JWT path) or `req.org._id` (API-key path). No cross-controller duplication found.
- **services/** — each file is single-purpose and only used from one or two call sites; no parallel/duplicate service implementations found (e.g. there is exactly one cost calculator, one risk engine, one retry handler).

## 5. Database models

8 Mongoose schemas, all under `backend/src/models/`: `Organization`, `User`, `ApiKey`, `InteractionLog`, `RiskReport`, `AuditLog`, `Payment`, `Notification`. All tenant-scoped documents carry `orgId` (indexed). See §11 for indexing/validation detail.

## 6. Redis usage

Single client factory in `services/cacheLayer.js` (lazy singleton, `ioredis`, `enableOfflineQueue: false`, capped retry strategy — fails open, never blocks the app). Three consumers:
1. **Response cache** — exact-match (SHA-256 of model+messages+temperature+max_tokens), org-agnostic key (see §9 — this is a real gap, not a false positive).
2. **Idempotency** (`services/idempotency.js`) — `idem:lock:<org>:<key>` / `idem:res:<org>:<key>`, org-scoped, GCM lock via `SET NX`.
3. **Rate limiting** (`middleware/rateLimiter.js`) — `express-rate-limit`, keyed by `req.org._id` when available, else IP.

## 7. BullMQ workers

Two queues (`config/queue.js`, namespaced by `BULLMQ_PREFIX`, default `zyra`): `interaction-logs` and `risk-analysis`.
- `logWorker` consumes `interaction-logs`: runs `securityAnalyzer.analyze` on the **raw** prompt/response, persists `InteractionLog` with **masked** text + component scores, then enqueues `risk-analysis`.
- `riskWorker` consumes `risk-analysis`: adds the abuse-**frequency** term (24h flagged-interaction count for the user), computes `R = 0.35I + 0.30J + 0.20P + 0.15A` (`services/riskEngine.js`), writes back `InteractionLog.riskScore/severity`, creates a `RiskReport`, and creates a `Notification` when `R > 80`.
- Both workers are started only by `workers/index.js` in production; tests/scripts drive `processLogJob`/`processRiskJob` directly. Worker health endpoint checks Mongo readiness AND both workers' `isRunning()` — genuinely reflects reality, not hardcoded `{status:"ok"}`.

## 8. Provider integrations

| Provider | Real HTTP call | Native format handling | Streaming | Fallback default model |
|---|---|---|---|---|
| OpenAI | ✅ `api.openai.com` | OpenAI-native (no translation needed) | ✅ real SSE passthrough | `gpt-4o-mini` |
| Anthropic | ✅ `api.anthropic.com` | OpenAI request forwarded as-is to `/v1/messages`* | ✅ real SSE passthrough | `claude-sonnet-4-6` |
| Groq | ✅ `api.groq.com/openai` (OpenAI-compatible) | none needed | ✅ real SSE passthrough | `llama-3.3-70b-versatile` |
| Gemini | ✅ `generativelanguage.googleapis.com` | **Real bidirectional translation** (`services/providers/gemini.js`) — OpenAI↔Gemini message/role/usage mapping | Buffered call re-emitted as one SSE chunk (documented limitation, not a bug: "MVP... token-by-token cadence is lost") | `gemini-2.0-flash` |

\* Caveat: `chatCompletions`'s generic path builds an OpenAI-shaped body and posts it to Anthropic's `/v1/messages` for a model resolved via provider-prefix or model-name matching — this only works correctly through the dedicated `POST /v1/messages` (`anthropicMessages`) handler, which is Anthropic-native end to end. Worth confirming in Phase 5 whether `chat/completions` with `model: "anthropic/claude-..."` actually round-trips (Anthropic's wire format differs from OpenAI's chat-completions body — no adapter comparable to `gemini.js` exists for Anthropic in the generic path). **Flagged as "needs verification," not confirmed broken** — did not runtime-test.

No fake provider functionality: `providerTester.js` makes real 1-token requests to verify stored keys; `services/providers/simulator.js` is the only non-real path and is fully gated + labeled. Provider tests use `nock` (per `PROGRESS.md`), not real API keys.

Retry policy (`services/retryHandler.js`): retries `429/500/502/503/504` and connection-level errors, exponential backoff + jitter, correctly does **not** retry `401/403/400` — Phase 9's requirement is already met in code.

## 9. Security pipeline

Pre-flight order in `unifiedProxyController.chatCompletions` (confirmed by reading, not assumed): **injection → jailbreak → PII → idempotency → cache → provider call**. PII blocking happens before any provider contact — Phase 7's hard requirement is met. Every block also records a `blocked: true` InteractionLog with `statusCode: 403` (so blocked attempts are visible in dashboards, not silently dropped).

Detectors (`utils/*Detector.js`): all regex/rule-based (explicitly documented as not ML), weighted, thresholded, produce 0–100 scores. `piiDetector.maskPII` masks before any persistent storage (`j***@gmail.com` style) — matches the paper's requirement quoted in the code comments.

Secrets handling: `utils/crypto.js` uses AES-256-GCM (with backward-compat AES-256-CBC decrypt path for old ciphertexts), fails hard at boot if `ENCRYPTION_KEY` is missing/malformed. No provider keys, passwords, or JWT secrets found in any `console.log`/`console.error` call across the codebase (checked every controller/service read in this pass).

**Gaps found:**
- **Cache key is not org-scoped** (`services/cacheLayer.buildCacheKey` = `zyra:cache:<sha256(model+messages+temp+max_tokens)>`, no `orgId` in the key). Two different organizations sending byte-identical prompts to the same model will receive each other's cached response. This is a real cross-tenant leak of **response content** (not of logs/settings/keys — those are correctly scoped everywhere else) and should be Phase-8's top fix.
- `paymentController.webhook` verifies the Razorpay signature by re-`JSON.stringify`-ing the Express-parsed `req.body` rather than HMAC-ing the raw request bytes. If Razorpay's actual byte stream differs from Node's re-serialization (key order, spacing, unicode escaping) the signature check can false-negative. Low exploitability (requires a valid Razorpay signature to matter at all) but worth fixing with `express.raw()` + verify-then-parse.
- `paymentController.verifyPayment` does not check that the found `Payment.orgId` matches `req.user.orgId` before applying the plan upgrade — a logged-in user who obtained another org's `(order_id, payment_id, signature)` triple could trigger that *other* org's upgrade (not their own — low practical impact, but it's a missing tenant check on a mutating endpoint and should be added for completeness with Phase 4's "verify tenant scoping throughout" instruction).

## 10. Cost optimization

`services/costOptimizer.js` + `utils/costCalculator.js` implement the full pipeline Phase 6 describes: regex-based complexity classification (simple/standard/complex) → quality tier mapping → cheapest-model-in-tier lookup, filtered to providers the org has keys for (or all, in demo mode) → only switches if it's actually cheaper. `model: "auto"` (`autoRoute` in `unifiedProxyController.js`) reuses the same `optimizeRequest` call starting from `gpt-4o` as the baseline, falling back to a fixed per-provider default when no optimization is possible.

Pricing is centralized in one table (`utils/costCalculator.MODEL_PRICING`), tiered (`MODEL_TIERS`), with a documented "prices as of March 2026" comment — easy to update, single source of truth (Phase 6 requirement met). Debug headers (`x-zyra-model`, `x-zyra-provider`, `x-zyra-cost`, `x-zyra-savings`, `x-zyra-complexity`) expose routing metadata as required.

No hardcoded/guaranteed savings claims found in backend code (only in `zyra-landing`, out of scope, and `PROGRESS.md` already documents that those claims were toned down in the MVP-recovery pass).

**Gap**: fallback model selection (`findCompatibleModel` in both proxy controllers) hardcodes one fixed default model per provider regardless of the original model's tier — a `gpt-4o` (premium) request falling back to Anthropic always lands on `claude-sonnet-4-6` (standard tier), not an equivalent-tier model. Minor, deterministic, not a bug so much as a simplification worth a one-line comment or a tier-aware lookup if fallback-quality-parity matters for the paper's claims.

## 11. Logging / analytics

`InteractionLog` is the single source of truth; `valueMetrics.js` and `analyticsController.js` build every dashboard number from real Mongo aggregations (no hardcoded/randomized metrics found — confirmed by reading every aggregation pipeline). `RiskReport` is a normalized, denormalized-view companion written only by `riskWorker`. `AuditLog` is a separate control-plane trail (auth/admin/security actions) written via the fire-and-forget `services/audit.js` (never throws, never blocks the action it's auditing).

Indexes present: `InteractionLog` (`orgId+createdAt`, `orgId+userId`, `orgId+riskScore`, `orgId+model`, `orgId+provider`), `RiskReport` (`orgId+createdAt`, `orgId+severity+createdAt`), `AuditLog` (`orgId+createdAt`, `orgId+category+createdAt`), `Notification` (`orgId+read+createdAt`), `ApiKey` (`keyHash` unique, `orgId`). This is already solid Phase-11 coverage.

**Gap**: `analyticsController.getTopUsers` and `services/valueMetrics.getCostByModel/getCostByUser` run unbounded-by-index aggregations that `$match` on `orgId` (+ sometimes `createdAt`) but there's no compound index covering the exact aggregation shape for very large collections — acceptable at demo scale, worth flagging as a "add when data volume justifies it" item rather than fixing now.

## 12. Duplicate implementations

1. **`controllers/proxyController.js` vs `controllers/unifiedProxyController.js`** — the one real duplicate. Already labeled deprecated in `routes/proxy.js`'s own header comment. **Recommendation: keep `/proxy/*` only if something external actually depends on it (check SDK/docs for references — `sdk/` and `sdk-python` should be grepped before deleting); otherwise delete `proxyController.js` and `routes/proxy.js` together and drop the `app.use('/proxy', ...)` mount.** Do not delete blind — Phase 2 says trace references first.
2. **Masked-and-scored InteractionLog creation logic** duplicated across `logController.ingest`, `universalLogController.universalLog`, and `workers/logWorker.processLogJob` (three separate places call `securityAnalyzer.analyze` and hand-assemble the same `riskDetails` object literal). Not urgent — each has a legitimately different input contract — but a shared `buildLogDocument({prompt, response, ...})` helper in `services/` would remove ~30 duplicated lines across 3 files.
3. **`scripts/*.js`** — `demo-e2e.js`, `integration-test.js`, `prelaunch-test.js`, `test-all.js`, `dashboard-test.js` were not opened in this pass but their names strongly suggest overlapping "run everything and check it works" scripts written at different times. Worth a 15-minute read-through before the cleanup phase to merge/retire redundant ones.

## 13. Legacy implementations

- `routes/proxy.js` + `controllers/proxyController.js` (see §12).
- `package.json` version string `"0.1.0-beta"` and `app.js`'s `const VERSION = '0.1.0-beta'` (echoed in `/health` and the startup banner). Per Phase 2 ("remove obsolete version branding"), bump to a plain `1.0.0` or drop the `-beta` suffix once the team considers it demo-ready — purely cosmetic, zero functional impact.
- `utils/costCalculator.js`'s `MODEL_PRICING`/`MODEL_TIERS` intentionally keep old Anthropic model IDs (`claude-3-5-sonnet`, `claude-3-opus`, `claude-3-haiku`) alongside current ones, commented `// Legacy Anthropic model IDs (still accepted by API)` — this is deliberate backward-compat, not dead code, leave it.
- `utils/injectionDetector.js`'s `LEGACY_PHRASES` catch-all — deliberate, documented, low-weight; not dead code.
- No `v0.1`/legacy/experimental markers found anywhere else in `backend/src` (full grep performed; see audit method note above).

## 14. Dead code

- **`mongodb-memory-server`** is a listed devDependency in `backend/package.json` but is not `require`d anywhere in the codebase (confirmed by grep) — the test suite uses a real Docker-hosted Mongo instead (`tests/helpers.js`). Either wire it in as a Docker-free test path or remove the dependency.
- No other dead files were found — every controller/service/util/model read in this pass is wired into at least one route or worker.

## 15. Broken functionality

Nothing was found to be definitively broken by static reading. Two items need **runtime verification, not a fix** (flagged, not assumed broken):
- Generic `/v1/chat/completions` routing to Anthropic via a bare/prefixed model name (§8 caveat) — the dedicated `/v1/messages` path is confirmed correct; the generic path's Anthropic handling was not runtime-tested.
- Real provider connectivity overall — `PROGRESS.md` already flags this as "RUNTIME (real keys) UNVERIFIED — no keys" as of the last pass; nothing in this audit changes that status.

## 16. Missing functionality

- No dedicated Anthropic request/response adapter comparable to `services/providers/gemini.js` for the generic multi-provider path (only the dedicated `/v1/messages` passthrough handles Anthropic natively end-to-end).
- No shared "build masked InteractionLog" helper (§12.2) — not missing functionality so much as missing consolidation.
- No compound indexes for the top-users/cost-by-user aggregations (§11) — flagged as a future add, not missing today.

## 17. Test coverage / gaps

- **Unit**: 80/80 passing right now (verified this session: detectors ×5, cost calculator, cost optimizer, quality guard, gemini adapter, risk engine).
- **Integration**: 11 files (`auth`, `proxy`, `reliability`, `idempotency`, `monthlyLimit`, `gemini`, `orgAndKeys`, `providerTest`, `security`, `riskPipeline`, `universalLog`) covering exactly the surfaces Phase 13 asks for (auth, tenancy-adjacent, proxy, reliability, idempotency, security, workers). Per `PROGRESS.md`, 86 total tests passed as of 2026-09-03 against a real Mongo:27018/Redis:6380. **Not re-run in this audit** — Docker Desktop was not running in this environment. This needs to happen before any "tests pass" claim is made in the final report.
- **Not covered by any test found**: `paymentController` (no `payments.test.js` in `tests/integration/`), `auditController`/`AuditLog` read path, `securityController`'s notification-read endpoints, cross-organization negative tests (e.g. "org A's JWT cannot read org B's logs/keys/settings") — Phase 4 explicitly asks for these and none currently exist as a named test file. This is the single most important test gap to close.
- Cache cross-tenant leakage (§9) has no regression test — write one alongside the fix.

## 18. Configuration problems

- Docker Desktop was not running during this audit, so the full stack (`docker compose up`) and the Mongo/Redis-backed test suite could not be exercised. Not a code problem — an environment fact to record.
- `backend/.env` contains a comment "Rotate the exposed live keys immediately" next to the Razorpay section — suggesting a live key was exposed at some point in this local file. Confirmed `.env` was **never committed to git** (`git log --all -- backend/.env` is empty, `.gitignore` covers it). No repo-level action needed, but the user should rotate those Razorpay keys as a precaution if that hasn't already happened — outside this audit's ability to verify.
- `backend/.env.example` is complete and accurate against `index.js`'s `REQUIRED_ENV` check and every `process.env.*` read found in this pass — nothing missing.
- `docker-compose.yml` correctly runs API and worker as independent services from one shared image, with real healthchecks (not just "container is up") — Phase 15 requirement already met.

## 19. Recommended cleanup order

1. **Fix the cache cross-tenant key leak (§9)** — highest severity, smallest diff (add `orgId` into `buildCacheKey`'s hash input and every call site). Do this before anything else in Phase 8.
2. **Add cross-tenant negative tests** (§17) — org A cannot read org B's logs/keys/audit/security data. This is Phase 4's explicit ask and currently has zero coverage; writing the tests will also prove or disprove any scoping gaps this static read missed.
3. **Re-run the full test suite against Docker** to get a current, real pass/fail count before touching any implementation code (Phase 17 groundwork, but do it early so you're not flying blind).
4. **Resolve `proxyController.js`/`routes/proxy.js`** — grep `sdk/`, `sdk-python/`, and `docs/` for any reference to `/proxy/`; delete if unreferenced, otherwise leave as-is (it's already correctly marked deprecated).
5. **Fix the Razorpay webhook signature verification** (§9) and the missing `payment.orgId === req.user.orgId` check in `verifyPayment` (§9) — small, isolated, high-value.
6. Optional/low-priority: drop `mongodb-memory-server` from devDependencies (§14), bump the `0.1.0-beta` version string (§13), consolidate the three InteractionLog-creation code paths (§12.2), read through `scripts/*.js` for redundant demo/test scripts (§12.3), verify the generic-path Anthropic routing (§8/§15).

Nothing on this list requires a rewrite, a new abstraction layer, or touching the frontend.
