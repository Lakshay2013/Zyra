const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')
const Organization = require('../models/Organization')
const { sendOtpEmail } = require('../utils/mailer')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

const signToken = (userId, orgId, role) => {
  return jwt.sign(
    { userId, orgId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, orgName } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    // Create org first
    const org = await Organization.create({ name: orgName })
    
    const otpCode = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

    // Create admin user
    const user = await User.create({
      orgId: org._id,
      name,
      email,
      passwordHash: password,
      role: 'admin',
      isEmailVerified: false,
      otpCode,
      otpExpires
    })

    await sendOtpEmail(email, otpCode)

    res.status(201).json({
      message: 'Account created. OTP sent to email.',
      requiresOtp: true,
      email: user.email
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Find user
    const user = await User.findOne({ email }).select('+passwordHash')
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Email not verified. Please verify your email first.', requiresOtp: true })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Get org
    const org = await Organization.findById(user.orgId)

    const token = signToken(user._id, user.orgId, user.role)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      org: {
        id: org._id,
        name: org.name,
        plan: org.plan
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    const org = await Organization.findById(req.user.orgId)

    res.json({ user, org })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' })

    const user = await User.findOne({ email }).select('+otpCode +otpExpires')
    
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' })
    
    if (user.otpCode !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    user.isEmailVerified = true
    user.otpCode = undefined
    user.otpExpires = undefined
    await user.save()

    const org = await Organization.findById(user.orgId)
    const token = signToken(user._id, org._id, user.role)

    res.json({
      message: 'Email verified successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      org: { id: org._id, name: org.name, plan: org.plan }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// POST /api/auth/google
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ message: 'Missing Google ID Token' })

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    
    const payload = ticket.getPayload()
    const { email, name, sub: googleId } = payload

    let user = await User.findOne({ email })
    let org

    if (!user) {
      // Create new user and org
      org = await Organization.create({ name: `${name}'s Organization` })
      user = await User.create({
        orgId: org._id,
        name,
        email,
        googleId,
        role: 'admin',
        isEmailVerified: true
      })
    } else {
      // Connect Google ID if not present
      if (!user.googleId) {
        user.googleId = googleId
        user.isEmailVerified = true
        await user.save()
      }
      org = await Organization.findById(user.orgId)
    }

    const token = signToken(user._id, org._id, user.role)

    res.json({
      message: 'Google login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      org: { id: org._id, name: org.name, plan: org.plan }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Google authentication failed', error: err.message })
  }
}