const express = require('express')
const router = express.Router()
const { proxy } = require('../controllers/proxyController')
const { authenticateApiKey } = require('../middleware/auth')

// Matches /proxy/openai/v1/chat/completions
// Matches /proxy/anthropic/v1/messages
// Matches /proxy/gemini/...
router.all('/:provider/*', authenticateApiKey, proxy)

module.exports = router