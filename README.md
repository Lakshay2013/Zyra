# Zyra | AI Proxy & Security Mesh

Zyra is an enterprise-grade AI Proxy and Security Mesh designed for B2B SaaS architecture. It acts as an intelligent intermediary layer between your client applications (Web, Mobile) and downstream Large Language Model (LLM) providers like OpenAI, Anthropic, and open-source models (Llama-3).

## 🎯 What Problem Does Zyra Solve?
As organizations integrate LLMs into production applications, they face critical challenges:
1. **Security & Data Privacy**: Sending raw user prompts directly to third-party LLMs risks exposing Personally Identifiable Information (PII) or executing malicious Prompt Injections.
2. **Reliability & Uptime**: Relying on a single AI provider causes application outages if that API goes down or hits rate limits.
3. **Cost & Observability**: Tracking token usage and precise costs across disparate teams and multiple LLM providers is incredibly difficult without a centralized hub.

## 🚀 Key Features

### 1. Intelligent Routing & Fallbacks
Zyra automatically load-balances and routes requests based on real-time telemetry. If a primary provider (e.g., `OPENAI_GPT4`) experiences a P99 latency spike or hits a rate limit, the mesh seamlessly falls back to a secondary provider (e.g., `CLAUDE_3_OPUS` or `LLAMA_INST_3`) without dropping the client request.

### 2. Live Intercept & Threat Observer
Every request passing through Zyra is evaluated in real-time. The system calculates a dynamic **Risk Score** and actively blocks:
- **Prompt Injections & Jailbreaks**
- **SQL / Code Injections** (e.g., anomalous payloads encoded in user prompts)
- **PII Leakage** (Automatically redacting Credit Cards, SSNs, and other sensitive entities before the payload leaves your infrastructure).

### 3. Comprehensive Analytics & Cost Tracking
Zyra logs every transaction, providing a real-time "Observer" dashboard built specifically for engineering and security teams. It tracks:
- Total throughput (Tokens Processed)
- Cost aggregation across providers
- Threats intercepted (Flagged Count)
- Interactive network visualizations of traffic distribution.

---

## 🏗️ Technical Stack

- **Frontend (`/zyra-landing`)**:
  - Framework: Next.js 16 (App Router)
  - Styling: Tailwind CSS v4 featuring a premium, dark-mode "Technical Editorial" aesthetic.
  - Animations: Framer Motion for scroll-linked telemetry reveals and network maps.
  - Auth: Google OAuth (FedCM) and JWT-based local authentication.
- **Backend (`/backend`)**:
  - Core: Node.js with Express
  - Database: MongoDB (User, Organization, Log, and Analytics schemas)
  - Caching & Rate Limiting: Redis integration.
  - Security: Helmet, xss-clean, express-mongo-sanitize.

## ⚙️ Getting Started

**Backend Installation**:
```bash
cd backend
npm install
npm run dev
# Server running on localhost:5000
```

**Frontend Installation**:
```bash
cd zyra-landing
npm install
npm run dev
# Dashboard available at localhost:3000
```
