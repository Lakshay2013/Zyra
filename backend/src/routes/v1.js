const express = require('express')
const router = express.Router()
const { chatCompletions, completions, embeddings } = require('../controllers/unifiedProxyController')
const { authenticateApiKey } = require('../middleware/auth')

// All /v1 routes require a Zyra API key
router.use(authenticateApiKey)

// OpenAI-compatible endpoints
router.post('/chat/completions', chatCompletions)
router.post('/completions', completions)
router.post('/embeddings', embeddings)

module.exports = router
