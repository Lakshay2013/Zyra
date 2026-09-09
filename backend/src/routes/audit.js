const express = require('express')
const router = express.Router()
const { protect, restrictTo } = require('../middleware/auth')
const { getAuditLogs } = require('../controllers/auditController')

router.use(protect)
// Audit trail is an admin surface.
router.get('/', restrictTo('admin'), getAuditLogs)

module.exports = router
