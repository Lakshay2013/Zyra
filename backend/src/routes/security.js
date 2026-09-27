const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getOverview, getReports, getReportDetail,
  getNotifications, markNotificationRead,
} = require('../controllers/securityController')

router.use(protect)

router.get('/overview', getOverview)
router.get('/reports', getReports)
router.get('/reports/:id', getReportDetail)
router.get('/notifications', getNotifications)
router.post('/notifications/:id/read', markNotificationRead)

module.exports = router
