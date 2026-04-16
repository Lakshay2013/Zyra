# Zyra

Zyra is an AI cost optimization proxy that sits between your application and LLM providers. It intelligently routes every API request to the cheapest model that can handle the task, reducing spend by up to 90% without requiring any code changes.

## The Problem

Most teams default to expensive models like GPT-4 for every request, even when simpler models would produce identical results. This leads to runaway costs, unpredictable billing, and vendor lock-in to a single provider.

## How Zyra Solves It

Zyra acts as a transparent proxy layer. You swap in the Zyra SDK (a drop-in replacement for your existing OpenAI/Anthropic client), and Zyra handles the rest:

- **Cost Engine** -- Evaluates the complexity of each request and routes it to the most cost-effective model that can deliver equivalent output quality.
- **Quality Guard** -- Ensures complex reasoning tasks stay on premium models. Only downgrades when the output quality will remain the same.
- **Automatic Fallbacks** -- If a provider goes down or hits rate limits, Zyra fails over to backup providers with sub-second detection. Your requests are never lost.
- **Security Layer** -- Every request is evaluated for prompt injection, PII leakage, and anomalous payloads before it leaves your infrastructure.
- **Real-Time Observability** -- A dashboard that tracks cost per request, savings over time, provider distribution, and threat interception across your entire team.

## Architecture

```
Your App --> Zyra Proxy --> [Cost Engine --> Quality Guard --> Router] --> Provider (OpenAI / Anthropic / Groq / Mistral)
```

One endpoint. Your code calls Zyra the same way it calls OpenAI. Zyra intercepts the request, runs cost analysis, picks the optimal provider, and returns the response transparently.

## Technical Stack

**Frontend** (`/zyra-landing`)
- Next.js 16 (App Router), Tailwind CSS v4, Framer Motion
- Google OAuth and JWT-based authentication
- Real-time analytics dashboard with cost tracking and traffic visualization

**Backend** (`/backend`)
- Node.js with Express
- MongoDB for users, organizations, logs, and analytics
- Redis for caching and rate limiting
- Security middleware: Helmet, xss-clean, express-mongo-sanitize

**SDK** (`/sdk`)
- Drop-in replacement for OpenAI SDK
- Automatic request routing through the Zyra proxy
- TypeScript support with full type definitions

## Getting Started

Backend:
```bash
cd backend
npm install
npm run dev
# Server running on localhost:5000
```

Frontend:
```bash
cd zyra-landing
npm install
npm run dev
# Dashboard available at localhost:3000
```

## How It Works in Practice

```javascript
import Zyra from "zyra-sdk";

const client = new Zyra({ apiKey: process.env.ZYRA_KEY });

const res = await client.chat.completions.create({
  model: "auto",  // Zyra picks the cheapest capable model
  messages: [{ role: "user", content: "Hello" }],
});
```

That is the entire integration. No configuration files, no routing logic, no provider management. Zyra handles model selection, cost tracking, and failover automatically.
