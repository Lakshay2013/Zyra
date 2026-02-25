const express = require('express')
const router = express.Router()
const { createKey, listKeys, revokeKey } = require('../controllers/apiKeyController')
const { protect, restrictTo } = require('../middleware/auth')

// All routes require JWT login + admin or developer role
router.use(protect)

router.post('/', restrictTo('admin'), createKey)
router.get('/', listKeys)
router.delete('/:id', restrictTo('admin'), revokeKey)

module.exports = router