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
