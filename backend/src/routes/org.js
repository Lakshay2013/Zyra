const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const orgController = require('../controllers/orgController')

// All organization API routes are protected
router.use(protect)

router.get('/providers', orgController.getProviders)
router.put('/providers', orgController.updateProviders)

router.get('/policies', orgController.getPolicies)
router.put('/policies', orgController.updatePolicies)

router.get('/billing', orgController.getBilling)

router.get('/members', orgController.getMembers)

module.exports = router
