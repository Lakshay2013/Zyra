# Zyra — Paper ↔ Implementation Compliance Matrix

Source of truth: `docs/zyra-paper-v1.docx`
("Zyra: A Multi-Tenant SaaS Platform for Secure LLM Logging, Risk Monitoring, and Cost Analytics")

Classification legend:
- **WORKING** — implemented and verified end-to-end
- **BROKEN** — implemented but does not match the paper / does not function
- **PARTIAL** — partially implemented
- **MISSING** — not implemented
- **UNVERIFIED** — code exists, not yet verified on the running stack

Status column updated as work proceeds. `baseline` = state at commit `1fc25fa` before this effort.

| # | Paper feature | Baseline state | Evidence (baseline) | Target |
|---|---|---|---|---|
| 1 | Multi-tenant SaaS | WORKING | `User.orgId`, `ApiKey.orgId`, all analytics/log queries filter by `req.user.orgId` / `req.org` | keep; add explicit isolation tests |
| 2 | User management | WORKING | `authController` register/verify/login; `User` model roles admin/developer/viewer | verify OTP + roles |
| 3 | Organization management | WORKING | `Organization` model, `orgController` settings/members | keep |
| 4 | API key auth | WORKING | `authenticateApiKey` — sha256 hash lookup, `isActive` check | keep; add revoke test |
| 5 | LLM request logging | WORKING | `unifiedProxyController` → BullMQ `interaction-logs` → `logWorker` → Mongo | keep |
| 6 | Response logging | WORKING | `extractResponse` stored on `InteractionLog.response` | add masking |
| 7 | Token tracking | WORKING | `tokens.{prompt,completion,total}` from provider usage | keep |
| 8 | Latency tracking | WORKING | `latency` = `Date.now() - start` | keep |
| 9 | Cost estimation | WORKING | `costCalculator.calculateCost` — `(pt·Pp + ct·Pc)/1000`, matches paper formula | add accuracy test |
| 10 | Prompt injection detection | PARTIAL | `injectionDetector` keyword list; pre-flight block when `policies.blockInjection` | keep, tune, test both modes |
| 11 | Jailbreak detection | **MISSING** | only strings "jailbreak"/"dan mode" in injection list; no score, no flag, not in formula | **new `jailbreakDetector`, own score J, wired to risk + pre-flight** |
| 12 | PII detection | PARTIAL | `piiDetector`: email, phone, aadhaar, PAN, creditCard, ssn | **add apiKey, password, JWT** |
| 13 | Sensitive keyword detection | PARTIAL | folded into `abuseDetector` "suspicious_keywords" | **split into own detector, configurable** |
| 14 | Abuse detection | PARTIAL | `abuseDetector`: prompt length + keyword heuristic | separate from sensitive-keyword; keep heuristic |
| 15 | Risk score generation | **BROKEN** | `riskWorker`: `0.4·P + 0.4·I + 0.2·A` — wrong weights, **no J term** | **`R = 0.35I + 0.30J + 0.20P + 0.15A`, 0–100** |
| 16 | Risk severity | **MISSING** | only numeric `riskScore` | **severity bands low/medium/high/critical** |
| 17 | Security alerts | **MISSING** | no notification on score > 80 | **`Notification`/alert on R > 80 → dashboard** |
| 18 | Audit logs | **MISSING** | no `AuditLog` model, controller, or route | **new `AuditLog` + hooks + view** |
| 19 | Analytics | WORKING | `analyticsController` overview/usage/top-users/high-risk/savings/cost-breakdown | keep |
| 20 | User activity | WORKING | `getTopUsers` aggregate by `userId` | keep |
| 21 | Model usage | PARTIAL | `getCostByModel` in `valueMetrics` | surface a model-usage endpoint/section |
| 22 | Cost analytics | WORKING | `getCostComparison`, `getValueReport` | keep, dedicated dashboard |
| 23 | Dashboard | PARTIAL | Next.js pages: dashboard, logs, playground, policies, providers, apikeys, team, billing | add security + cost pages; honest empty states |
| 24 | SDK integration | PARTIAL | Node SDK proxy + auto-patch + `/v1/log` logger; Python proxy wrapper | add explicit `.log()`; verify |
| 25 | Async workers | WORKING | BullMQ `interaction-logs` + `risk-analysis`; `workers/index.js`; compose `zyra-worker` | expose `:5001` health |
| 26 | MongoDB persistence | WORKING | Mongoose models; compose `zyra-mongodb` | keep |
| 27 | Redis queues/cache | WORKING | `config/queue.js`, `cacheLayer.js`, `idempotency.js`; compose `zyra-redis` | keep |
| 28 | Multi-provider support | PARTIAL | OpenAI/Anthropic/Groq inline, Gemini via adapter | verify all 4 with mocked HTTP |
| 29 | Cost optimization (product add-on) | WORKING | `costOptimizer.optimizeRequest`, `model:"auto"`, `/api/org/optimizer` | keep, demo |
| 30 | Provider fallback | WORKING | `retryHandler.executeWithRetry` + `buildFallbacks` | verify |
| 31 | Quality guard | WORKING | `qualityGuard.validateResponse` + upgrade retry | verify |

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
