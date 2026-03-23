const axios = require('axios')
const InteractionLog = require('../models/InteractionLog')
const Organization = require('../models/Organization')
const { decrypt } = require('../utils/crypto')
const { calculateCost } = require('../utils/costCalculator')
const { getRiskQueue, getLogQueue } = require('../config/queue')

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
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai',
    authHeader: 'Authorization'
  }
}

const extractPrompt = (provider, body) => {
  try {
    if (provider === 'openai' || provider === 'anthropic' || provider === 'groq') {
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
    if (provider === 'openai' || provider === 'groq') {
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
    if (provider === 'openai' || provider === 'groq') {
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

  const urlParts = req.path.split('/').filter(Boolean)
  const provider = urlParts[0]
  const upstreamPath = '/' + urlParts.slice(1).join('/')

  console.log('provider:', provider)
  console.log('upstreamPath:', upstreamPath)

  const providerConfig = PROVIDERS[provider]
  if (!providerConfig) {
    return res.status(400).json({ message: `Unsupported provider: ${provider}. Supported: openai, anthropic, gemini, groq` })
  }

  const org = req.org

  if (org.currentMonthLogs >= org.monthlyLogLimit) {
    return res.status(429).json({ message: 'Monthly log limit reached. Please upgrade your plan.' })
  }

  const upstreamUrl = `${providerConfig.baseUrl}${upstreamPath}`
  console.log('upstreamUrl:', upstreamUrl)

  let providerApiKey = req.headers[providerConfig.authHeader.toLowerCase()] ||
                         req.headers['authorization'] ||
                         req.headers['x-api-key']

  if (!providerApiKey) {
    const encryptedKey = org.providerKeys?.[provider]
    if (encryptedKey) {
      const decrypted = decrypt(encryptedKey)
      providerApiKey = providerConfig.authHeader === 'Authorization' && !decrypted.startsWith('Bearer ')
        ? `Bearer ${decrypted}`
        : decrypted
    }
  }

  if (!providerApiKey) {
    return res.status(400).json({
      message: `Missing provider API key. Configure your ${provider} key in Organization Settings or pass it in headers.`
    })
  }

  const requestBody = req.body
  const model = requestBody.model || 'unknown'
  const userId = req.headers['x-user-id'] || requestBody.user || 'anonymous'

  let responseBody
  let statusCode

  try {
    const upstreamResponse = await axios({
      method: req.method,
      url: upstreamUrl,
      headers: {
        'Content-Type': 'application/json',
        [providerConfig.authHeader]: providerApiKey,
        ...(provider === 'anthropic' && {
          'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
        })
      },
      data: requestBody
    })

    statusCode = upstreamResponse.status
    responseBody = upstreamResponse.data

    res.status(statusCode).json(responseBody)

  } catch (err) {
    console.error('[Proxy] Upstream error:', err.message)
    statusCode = err.response?.status || 502
    responseBody = err.response?.data || { message: 'Failed to reach upstream provider' }
    return res.status(statusCode).json(responseBody)
  }

  try {
    const latency = Date.now() - start
    const prompt = extractPrompt(provider, requestBody)
    const response = extractResponse(provider, responseBody)
    const tokens = extractTokens(provider, responseBody)
    const cost = calculateCost(model, tokens.prompt, tokens.completion)

    const logQueue = getLogQueue()
    await logQueue.add('log-interaction', {
      orgId: org._id.toString(),
      userId,
      model,
      prompt,
      response,
      tokens,
      cost,
      latency
    })

  } catch (err) {
    console.error('[Proxy] Logging error:', err.message)
  }
}