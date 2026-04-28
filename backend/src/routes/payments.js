const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const paymentController = require('../controllers/paymentController')

// Public: plans info
router.get('/plans', paymentController.getPlans)

// Public: webhook (Razorpay sends POST with raw JSON)
router.post('/webhook', express.json({ limit: '1mb' }), paymentController.webhook)

// Protected: requires login
router.post('/create-order', protect, paymentController.createOrder)
router.post('/verify', protect, paymentController.verifyPayment)
router.get('/history', protect, paymentController.getHistory)

module.exports = router
