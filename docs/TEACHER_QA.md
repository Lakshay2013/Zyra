# Zyra — Anticipated Faculty Questions & Answers

Answers reflect the **actual implementation** on branch `demo-prep-paper-compliance`.
Where the paper reports a number we could not independently reproduce, that is
stated explicitly.

---

### 1. What problem does Zyra solve?
LLMs are going into production faster than the tooling to govern them. Existing
observability products (LangSmith, Helicone, OpenLIT) focus on tracing and cost.
None do **security auditing** — prompt-injection / jailbreak / PII detection and
a per-interaction risk score. Zyra adds that layer on top of logging + cost
analytics, multi-tenant, behind one lightweight SDK, vendor-agnostic.

### 2. Why not just use LangSmith / Helicone?
They're complementary but scoped differently. LangSmith is a debugger for
LangChain traces; Helicone is a cost/latency proxy. Neither blocks a
prompt-injection attempt pre-flight, computes a jailbreak score, or masks PII
before storage. Zyra's comparison table (paper Table IV) is on those exact axes.

### 3. What makes Zyra different / what's the contribution?
(a) Security + risk monitoring folded into an observability platform;
(b) a concrete composite **risk score** `R = 0.35I + 0.30J + 0.20P + 0.15A`;
(c) multi-tenant SaaS design so small teams share infra with isolated data.
Beyond the paper, this build also adds a **cost-aware routing engine**
(`model: "auto"`).

### 4. How does prompt-injection detection work?
`backend/src/utils/injectionDetector.js` — a set of **weighted regular
expressions** over the flattened prompt: instruction-override phrases
("ignore/disregard … previous instructions"), system-prompt exfiltration
("reveal the system prompt"), privilege escalation ("act as administrator"),
restriction bypass, hidden-command execution, and Llama-style delimiter
injection. Each match adds a weight; total ≥ 30 ⇒ flagged. If
`policies.blockInjection` is on, the request returns **403 before any provider is
contacted**. It is **not** an ML classifier — deliberately, per the paper.

### 5. How does jailbreak detection work?
`jailbreakDetector.js`, same architecture, different target: the **safety policy**
rather than the instruction layer. Patterns for named personas ("DAN", "developer
mode"), role-play framing, "you have no restrictions", refusal suppression
("never say I can't"), fictional-framing extraction, and coercion/token-game
patterns. Produces the **J** term. Blocking is opt-in (`policies.blockJailbreak`,
off by default) — when off, the jailbreak still raises the risk score.

### 6. How is PII detected? Which types?
`piiDetector.js` — regex per category: **email, Indian mobile, Aadhaar, PAN,
credit card, SSN, API keys** (`sk-…`, `AKIA…`, `ghp_…`, `AIza…`, `xox…`, bearer
tokens), **passwords** (`password: …`), **JWT** (`eyJ….eyJ….sig`). Two functions:
`detectPII` returns only the **categories** present (never the values);
`maskPII` returns the text with each match replaced (`john@x.com → j***@x.com`,
card → `****-****-****-1234`, secrets → `<redacted:apiKey>`).

### 7. How is the risk score calculated?
Component scores (0–100) come from the four detectors. The **risk worker**
combines them with the paper's weights:
`R = round(0.35·I + 0.30·J + 0.20·P + 0.15·A)`.
`A` blends a per-prompt abuse signal with an **abuse-frequency** term (count of
that user's flagged interactions in the last 24 h). Severity bands:
low/medium/high/critical at 25/50/80. `R > 80` writes a `Notification` for the
admin. Every analysed interaction also gets a `RiskReport` document (the paper's
"Risk Report Collection").

### 8. Why is PII/injection blocked *before* the provider but the risk score is *after*?
Blocking must be synchronous — you can't un-send a prompt. The composite score
needs the response text and cross-user history, and the paper's whole premise is
that analysis is **asynchronous so it adds zero latency**. So: cheap deterministic
checks gate the request; the full score is computed on a background worker.

### 9. Why Redis?
Four things that all need fast shared state: the **BullMQ job queue** (log +
risk), the **response cache** (exact match, per-org TTL), **idempotency keys**
(`Idempotency-Key` header → replay stored result), and **rate-limit counters**.

### 10. Why MongoDB?
Interaction logs are semi-structured and append-heavy, and the risk metadata
evolves (we added `jailbreakScore`, `severity`, `blocked`, `simulated` during
this work without a migration). Per-tenant compound indexes
(`{orgId, createdAt}`, `{orgId, riskScore}`) keep dashboard queries fast.

### 11. Why asynchronous workers?
So the client's LLM call is never blocked by logging or analysis. The proxy
returns the provider's response, then `queue.add()` (a few ms) hands off to
`interaction-logs` → log worker (mask + detect + persist) → `risk-analysis` →
risk worker (score + report + notify).

### 12. Why BullMQ specifically?
It's the mature Redis-backed queue for Node: retries, backoff, concurrency,
graceful shutdown, a job-state API we use in tests. Two named queues keep the
"store the log" and "score the risk" stages independently observable.

### 13. How does multi-tenancy work / how is data isolated?
`User` has an `orgId`; `ApiKey` has an `orgId`. The dashboard middleware puts
`req.user.orgId` on every request from the JWT; the proxy middleware puts
`req.org` from the API-key lookup. **Every** database query filters by that org
id. There is no endpoint that returns cross-org data. The demo proves it: as
Demo Co, fetching an Acme `RiskReport` id returns **404**.

### 14. How are API keys secured?
Generated as `sk-live-<48 hex>`, we store only the **SHA-256 hash** and a
16-char prefix. Auth is a hash lookup with an `isActive` check. Revoking flips
`isActive`. The raw key is shown exactly once, at creation.

### 15. How is cost calculated? How accurate is it?
`Cost = (prompt_tokens·Pp + completion_tokens·Pc) / 1000`, `Pp/Pc` from a
hand-maintained table (`costCalculator.js`). `npm run test:cost-accuracy` shows
the implementation matches that formula with **0.0000% deviation** over 60
model×case checks. The paper's "**< ±2% vs provider invoices**" needs live
billing data we don't have — we present it as *paper-reported*, not reproduced.

### 16. How does model optimization / `model: "auto"` work?
`costOptimizer.js`: (1) classify prompt complexity — `simple` / `standard` /
`complex` — by length + keyword regexes (code blocks, "analyze", "step by step",
greetings, factual "what is"); (2) map to a quality tier
(economy/standard/premium); (3) among models in that tier for which the org has a
provider key, pick the **cheapest**; (4) only switch if it actually saves money.
It's heuristic, not "AI-powered" — the deterministic version is what runs.

### 17. How does fallback work? What happens if OpenAI goes down?
`retryHandler.js`: on `429/500/502/503/504` or a connection error, bounded
exponential backoff (base 500 ms, jitter, cap 10 s), up to `maxRetries`
(org-configurable 0–5). `401/403`/invalid-model are **never** retried. After
retries are exhausted, Zyra tries the next provider in the org's configured
`fallbackOrder`, translating the model. `reliability.test.js` covers 429→200,
401→fail-fast, and cross-provider fallback.

### 18. How does Zyra support different providers?
OpenAI, Groq (OpenAI-compatible) and Anthropic are called directly with a
per-provider auth header. **Gemini** has a full translation layer
(`services/providers/gemini.js`): OpenAI `messages` ↔ Gemini `contents`/`parts`,
`systemInstruction`, `generationConfig`, response normalisation, `usageMetadata`
→ token counts. There's also a **simulator** provider for demo mode.

### 19. How does the SDK work?
The Node `Zyra` class **extends the OpenAI client** with the Zyra base URL and an
`x-zyra-api-key` header, so `client.chat.completions.create(...)`, streaming and
every OpenAI parameter work unchanged. Routing constraints (`maxCost`,
`providers`, `mode`) become `x-zyra-*` headers. `zyra.log({...})` posts an
explicit interaction to `/v1/log`. Python SDK mirrors this and adds a global
auto-patch.

### 20. What is the latency overhead?
Logging adds essentially nothing to the LLM call — it's one `queue.add()`
(~2–5 ms) and then fully async. Zyra's own request-path overhead (auth =
one indexed Mongo lookup, Redis rate-limit check, optimizer, enqueue) measured
**~110–125 ms p50 on a single-box local Docker stack on Windows** — see
`npm run benchmark:logging`. The paper reports **47 ms average logging time** on
its own deployment; that's a different quantity on different hardware, kept as
paper-reported.

### 21. What are the limitations?
(a) Detection is rule-based — novel phrasings can slip past; (b) no automatic
**response remediation** (Zyra flags and can block the prompt, but doesn't
sanitise a model's output); (c) pricing table is manual; (d) no custom
dashboards / deep analytics; (e) "real-time" dashboard = **polling** (10–20 s),
not WebSockets — the UI says so honestly; (f) large-scale deployment would need
sharding / stream processing.

### 22. Is the security detector ML-based?
No. Deterministic regex/keyword rules. The paper is explicit about this too
("primarily focused on the rule-based approaches … more advanced methods such as
anomaly detection can be utilised in future"). Trade-off: fast, explainable,
zero training data, no drift — but recall on unseen attack styles is the cost.

### 23. What happens with an unseen / novel attack?
It may not be **blocked** pre-flight. But it's still **logged**, and the risk
worker scores it post-hoc — if the response or cross-user pattern looks bad the
interaction is flagged and (if `R > 80`) an admin is notified. So a missed block
degrades to "detected late", not "invisible".

### 24. How scalable is the architecture?
Horizontally: the API and the workers are separate processes sharing one image
(`docker-compose`), each scalable independently; MongoDB and Redis are the
stateful tier (Atlas + Upstash in the deploy notes). The queue decouples
ingestion rate from analysis rate. Bottlenecks at very high volume would be Mongo
write throughput and single-Redis — addressed with sharding / Redis Cluster /
stream processing, noted as future work.

### 25. What would you implement next?
In priority order: (1) an ML anomaly-detection second stage behind the rules;
(2) response-side remediation (sanitise / redact model output);
(3) live pricing feeds; (4) SSE/WebSocket real-time dashboard;
(5) native SDKs for Go / Java / .NET (the backend is already language-agnostic
via `/v1/log`).

### 26. Are the paper's experimental numbers reproduced in this demo?
Partially, and we keep them **separate**:
- **Logging success rate** — paper 99.96%; local runs of 500–2000 requests:
  **100%** of logs persisted.
- **Injection / jailbreak / PII precision** — paper 96.0 / 94.4 / 98.0%; our
  `npm run eval:security` on a 45-prompt **public** set: injection **84.6%**,
  jailbreak **91.7%**, PII+sensitive **100%**, **100% recall**, **0** benign
  false positives. Different (smaller, public) test set — reported as-is.
- **Cost error < ±2%** — paper-reported; we verify the *formula* exactly but
  can't measure error vs a real invoice offline.
All of this is in `docs/PAPER_COMPLIANCE.md`.

### 27. Why is there a "simulator" / demo mode — isn't that faking it?
Demo mode swaps only the **network call to the LLM** for a templated response so
the platform can be shown with no API keys. Routing, complexity classification,
cost maths, masking, the detectors, the risk score, the queue, the workers and
every dashboard query **run for real**. Every simulated interaction is flagged
(`simulated: true`, `x-zyra-simulated` header, "SIMULATED" badge). Point a real
provider key at it and the same pipeline runs against a real model.

### 28. Where does the risk-interpretation / severity table come from?
The paper's interpretation figure isn't machine-readable, so the bands
(low 0–24, medium 25–49, high 50–79, critical 80–100) are our implementation
choice, documented in `PAPER_COMPLIANCE.md`. The **80** threshold for admin
notification is taken directly from the paper.
