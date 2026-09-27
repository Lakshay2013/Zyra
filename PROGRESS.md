# ZYRA MVP RECOVERY — PROGRESS LOG

> **Superseded (2026-09-09) by the paper-compliance effort on branch
> `demo-prep-paper-compliance`.** For current status see:
> `docs/PAPER_COMPLIANCE.md` (matrix + what changed + limitations),
> `docs/FACULTY_DEMO_GUIDE.md`, `docs/DEMO_CHEAT_SHEET.md`, `docs/TEACHER_QA.md`.
> The log below is the earlier MVP-recovery pass and is kept for history.

---


2026-08-30. Windows 11, Node 22, Docker Desktop.

## Runtime
- `docker compose up -d --build` → mongo + redis + api(:5000) + worker(:5001) — RUNTIME VERIFIED (isolated smoke stack)
- Local dev: `npm run dev` / `npm run worker` in backend; `npm run seed:dev` for a demo login+key
- Backend tests: `cd backend && npm test` → 86 pass (provider HTTP mocked with nock)
- SDK tests: `cd sdk && npm test` → 10 pass ; `cd sdk-python && python -m unittest discover -s tests` → 6 pass
- Frontend: `npm run build` → passes ; browser click-through of dashboard done

## Phase results
| Phase | Status | Verified how |
|---|---|---|
| 1 Env & runtime | WORKING | worker added to compose; /health real redis PING; worker /health endpoint; isolated compose smoke stack healthy |
| 2 Baseline | WORKING | queue E2E (API→BullMQ→worker→Mongo→risk) |
| 3 Core proxy | WORKING | traced; integration tests for chat/completions, model resolution, streaming (gemini), errors |
| 4 Providers | OpenAI/Anthropic/Groq CODE+MOCK VERIFIED; Gemini WORKING (new translation layer + 11 unit + 3 integration tests). RUNTIME (real keys) UNVERIFIED — no keys. Mixtral refs removed. |
| 5 Cost optimizer usable | WORKING | /api/org/optimizer + dashboard "Cost Optimization" tab; browser-verified save persists |
| 6 Validate optimization | CODE+MOCK VERIFIED | optimizeRequest unit tests (simple→downgrade, complex→premium floor, org tier cap, savings); proxy integ test "model:auto downgrades" |
| 7 Quality guard | WORKING | validateResponse tests (good/empty/short/refusal) + fallback path in proxy |
| 8 Reliability/fallbacks | WORKING | retry (429→200), non-retry (401), cross-provider fallback integ tests; dashboard Reliability tab + Providers fallback reorder+save |
| 9 Idempotency | WORKING | services/idempotency.js + 5 tests (seq / concurrent / diff keys / body mismatch 422) |
| 10 Monthly limit atomicity | WORKING | services/usageLimiter.js atomic $expr; concurrency test (5 parallel, exactly 1 passes); worker/ingest/universal no longer double-count |
| 11 Security PII pre-flight | WORKING | blocks BEFORE provider; test asserts provider mock never called; injection same |
| 12 Policies UI | WORKING | dashboard "Policies" tab → /api/org/policies |
| 13 Provider Test All | WORKING | real POST /api/org/providers/test (1-token calls); browser-verified (shows real FAILED + reason); fake toast removed |
| 14 Analytics | WORKING | log fields end-to-end; dashboard shows real numbers (verified: Total Requests reflects real logs) |
| 15 Dashboard polish | WORKING | Playground reads x-zyra-* headers (CORS exposedHeaders added); Logs real 10s auto-refresh + Refresh btn + honest "LIVE/PAUSED"; fake profile "System Preferences"/perf-strip removed |
| 16 Node SDK | WORKING | `import Zyra from "zyra-sdk"` + named import both work; dead root sdk/index.js + test.js removed; legacy AIShield/OpenAIShield removed; exports map fixed |
| 17 SDK tests | WORKING | 10 tests (mock gateway): construction, apiKey, baseURL, headers, model:auto, streaming, errors, logger dispatch |
| 18 Backend test suite | WORKING | node:test + supertest + nock, 86 tests, `npm test` |
| 19 Provider smoke | WORKING | `npm run test:providers` — real calls, only providers with keys set |
| 20 Deployment | WORKING | compose worker service; images build; isolated stack runtime-verified; .env.production.example completed |
| 21 Observability | PARTIAL | request logging solid; no request-id correlation header (noted below) |
| 22 Cleanup | DONE (core) | Mixtral, fake buttons, dead SDK, lazy Razorpay |
| 23 README | DONE | rewritten; honest about heuristics + manual pricing + no "90% guaranteed" |
| 24 Product experience | WORKING | register→verify→login→keys→providers→settings→playground→logs flow works in UI |
| 25 Final E2E | PARTIAL | tests 1,2,3,4,5,6 covered by suite w/ mocked providers; test 7 (dashboard) browser-verified; test 8 (docker) verified. Real-provider E2E (tests needing live keys) UNVERIFIED. |

## 2026-09-03 — independent re-verification pass

Re-ran everything from a cold start (Docker was down). All prior-session work holds up.

- `docker compose up -d --build` → mongo + redis + **api + worker all healthy**. RUNTIME VERIFIED.
- Queue E2E RUNTIME VERIFIED live: `POST /v1/log` (canonical payload) → 202 → BullMQ → worker → `interactionlogs` doc in Mongo with recalculated cost + `wasOptimized` flag.
- `cd backend && npm test` → **86 pass / 0 fail** (47 unit + 39 integration, real Mongo:27018 + Redis:6380, provider HTTP mocked).
- `cd sdk && npm test` → 10 pass. `cd sdk-python && python -m unittest discover -s tests` → 6 pass.
- `zyra-landing && npm run build` → passes (22 routes).
- Browser click-through against the live stack (demo@zyra.local): Dashboard shows real request count (2, matching the logs posted), Logs page real data + honest "AUTO-REFRESH: ON (10s)", Settings → Cost Optimization / Reliability / Policies / Security tabs all fetch + render real backend state, honest disclaimers present. Optimizer/reliability/policies PUT round-trips verified via API. Providers "TEST ALL" returns honest `not configured` (no fake success). Playground proxy call returns honest `configuration_error` when no provider key (real routing attempted).

### Fixes made this pass
- **backend/package.json + package-lock.json**: removed bogus self-referential `"zyra-backend": "file:"` dependency (created a recursive `node_modules/zyra-backend` symlink; risked `npm ci` breakage in Docker/CI). `npm ci --only=production`, full `npm test`, and `docker compose build` all re-verified green after removal.
- **zyra-landing/app/layout.tsx**: page `<title>` / OG title "Reduce AI Costs by 90%" → "Cut AI Costs with Smart Routing" (flat 90% guarantee claim, contradicts Phase 23 honesty rule).
- **zyra-landing/app/page.tsx**: hero subline "save up to 90% across providers" → "Route every request to the cheapest capable model across providers. Savings scale with your workload and model mix."
- (Left `app/platform/page.tsx` "saving up to 90%" — hedged + scenario-specific for a GPT-4o→Llama classification route, which is genuinely ~90%+ cheaper per token. `components/ui/hero-section.tsx` still says "up to 90%" but is dead code, imported nowhere.)

## Known gaps / follow-ups
- Real provider connectivity (OpenAI/Anthropic/Groq/Gemini) never RUNTIME-verified — no API keys available. Code paths are covered by mocked tests + `npm run test:providers` is ready.
- Python SDK: no auto-patch integration test (only unit).
- No X-Request-Id correlation across log lines (Phase 21 nice-to-have).
- Playground streaming won't populate debug headers in-browser (SSE), non-stream does.
- demo org in `ai-shield` db has stale un-decryptable groq key from a prior session (harmless; surfaces correctly as "stored key could not be decrypted").
