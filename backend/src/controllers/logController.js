const InteractionLog = require('../models/InteractionLog')
const Organization = require('../models/Organization')
const { calculateCost } = require('../utils/costCalculator')
const { getRiskQueue } = require('../config/queue')

exports.ingest = async (req, res) => {
  try {
    const { userId, model, prompt, response, tokens, latency } = req.body

    // Basic validation
    if (!userId || !model || !prompt) {
      return res.status(400).json({ message: 'userId, model, and prompt are required' })
    }

    // Check org log limit
    const org = req.org
    if (org.currentMonthLogs >= org.monthlyLogLimit) {
      return res.status(429).json({ message: 'Monthly log limit reached. Please upgrade your plan.' })
    }

    // Calculate tokens and cost
    const promptTokens = tokens?.prompt || tokens || 0
    const completionTokens = tokens?.completion || 0
    const totalTokens = tokens?.total || promptTokens + completionTokens
    const cost = calculateCost(model, promptTokens, completionTokens)

    // Save log
    const log = await InteractionLog.create({
      orgId: org._id,
      userId,
      model,
      prompt,
      response: response || '',
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens
      },
      cost,
      latency: latency || 0
    })

    // Increment org log count
    await Organization.findByIdAndUpdate(org._id, {
      $inc: { currentMonthLogs: 1 }
    })

    // Queue risk analysis
    const riskQueue = getRiskQueue()
    await riskQueue.add('analyze', { logId: log._id.toString() })

    res.status(201).json({
      message: 'Log ingested successfully',
      logId: log._id
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, minRisk, maxRisk, model, flags, startDate, endDate } = req.query

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
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}