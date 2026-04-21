const Organization = require('../models/Organization')
const User = require('../models/User')
const { encrypt } = require('../utils/crypto')

// GET /api/org/settings — get org profile for configuration page
exports.getSettings = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId)
    const user = await User.findById(req.user.userId)
    res.json({
      _id: org._id,
      name: org.name,
      slug: org.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      email: user?.email || '',
      bio: org.bio || '',
      plan: org.plan || 'free',
    })
  } catch (err) {
    console.error('getSettings error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/org/settings — update org profile
exports.updateSettings = async (req, res) => {
  try {
    const { displayName, email, bio } = req.body
    const update = {}
    if (typeof displayName === 'string' && displayName.trim().length > 0 && displayName.trim().length <= 100) {
      update.name = displayName.trim()
    }
    if (typeof bio === 'string' && bio.length <= 500) {
      update.bio = bio.trim()
    }
    
    const org = await Organization.findByIdAndUpdate(
      req.user.orgId,
      { $set: update },
      { new: true }
    )

    // Update user email if provided
    if (typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await User.findByIdAndUpdate(req.user.userId, { email: email.trim() })
    }

    res.json({ message: 'Settings updated successfully', org })
  } catch (err) {
    console.error('updateSettings error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.getProviders = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId)
    const configured = {
      openai: !!org.providerKeys?.openai,
      anthropic: !!org.providerKeys?.anthropic,
      gemini: !!org.providerKeys?.gemini,
      groq: !!org.providerKeys?.groq,
    }
    res.json({ configured })
  } catch (err) {
    console.error('getProviders error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.updateProviders = async (req, res) => {
  try {
    const { openai, anthropic, gemini, groq } = req.body
    const org = await Organization.findById(req.user.orgId)

    if (!org.providerKeys) org.providerKeys = {}

    if (openai !== undefined) org.providerKeys.openai = openai ? encrypt(openai) : null
    if (anthropic !== undefined) org.providerKeys.anthropic = anthropic ? encrypt(anthropic) : null
    if (gemini !== undefined) org.providerKeys.gemini = gemini ? encrypt(gemini) : null
    if (groq !== undefined) org.providerKeys.groq = groq ? encrypt(groq) : null

    await org.save()
    res.json({ message: 'Providers updated successfully' })
  } catch (err) {
    console.error('updateProviders error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.getPolicies = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select('policies')
    res.json({ policies: org.policies })
  } catch (err) {
    console.error('getPolicies error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.updatePolicies = async (req, res) => {
  try {
    // Whitelist allowed policy fields
    const allowed = {}
    if (typeof req.body.blockPII === 'boolean') allowed['policies.blockPII'] = req.body.blockPII
    if (typeof req.body.blockInjection === 'boolean') allowed['policies.blockInjection'] = req.body.blockInjection
    if (typeof req.body.maxTokensPerRequest === 'number' && req.body.maxTokensPerRequest > 0) {
      allowed['policies.maxTokensPerRequest'] = Math.min(req.body.maxTokensPerRequest, 32000)
    }

    const org = await Organization.findByIdAndUpdate(
      req.user.orgId,
      { $set: allowed },
      { new: true }
    )
    res.json({ policies: org.policies })
  } catch (err) {
    console.error('updatePolicies error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.getBilling = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select('plan monthlyLogLimit currentMonthlyLogs')
    res.json({ billing: org })
  } catch (err) {
    console.error('getBilling error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.getMembers = async (req, res) => {
  try {
    const users = await User.find({ orgId: req.user.orgId }).select('name email role isActive createdAt')
    res.json({ members: users })
  } catch (err) {
    console.error('getMembers error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/org/optimizer — get cost optimizer settings
exports.getOptimizer = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select('optimizer')
    res.json({ optimizer: org.optimizer || { autoOptimize: false, qualityTier: 'standard', costAlertThreshold: 100 } })
  } catch (err) {
    console.error('getOptimizer error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/org/optimizer — update cost optimizer settings
exports.updateOptimizer = async (req, res) => {
  try {
    const { autoOptimize, qualityTier, costAlertThreshold } = req.body
    const update = {}
    if (autoOptimize !== undefined) update['optimizer.autoOptimize'] = autoOptimize
    if (qualityTier !== undefined) update['optimizer.qualityTier'] = qualityTier
    if (costAlertThreshold !== undefined) update['optimizer.costAlertThreshold'] = costAlertThreshold

    const org = await Organization.findByIdAndUpdate(
      req.user.orgId,
      { $set: update },
      { new: true }
    )
    res.json({ optimizer: org.optimizer })
  } catch (err) {
    console.error('updateOptimizer error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/org/reliability — get retry + fallback settings
exports.getReliability = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select('reliability')
    res.json({ reliability: org.reliability || { enableRetry: true, maxRetries: 2, fallbackOrder: [] } })
  } catch (err) {
    console.error('getReliability error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/org/reliability — update retry + fallback settings
exports.updateReliability = async (req, res) => {
  try {
    const { enableRetry, maxRetries, fallbackOrder } = req.body
    const update = {}
    if (enableRetry !== undefined) update['reliability.enableRetry'] = enableRetry
    if (maxRetries !== undefined) update['reliability.maxRetries'] = Math.min(Math.max(maxRetries, 0), 5)
    if (fallbackOrder !== undefined) update['reliability.fallbackOrder'] = fallbackOrder

    const org = await Organization.findByIdAndUpdate(
      req.user.orgId,
      { $set: update },
      { new: true }
    )
    res.json({ reliability: org.reliability })
  } catch (err) {
    console.error('updateReliability error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

