# Zyra 🛡️

**The Enterprise AI API Gateway & Firewall.**

Zyra is a high-performance B2B SaaS platform that sits between your applications and LLM providers (OpenAI, Anthropic, Gemini, Groq). It provides essential observability, cost controls, and security firewalls—ensuring your developers don't accidentally leak PII or rack up massive API bills.

![Zyra Dashboard Banner](https://via.placeholder.com/1000x500.png?text=Zyra+Dashboard) *(Replace with actual screenshot)*

## ✨ Key Features

- **Bring Your Own Key (BYOK)**: Organizations securely encrypt and store their own provider API keys. No more hardcoding keys in client applications.
- **Prompt Injection Blocking**: Actively scans and blocks adversarial user prompts (like "Ignore previous instructions") before they reach the LLM.
- **Data Loss Prevention (PII)**: Asynchronously detects and redacts Personally Identifiable Information leaking to third-party AI providers.
- **Global Rate Limiting & Budgets**: Redis-backed limits ensure no single organization or API Key can exhaust your token budget. Hard limits on `max_tokens` per request.
- **Cost & Usage Analytics**: Live dashboard tracking exactly how many tokens your team is burning across all models/providers.
- **High-Performance Architecture**: Synchronous proxying for low latency, combined with **BullMQ background workers** to handle heavy database logging without blocking the HTTP response.

---

## 🛠️ Tech Stack

**Frontend (Client Dashboard)**
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Framer Motion for premium animations
- **Icons**: Lucide React

**Backend (API & Proxy)**
- **Framework**: Node.js & Express.js
- **Database**: MongoDB (Mongoose) for Organizations, Users, and Logs
- **Caching & Queues**: Redis & BullMQ for Rate Limiting and asynchronous logging workers
- **Security**: Crypto (AES-256 for API keys), Helmet, Express-Rate-Limit

---

## 🚀 Getting Started (Local Development)

Zyra is split into a Next.js `zyra-landing` frontend and a Node.js `backend`.

### Prerequisites
Make sure you have installed:
- Node.js (v18+)
- MongoDB (Running locally or via Atlas)
- Redis (Running locally, required for BullMQ and Rate Limiting)

### 1. Setup the Backend
Navigate to the backend folder and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/zyra
JWT_SECRET=your_super_secret_jwt_key
ENCRYPTION_KEY=your_64_character_hex_encryption_key
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
```

Start the backend services (You need two terminal tabs):
```bash
# Terminal 1: Start the API Server
npm run dev

# Terminal 2: Start the BullMQ Background Workers (Logging & Risk Analysis)
npm run worker
```

### 2. Setup the Frontend
Navigate to the frontend folder and install dependencies:
```bash
cd zyra-landing
npm install
```

Create a `.env.local` file in the `zyra-landing` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the development server:
```bash
npm run dev
```

### 3. Test the Application
1. Open `http://localhost:3000` and register a new account.
2. Go to the **Dashboard ➔ Providers** and add your actual OpenAI API Key.
3. Go to **Dashboard ➔ API Keys** and generate a Zyra Project Key (`sk-live-...`).
4. Send a proxy request:
```bash
curl -X POST http://localhost:5000/proxy/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-zyra-api-key: sk-live-YOUR_ZYRA_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello Zyra!"}]
  }'
```
5. Check your dashboard **Logs** to see the cost and risk analysis!

---

## 🔒 Security Posture
- All endpoint traffic goes through `express-rate-limit`.
- Passwords are hashed via `bcryptjs`.
- Upstream Provider API Keys (OpenAI etc.) are symmetrically encrypted (`aes-256-cbc`) using `crypto` before being saved to MongoDB. 
- **DO NOT lose your `ENCRYPTION_KEY` environment variable**, or all saved provider keys will become unreadable.

## 📄 License
MIT License.
