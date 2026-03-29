const Organization = require('../models/Organization')
const User = require('../models/User')
const { encrypt } = require('../utils/crypto')

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
    res.status(500).json({ error: err.message }) 
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
    res.status(500).json({ error: err.message }) 
  }
}

exports.getPolicies = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select('policies')
    res.json({ policies: org.policies })
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
}

exports.updatePolicies = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.user.orgId,
      { $set: { policies: req.body } },
      { new: true }
    )
    res.json({ policies: org.policies })
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
}

exports.getBilling = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select('plan monthlyLogLimit currentMonthlyLogs')
    res.json({ billing: org })
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
}

exports.getMembers = async (req, res) => {
  try {
    const users = await User.find({ orgId: req.user.orgId }).select('name email role isActive createdAt')
    res.json({ members: users })
  } catch (err) { 
    res.status(500).json({ error: err.message }) 
  }
}

// GET /api/org/optimizer — get cost optimizer settings
exports.getOptimizer = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select('optimizer')
    res.json({ optimizer: org.optimizer || { autoOptimize: false, qualityTier: 'standard', costAlertThreshold: 100 } })
  } catch (err) {
    res.status(500).json({ error: err.message })
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
    res.status(500).json({ error: err.message })
  }
}

// GET /api/org/reliability — get retry + fallback settings
exports.getReliability = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).select('reliability')
    res.json({ reliability: org.reliability || { enableRetry: true, maxRetries: 2, fallbackOrder: [] } })
  } catch (err) {
    res.status(500).json({ error: err.message })
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
    res.status(500).json({ error: err.message })
  }
}

