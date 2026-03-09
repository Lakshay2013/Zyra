const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const InteractionLog = require('../models/InteractionLog')
const Organization = require('../models/Organization')
const { calculateCost } = require('../utils/costCalculator')
const { getRiskQueue } = require('../config/queue')

const PROVIDERS = {
  openai: {
    baseUrl: 'https://api.openai.com',
    authHeader: 'Authorization'
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    authHeader: 'x-api-key'
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    authHeader: 'Authorization'
  }
}

const extractPrompt = (provider, body) => {
  try {
    if (provider === 'openai' || provider === 'anthropic') {
      const messages = body.messages || []
      return messages
        .map(m => `[${m.role}]: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
        .join('\n')
    }
    if (provider === 'gemini') {
      return body.contents?.map(c => c.parts?.map(p => p.text).join('')).join('\n') || ''
    }
    return JSON.stringify(body)
  } catch (e) {
    return ''
  }
}

const extractResponse = (provider, responseBody) => {
  try {
    if (provider === 'openai') {
      return responseBody.choices?.[0]?.message?.content || ''
    }
    if (provider === 'anthropic') {
      return responseBody.content?.[0]?.text || ''
    }
    if (provider === 'gemini') {
      return responseBody.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }
    return ''
  } catch (e) {
    return ''
  }
}

const extractTokens = (provider, responseBody) => {
  try {
    if (provider === 'openai') {
      return {
        prompt: responseBody.usage?.prompt_tokens || 0,
        completion: responseBody.usage?.completion_tokens || 0,
        total: responseBody.usage?.total_tokens || 0
      }
    }
    if (provider === 'anthropic') {
      return {
        prompt: responseBody.usage?.input_tokens || 0,
        completion: responseBody.usage?.output_tokens || 0,
        total: (responseBody.usage?.input_tokens || 0) + (responseBody.usage?.output_tokens || 0)
      }
    }
    return { prompt: 0, completion: 0, total: 0 }
  } catch (e) {
    return { prompt: 0, completion: 0, total: 0 }
  }
}

exports.proxy = async (req, res) => {
  const start = Date.now()

  // Extract provider and upstream path from URL
  const urlParts = req.path.split('/').filter(Boolean)
  const provider = urlParts[0]
  const upstreamPath = '/' + urlParts.slice(1).join('/')

  const providerConfig = PROVIDERS[provider]
  if (!providerConfig) {
    return res.status(400).json({ message: `Unsupported provider: ${provider}. Supported: openai, anthropic, gemini` })
  }

  const org = req.org

  if (org.currentMonthLogs >= org.monthlyLogLimit) {
    return res.status(429).json({ message: 'Monthly log limit reached. Please upgrade your plan.' })
  }

  const upstreamUrl = `${providerConfig.baseUrl}${upstreamPath}`

  const providerApiKey = req.headers[providerConfig.authHeader.toLowerCase()] ||
                         req.headers['authorization'] ||
                         req.headers['x-api-key']

  if (!providerApiKey) {
    return res.status(400).json({
      message: `Missing provider API key. Pass your ${provider} API key in the ${providerConfig.authHeader} header.`
    })
  }

  const requestBody = req.body
  const model = requestBody.model || 'unknown'
  const userId = req.headers['x-user-id'] || requestBody.user || 'anonymous'

  let responseBody
  let statusCode

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        [providerConfig.authHeader]: providerApiKey,
        ...(provider === 'anthropic' && {
          'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
        })
      },
      body: JSON.stringify(requestBody)
    })

    statusCode = upstreamResponse.status
    responseBody = await upstreamResponse.json()

    res.status(statusCode).json(responseBody)

  } catch (err) {
    console.error('[Proxy] Upstream error:', err.message)
    return res.status(502).json({ message: 'Failed to reach upstream provider', error: err.message })
  }

  // Log after responding — don't block the customer
  try {
    const latency = Date.now() - start
    const prompt = extractPrompt(provider, requestBody)
    const response = extractResponse(provider, responseBody)
    const tokens = extractTokens(provider, responseBody)
    const cost = calculateCost(model, tokens.prompt, tokens.completion)

    const log = await InteractionLog.create({
      orgId: org._id,
      userId,
      model,
      prompt,
      response,
      tokens,
      cost,
      latency
    })

    await Organization.findByIdAndUpdate(org._id, {
      $inc: { currentMonthLogs: 1 }
    })

    const riskQueue = getRiskQueue()
    await riskQueue.add('analyze', { logId: log._id.toString() })

  } catch (err) {
    console.error('[Proxy] Logging error:', err.message)
  }
}