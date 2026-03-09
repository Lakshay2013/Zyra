const express = require('express')
const router = express.Router()
const { proxy } = require('../controllers/proxyController')
const { authenticateApiKey } = require('../middleware/auth')

router.use(authenticateApiKey, proxy)

module.exports = router