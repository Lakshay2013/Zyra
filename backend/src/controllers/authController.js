const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Organization = require('../models/Organization')

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

    // Create admin user
    const user = await User.create({
      orgId: org._id,
      name,
      email,
      passwordHash: password,
      role: 'admin'
    })

    const token = signToken(user._id, org._id, user.role)

    res.status(201).json({
      message: 'Account created successfully',
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

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' })
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