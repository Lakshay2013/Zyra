const express = require('express')
const router = express.Router()
const { getOverview, getUsage, getTopUsers, getHighRisk } = require('../controllers/analyticsController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/overview', getOverview)
router.get('/usage', getUsage)
router.get('/top-users', getTopUsers)
router.get('/high-risk', getHighRisk)

module.exports = router