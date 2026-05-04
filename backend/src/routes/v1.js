const express = require('express')
const router = express.Router()
const { chatCompletions, completions, embeddings, anthropicMessages } = require('../controllers/unifiedProxyController')
const { universalLog } = require('../controllers/universalLogController')
const { authenticateApiKey } = require('../middleware/auth')

// All /v1 routes require a Zyra API key
router.use(authenticateApiKey)

// ── OpenAI-compatible proxy endpoints ──
router.post('/chat/completions', chatCompletions)
router.post('/completions', completions)
router.post('/embeddings', embeddings)

// ── Anthropic-native proxy endpoint ──
// Users can point their Anthropic client at Zyra by setting base_url to https://zyra.dev/v1
// Zyra accepts the Anthropic format, logs it, and forwards to Anthropic transparently.
router.post('/messages', anthropicMessages)

// ── Universal log ingest endpoint ──
// Used by Python SDK, Go/Ruby/Java/PHP middleware, and any external integration.
// Always returns 202 immediately — never blocks the caller.
// ZYRA_DISABLE=true env var short-circuits all logging.
router.post('/log', universalLog)

module.exports = router
