const jwt = require('jsonwebtoken')

exports.protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const ApiKey = require('../models/ApiKey')
const Organization = require('../models/Organization')
const crypto = require('crypto')

exports.authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key']

    if (!apiKey) {
      return res.status(401).json({ message: 'API key required' })
    }

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

    const key = await ApiKey.findOne({ keyHash, isActive: true })

    if (!key) {
      return res.status(401).json({ message: 'Invalid or revoked API key' })
    }

    // Attach org info to request
    const org = await Organization.findById(key.orgId)
    req.org = org
    req.apiKey = key

    // Update last used timestamp in background
    ApiKey.findByIdAndUpdate(key._id, { lastUsedAt: new Date() }).exec()

    next()
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this' })
    }
    next()
  }
}