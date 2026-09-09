# Zyra — AI Cost Optimization Proxy

> **v0.1.0-beta.** An OpenAI-compatible gateway that sits between your app and the
> LLM providers, routing each request to the cheapest model that can handle it,
> with retries, cross-provider fallback, response caching, idempotency, and
> pre-flight security checks.

Point your existing OpenAI (or Anthropic) client at Zyra, send `model: "auto"`,
and Zyra picks the model. No other code changes.

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
docker compose up -d ai-shield-mongo ai-shield-redis
```

## Quick start (local dev)

```bash
docker compose up -d ai-shield-mongo ai-shield-redis   # Mongo :27018, Redis :6380

cd backend && npm install && cp .env.example .env
npm run dev        # API  → :5000
npm run worker     # worker → :5001   (separate terminal)
npm run seed:dev   # prints a demo login + a ready Zyra API key + a JWT

cd ../zyra-landing && npm install
cp .env.production.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev        # dashboard → :3000
```

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
`x-zyra-fallback`, `x-zyra-quality-retry`.

---

## Dashboard

`Register → verify email (OTP) → login → API Keys → Providers → Settings →
Playground → Logs → Dashboard.`

- **Providers** — add/remove provider keys; **Test All** makes a real 1-token
  request against each configured provider and reports connected/failed + latency;
  drag the fallback order and save it.
- **Settings → Cost Optimization** — toggle auto-optimization, set the quality-tier floor.
- **Settings → Reliability** — toggle retries, set max retries (0–5).
- **Settings → Policies** — PII blocking, injection blocking, max tokens per request.
- **Playground** — send real requests, see requested vs. selected model, provider,
  cost, savings, complexity, fallback.

---

## Testing

```bash
cd backend && npm test          # ~86 unit + integration tests (node:test)
                                # provider HTTP is mocked with nock — no real API calls
cd sdk && npm test              # Node SDK tests (mock gateway)
cd sdk-python && python -m unittest discover -s tests

cd backend && npm run test:providers   # OPTIONAL: real calls, only runs providers
                                       # whose OPENAI_API_KEY / ANTHROPIC_API_KEY /
                                       # GROQ_API_KEY / GEMINI_API_KEY is set
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
