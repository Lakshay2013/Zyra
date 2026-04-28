# Zyra — AI Cost Optimization Proxy

> **v0.1.0-beta** — Currently in early access. Core proxy, dashboard, and SDK are functional.

Zyra is an AI cost optimization proxy that sits between your application and LLM providers. It intelligently routes every API request to the cheapest model that can handle the task, reducing spend by up to 90% without requiring any code changes.

## The Problem

Most teams default to expensive models like GPT-4 for every request, even when simpler models would produce identical results. This leads to runaway costs, unpredictable billing, and vendor lock-in to a single provider.

## How Zyra Solves It

Zyra acts as a transparent proxy layer. You swap in the Zyra SDK (a drop-in replacement for your existing OpenAI/Anthropic client), and Zyra handles the rest:

- **Cost Engine** — Evaluates the complexity of each request and routes it to the most cost-effective model that can deliver equivalent output quality.
- **Quality Guard** — Ensures complex reasoning tasks stay on premium models. Only downgrades when the output quality will remain the same.
- **Automatic Fallbacks** — If a provider goes down or hits rate limits, Zyra fails over to backup providers with sub-second detection. Your requests are never lost.
- **Security Layer** — Every request is evaluated for prompt injection, PII leakage, and anomalous payloads before it leaves your infrastructure.
- **Real-Time Observability** — A dashboard that tracks cost per request, savings over time, provider distribution, and threat interception across your entire team.

## Architecture

```
Your App --> Zyra Proxy --> [Cost Engine --> Quality Guard --> Router] --> Provider (OpenAI / Anthropic / Groq / Gemini)
```

One endpoint. Your code calls Zyra the same way it calls OpenAI. Zyra intercepts the request, runs cost analysis, picks the optimal provider, and returns the response transparently.

## Technical Stack

**Frontend** (`/zyra-landing`)
- Next.js 16 (App Router), Tailwind CSS v4, Framer Motion
- Google OAuth and JWT-based authentication
- Real-time analytics dashboard with cost tracking and traffic visualization

**Backend** (`/backend`)
- Node.js with Express 5
- MongoDB for users, organizations, logs, and analytics
- Redis for caching and rate limiting
- Security middleware: Helmet, xss-clean, express-mongo-sanitize

**SDK** (`/sdk`)
- Drop-in replacement for OpenAI SDK
- Automatic request routing through the Zyra proxy
- TypeScript support with full type definitions

## Quick Start (Local Development)

### Prerequisites
- Node.js >= 18
- Docker (for MongoDB + Redis)

### 1. Start databases
```bash
docker-compose up -d ai-shield-mongo ai-shield-redis
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # Edit with your secrets
npm install
npm run dev                  # Runs on localhost:5000
```

### 3. Frontend
```bash
cd zyra-landing
cp .env.production.example .env.local   # Edit with your config
npm install
npm run dev                  # Runs on localhost:3000
```

### 4. Both (from root)
```bash
npm install
npm run dev                  # Starts frontend + backend concurrently
```

## Production Deployment

### Backend (Railway / Render)

1. Create a new project on [Railway](https://railway.app) or [Render](https://render.com)
2. Connect your GitHub repository
3. Set the root directory to `backend`
4. Add all environment variables from `backend/.env.production.example`
5. Set the start command to `npm start`
6. Add a MongoDB (Atlas) and Redis (Upstash or Railway) addon

### Frontend (Vercel)

1. Import your repository on [Vercel](https://vercel.com)
2. Set the root directory to `zyra-landing`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your deployed backend URL
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your Google OAuth client ID
4. Deploy

### Full Stack (Docker)

```bash
docker-compose up --build -d
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

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `REDIS_HOST` | Yes | Redis hostname |
| `REDIS_PORT` | Yes | Redis port |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `ENCRYPTION_KEY` | Yes | 64-char hex key for encrypting stored provider keys |
| `FRONTEND_URL` | Yes | Frontend URL(s) for CORS (comma-separated) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `NODE_ENV` | No | `development` or `production` |

### Frontend (`zyra-landing/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |

## License

MIT
