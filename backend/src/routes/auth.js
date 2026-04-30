const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { protect } = require('../middleware/auth')

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/verify-otp', authController.verifyOtp)
router.post('/google', authController.googleLogin)

router.get('/me', protect, authController.getMe)
router.put('/change-password', protect, authController.changePassword)

module.exports = router