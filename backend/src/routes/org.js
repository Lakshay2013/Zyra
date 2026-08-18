const express = require('express')
const router = express.Router()
const { protect, restrictTo } = require('../middleware/auth')
const orgController = require('../controllers/orgController')

// All organization API routes are protected
router.use(protect)

router.get('/settings', orgController.getSettings)
router.put('/settings', restrictTo('admin'), orgController.updateSettings)

router.get('/providers', orgController.getProviders)
router.put('/providers', restrictTo('admin'), orgController.updateProviders)

router.get('/policies', orgController.getPolicies)
router.put('/policies', restrictTo('admin'), orgController.updatePolicies)

router.get('/billing', orgController.getBilling)

router.get('/members', orgController.getMembers)

// Cost optimizer settings
router.get('/optimizer', orgController.getOptimizer)
router.put('/optimizer', restrictTo('admin'), orgController.updateOptimizer)

// Reliability settings (retry + fallback)
router.get('/reliability', orgController.getReliability)
router.put('/reliability', restrictTo('admin'), orgController.updateReliability)

module.exports = router
