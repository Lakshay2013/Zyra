const express = require('express')
const router = express.Router()
const { ingest, getLogs } = require('../controllers/logController')
const { authenticateApiKey } = require('../middleware/auth')
const { protect } = require('../middleware/auth')

// SDK uses API key to ingest
router.post('/ingest', authenticateApiKey, ingest)

// Dashboard uses JWT to read logs
router.get('/', protect, getLogs)

module.exports = router