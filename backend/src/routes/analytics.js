const express = require('express')
const router = express.Router()
const {
  getOverview, getUsage, getTopUsers, getHighRisk,
  getSavings, getCostBreakdown, getValueReport, getCostComparison
} = require('../controllers/analyticsController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/overview', getOverview)
router.get('/usage', getUsage)
router.get('/top-users', getTopUsers)
router.get('/high-risk', getHighRisk)
router.get('/savings', getSavings)
router.get('/cost-breakdown', getCostBreakdown)
router.get('/cost-comparison', getCostComparison)
router.get('/value-report', getValueReport)

module.exports = router