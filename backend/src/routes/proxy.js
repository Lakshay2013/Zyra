/**
 * DEPRECATED — Legacy provider-prefixed proxy route.
 * Use the OpenAI-compatible /v1/* endpoints instead (routes/v1.js).
 * Kept for backwards compatibility only.
 */
const express = require('express')
const router = express.Router()
const { proxy } = require('../controllers/proxyController')
const { authenticateApiKey } = require('../middleware/auth')

router.use(authenticateApiKey, proxy)

module.exports = router