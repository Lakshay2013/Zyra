# Zyra — Secure LLM Logging, Risk Monitoring & Cost Analytics

> **v0.1.0-beta.** A multi-tenant SaaS platform that logs every LLM interaction,
> analyses it for security risks (prompt injection, jailbreaks, PII, sensitive
> keywords, abuse), assigns a risk score, and tracks token usage and cost —
> behind one lightweight SDK, vendor-agnostic across OpenAI / Anthropic / Groq /
> Gemini.
>
> It also ships a **cost-aware routing engine**: point your OpenAI or Anthropic
> client at Zyra, send `model: "auto"`, and Zyra routes each request to the
> cheapest capable model. No other code changes.

Reference paper: `docs/zyra-paper-v1.docx`.
**Demoing this to faculty?** → `docs/FACULTY_DEMO_GUIDE.md` + `docs/DEMO_CHEAT_SHEET.md` + `docs/TEACHER_QA.md`.
Paper ↔ code mapping → `docs/PAPER_COMPLIANCE.md`.

---

## Security & risk (the paper's core contribution)

| Capability | How it works |
|---|---|
| **Pre-flight blocking** | When enabled, prompts matching prompt-injection / jailbreak / PII rules are rejected with HTTP 403 **before any provider is contacted**. Toggles: `policies.blockInjection` (default on), `blockJailbreak` (default off), `blockPII` (default off). |
| **PII detection + masking** | email · phone · Aadhaar · PAN · credit card · SSN · API keys · passwords · JWT. Matched values are **masked before storage** (`john@x.com → j***@x.com`); only categories are ever logged. |
| **Risk score** | Every interaction is scored asynchronously: `R = 0.35·I + 0.30·J + 0.20·P + 0.15·A` (injection, jailbreak, PII, abuse-frequency), 0–100, with severity bands. `R > 80` raises an admin dashboard notification. |
| **Risk reports & audit log** | A `RiskReport` per analysed interaction; an `AuditLog` for auth / API-key / policy / provider-config events. |

Detection is **deterministic rule/regex** — fast and explainable, not an ML
classifier. Novel phrasings can slip past pre-flight blocking; they are still
logged and risk-scored post-hoc.

---

## What Zyra actually does

| Capability | How it works | Honest limitations |
|---|---|---|
| **Cost routing** | Classifies each prompt as `simple` / `standard` / `complex`, maps that to a quality tier, and picks the cheapest model **in that tier among the providers you've configured a key for**. Only switches if it saves money. | Complexity classification is **heuristic** (length + keyword regexes), not an ML model. The pricing table (`backend/src/utils/costCalculator.js`) is **hand-maintained**, not live. |
| **Quality guard** | After a downgraded response comes back, checks for empty / very-short / refusal-pattern output and retries once on a higher tier. | Lightweight pattern matching. It is **not** a semantic quality score. |
| **Reliability** | Bounded exponential backoff on `429/500/502/503/504` and connection errors. `401/403`/invalid-model are never retried. After retries are exhausted, falls back to the next provider in your configured order. | — |
| **PII blocking** | When `blockPII` is on, prompts containing email / phone / credit-card / SSN / Aadhaar / PAN are rejected **before the request is sent to any provider** (HTTP 403, `pii_type` categories only — never the matched values). | Regex-based detection. |
| **Prompt-injection blocking** | When `blockInjection` is on, prompts matching known jailbreak phrases are rejected pre-flight. | Keyword matching, not an ML classifier. |
| **Idempotency** | `Idempotency-Key` header on `/v1/chat/completions`: a retried request replays the stored result instead of calling the provider again. Concurrent duplicates collapse to one provider call. Same key + different body → 422. | Requires Redis. Non-streaming requests only. 24h replay window. |
| **Monthly limits** | Usage is reserved with a single atomic conditional MongoDB update, so concurrent requests can't both cross the plan boundary. | — |
| **Response cache** | Exact-match (model + messages + params) cache in Redis, per-org TTL. | Exact match only — no semantic cache. |
| **Observability** | Every request is logged async (BullMQ → MongoDB) with provider, model, tokens, cost, savings, retry/fallback flags. A risk score (PII/injection/abuse) is computed **post-hoc**. | Post-hoc risk analysis is separate from the pre-flight blocking above. |

### Savings

Zyra routes traffic toward lower-cost capable models. **How much you save
depends entirely on your workload mix** — a stream of short classification calls
saves a lot; a stream of hard reasoning tasks saves little or nothing. Zyra does
not guarantee a fixed percentage.

---

## Supported providers

| Provider | Endpoint used | Auth |
|---|---|---|
| OpenAI | `/v1/chat/completions` | `Authorization: Bearer` |
| Anthropic | native `/v1/messages` (also accepts OpenAI-format requests, translated) | `x-api-key` |
| Groq | `/openai/v1/chat/completions` | `Authorization: Bearer` |
| Google Gemini | `generateContent` — full request/response translation (`contents`/`parts`, `systemInstruction`, `generationConfig`) | `x-goog-api-key` |

You can also point a native **Anthropic** client at `POST /v1/messages` and Zyra
forwards it transparently.

---

## Architecture

```
Your app ─▶ Zyra /v1  ─▶ auth (API key)
                        ─▶ model resolution ("auto" | "gpt-4o" | "openai/gpt-4o")
                        ─▶ pre-flight: injection + PII checks
                        ─▶ idempotency check
                        ─▶ response cache check
                        ─▶ atomic usage reservation
                        ─▶ cost optimizer (tier + cheapest capable model)
                        ─▶ provider call ── retry ── fallback ── quality guard
                        ─▶ cost calculation
                        ─▶ response to caller
                        ─▶ async: BullMQ ─▶ worker ─▶ MongoDB ─▶ risk analysis
```

**Stack:** Next.js 16 dashboard · Node/Express 5 API · MongoDB/Mongoose ·
Redis · BullMQ worker · Node & Python SDKs.

---

## Quick start (Docker — full stack)

```bash
cp backend/.env.example backend/.env      # then edit JWT_SECRET, ENCRYPTION_KEY, SMTP…
docker compose up -d --build
```

This starts **MongoDB, Redis, the API (`:5000`), and the BullMQ worker
(`:5001/health`)**. Check them:

```bash
curl localhost:5000/health      # {"status":"ok","mongo":true,"redis":true}
curl localhost:5001/health      # {"status":"ok","workers":{"logs":true,"risk":true}}
```

Databases only:

```bash
docker compose up -d zyra-mongo zyra-redis
```

## Quick start (local dev)

```bash
docker compose up -d zyra-mongo zyra-redis   # Mongo :27018, Redis :6380

cd backend && npm install && cp .env.example .env
npm run dev        # API  → :5000
npm run worker     # worker → :5001   (separate terminal)
npm run seed:dev   # prints a demo login + a ready Zyra API key + a JWT

cd ../zyra-landing && npm install
cp .env.production.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev        # dashboard → :3000
```

## Demo mode (no provider keys needed)

```bash
cd backend && npm run demo:seed     # two demo tenants + ~100 synthetic
                                    # interactions through the REAL pipeline
#   login: admin@zyrademoco.demo / demo-password-123
npm run demo:reset                  # removes ONLY isDemo data
node scripts/demo-e2e.js            # 17 live end-to-end checks
```

With `Organization.demoMode` on (the demo seed sets it), every LLM call is served
by a built-in **simulator** — routing, cost, risk analysis and logging still run
for real; responses are templated and flagged (`simulated: true`,
`x-zyra-simulated` header). Toggle it in **Settings → Policies**.

---

## Using it

### Node SDK

```js
import Zyra from "zyra-sdk";              // or: const { Zyra } = require("zyra-sdk")

const client = new Zyra({
  apiKey: process.env.ZYRA_API_KEY,
  baseURL: "http://localhost:5000/v1",
  debug: true,                            // returns x-zyra-* routing headers
});

const res = await client.chat.completions.create({
  model: "auto",                          // Zyra picks the model
  messages: [{ role: "user", content: "Hello" }],
});
```

`Zyra` extends the OpenAI client, so streaming and every OpenAI-compatible
parameter work unchanged. Routing constraints:

```js
new Zyra({ apiKey, routing: { maxCost: 0.01, providers: ["openai", "groq"], mode: "constrained" } })
```

### Python SDK

```python
from zyra import Zyra                      # pip install 'zyra[openai]'
client = Zyra(api_key="sk-live-...", base_url="http://localhost:5000")
res = client.chat.completions.create(model="auto", messages=[{"role": "user", "content": "Hi"}])
```

### Raw HTTP

```bash
curl localhost:5000/v1/chat/completions \
  -H "x-zyra-api-key: $ZYRA_API_KEY" \
  -H "x-zyra-debug: true" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'
```

Response headers in debug mode: `x-zyra-model`, `x-zyra-provider`,
`x-zyra-cost`, `x-zyra-savings`, `x-zyra-complexity`, `x-zyra-cached`,
`x-zyra-fallback`, `x-zyra-quality-retry`, `x-zyra-simulated`.

### Explicit logging (no proxy)

```js
await client.log({ userId: "USR001", prompt, response,
                   model: "gpt-4o", promptTokens, completionTokens });
```
```python
from zyra import log
log(user_id="USR001", prompt=prompt, response=response,
    model="gpt-4o", prompt_tokens=pt, completion_tokens=ct)
```
`prompt` / `response` are masked before storage and feed the risk score, exactly
like a proxied request.

---

## Dashboard

`Register → verify email (OTP) → login → API Keys → Providers → Settings →
Playground → Security & Risk → Cost Analytics → Logs → Audit.`

- **Playground** — send a request, see security outcome (SAFE / BLOCKED + matched
  patterns), requested vs. selected model, provider, complexity, baseline vs.
  optimized cost, savings. Attack presets built in.
- **Security & Risk** — the risk formula, stat grid (injections / jailbreaks /
  PII / sensitive / blocked / critical), risk trend, `RiskReport` table with the
  `I J P A` component columns, click-through detail with the weighted breakdown
  and the masked interaction.
- **Cost Analytics** — token split, *Without Zyra vs With Zyra* comparison, cost
  over time, cost by model / user, routing swaps.
- **Audit Log** (admin) — auth / API-key / policy / provider-config events.
- **Providers** — add/remove keys; **Test All** makes a real 1-token request per
  provider; drag the fallback order.
- **Settings** — Cost Optimization (auto + tier floor), Reliability (retries
  0–5), Policies (PII / injection / **jailbreak** blocking, **sensitive
  keywords**, max tokens, **demo mode**).

---

## Testing

```bash
cd backend && npm test          # 131 unit + integration tests (node:test)
                                # provider HTTP is mocked with nock — no real API calls
cd sdk && npm test              # 12 Node SDK tests (mock gateway)
cd sdk-python && python -m unittest discover -s tests   # 7 Python SDK tests

# reproducible evaluations (see docs/PAPER_COMPLIANCE.md)
cd backend
npm run eval:security           # detector precision / recall vs the paper's numbers
npm run test:cost-accuracy      # cost formula deviation
BENCH_N=2000 npm run benchmark:logging   # logging success rate + latency

npm run test:providers          # OPTIONAL: real calls, only providers whose
                                # OPENAI_API_KEY / ANTHROPIC_API_KEY / GROQ_API_KEY /
                                # GEMINI_API_KEY is set
```

---

## Environment variables

### `backend/.env` (see `.env.example` / `.env.production.example`)

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` | yes | |
| `JWT_SECRET` | yes | |
| `ENCRYPTION_KEY` | yes | 64 hex chars — encrypts stored provider keys at rest |
| `REDIS_HOST` / `REDIS_PORT` | yes | rate limiting, cache, idempotency, BullMQ. `REDIS_PASSWORD` switches to `rediss://` |
| `FRONTEND_URL` | yes | comma-separated CORS origins |
| `WORKER_HEALTH_PORT` | no | default `5001` |
| `SMTP_HOST/PORT/USER/PASS` | prod | signup OTP emails (dev logs the code instead) |
| `GOOGLE_CLIENT_ID` | no | "Sign in with Google" |
| `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` | no | only for paid plans; billing endpoints return 503 without them |

### `zyra-landing/.env.local`

| Variable | Required |
|---|---|
| `NEXT_PUBLIC_API_URL` | yes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | no |

---

## Deployment notes

- **API** and **worker** run the same image, different commands
  (`node src/index.js` vs `node src/workers/index.js`). Both must run in production —
  without the worker, logs and analytics never persist.
- Managed MongoDB (Atlas) + managed Redis (Upstash/Railway). Set `REDIS_PASSWORD`
  for TLS.
- The frontend deploys to Vercel with root `zyra-landing`.

## License

MIT
