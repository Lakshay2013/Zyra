const InteractionLog = require('../models/InteractionLog')
const Organization = require('../models/Organization')
const { calculateCost, getProvider } = require('../utils/costCalculator')
const { getRiskQueue } = require('../config/queue')
const { reserveMonthlyLog } = require('../services/usageLimiter')
const { analyze } = require('../services/securityAnalyzer')

exports.ingest = async (req, res) => {
  try {
    const { userId, model, prompt, response, tokens, latency } = req.body

    // Basic validation
    if (!userId || !model || !prompt) {
      return res.status(400).json({ message: 'userId, model, and prompt are required' })
    }

    // Atomically reserve one unit of monthly usage
    const org = req.org
    const reservation = await reserveMonthlyLog(org._id.toString())
    if (!reservation.ok) {
      return res.status(429).json({ message: 'Monthly log limit reached. Please upgrade your plan.' })
    }

    // Calculate tokens and cost
    const promptTokens = tokens?.prompt || tokens || 0
    const completionTokens = tokens?.completion || 0
    const totalTokens = tokens?.total || promptTokens + completionTokens
    const cost = calculateCost(model, promptTokens, completionTokens)

    const sensitiveKeywords = org.policies?.sensitiveKeywords || []
    const sec = analyze({ prompt, response: response || '', userId, orgId: org._id, sensitiveKeywords })

    // Save log — masked text only (paper: mask before storage)
    const log = await InteractionLog.create({
      orgId: org._id,
      userId,
      model,
      provider: getProvider(model) || 'unknown',
      prompt: sec.maskedPrompt,
      response: sec.maskedResponse,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      },
      cost,
      latency: latency || 0,
      analyzed: false,
      flags: sec.flags,
      riskDetails: {
        injectionScore: sec.components.injection,
        jailbreakScore: sec.components.jailbreak,
        piiScore: sec.components.pii,
        abuseScore: sec.components.abuse,
        sensitiveScore: sec.sensitive.score,
        piiTypes: sec.pii.types,
        injectionMatches: sec.injection.matches,
        jailbreakMatches: sec.jailbreak.matches,
        abuseIssues: sec.abuse.issues,
        sensitiveKeywords: sec.sensitive.matches,
      },
    })

    // Queue risk analysis
    const riskQueue = getRiskQueue()
    await riskQueue.add('analyze', { logId: log._id.toString() })

    res.status(201).json({
      message: 'Log ingested successfully',
      logId: log._id
    })
  } catch (err) {
    console.error('Log ingest error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit: rawLimit = 50, userId, minRisk, maxRisk, model, flags, startDate, endDate } = req.query
    const limit = Math.min(Number(rawLimit) || 50, 200) // Max 200 per page

    const filter = { orgId: req.user.orgId }

    if (userId) filter.userId = userId
    if (model) filter.model = model
    if (flags) filter.flags = { $in: flags.split(',') }
    if (minRisk || maxRisk) {
      filter.riskScore = {}
      if (minRisk) filter.riskScore.$gte = Number(minRisk)
      if (maxRisk) filter.riskScore.$lte = Number(maxRisk)
    }
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [logs, total] = await Promise.all([
      InteractionLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InteractionLog.countDocuments(filter)
    ])

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    console.error('getLogs error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}