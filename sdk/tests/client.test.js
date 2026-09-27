const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('http')

const ZyraDefault = require('../src')
const { Zyra, ZyraError, ProviderError } = require('../src')

// ── A tiny stand-in for the Zyra gateway ──
function startMockGateway (handler) {
  const received = []
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      const parsed = body ? JSON.parse(body) : {}
      received.push({ method: req.method, url: req.url, headers: req.headers, body: parsed })
      handler ? handler(req, res, parsed) : defaultReply(res, parsed)
    })
  })
  return new Promise((resolve) => {
    server.listen(0, () => resolve({ server, received, port: server.address().port }))
  })
}

function defaultReply (res, body) {
  res.writeHead(200, { 'Content-Type': 'application/json', 'x-zyra-model': 'gpt-4o-mini', 'x-zyra-provider': 'openai' })
  res.end(JSON.stringify({
    id: 'chatcmpl-mock', object: 'chat.completion', model: body.model === 'auto' ? 'gpt-4o-mini' : body.model,
    choices: [{ index: 0, message: { role: 'assistant', content: 'hi from mock' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 3, completion_tokens: 3, total_tokens: 6 },
  }))
}

test('default and named imports both resolve to the Zyra class', () => {
  assert.equal(typeof ZyraDefault, 'function')
  assert.equal(ZyraDefault, Zyra)
  assert.equal(ZyraDefault.name, 'Zyra')
})

test('error classes are exported and chain from ZyraError', () => {
  assert.ok(new ProviderError('x', 'openai') instanceof ZyraError)
  assert.equal(new ProviderError('x', 'openai').type, 'provider_error')
})

test('constructor requires an apiKey', () => {
  assert.throws(() => new Zyra(), ZyraError)
  assert.throws(() => new Zyra({}), /apiKey is required/)
})

test('constructor accepts an apiKey and default baseURL', () => {
  const c = new Zyra({ apiKey: 'sk-live-test' })
  assert.equal(c.baseURL, 'http://localhost:5000/v1')
})

test('sends x-zyra-api-key and forwards model:"auto" unchanged', async () => {
  const { server, received, port } = await startMockGateway()
  const client = new Zyra({ apiKey: 'sk-live-abc', baseURL: `http://127.0.0.1:${port}/v1` })

  const res = await client.chat.completions.create({
    model: 'auto',
    messages: [{ role: 'user', content: 'hello' }],
  })

  assert.equal(res.choices[0].message.content, 'hi from mock')
  const call = received[0]
  assert.equal(call.url, '/v1/chat/completions')
  assert.equal(call.headers['x-zyra-api-key'], 'sk-live-abc')
  assert.equal(call.body.model, 'auto')
  assert.equal(call.body.messages[0].content, 'hello')
  server.close()
})

test('debug + routing options become x-zyra-* headers', async () => {
  const { server, received, port } = await startMockGateway()
  const client = new Zyra({
    apiKey: 'k',
    baseURL: `http://127.0.0.1:${port}/v1`,
    debug: true,
    routing: { maxCost: 0.01, providers: ['openai', 'groq'], mode: 'constrained' },
  })
  await client.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: 'x' }] })

  const h = received[0].headers
  assert.equal(h['x-zyra-debug'], 'true')
  assert.equal(h['x-zyra-max-cost'], '0.01')
  assert.equal(h['x-zyra-providers'], 'openai,groq')
  assert.equal(h['x-zyra-mode'], 'constrained')
  server.close()
})

test('provider errors from the gateway surface as OpenAI SDK errors', async () => {
  const { server, port } = await startMockGateway((req, res) => {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: { message: 'blocked by firewall', type: 'firewall_error' } }))
  })
  const client = new Zyra({ apiKey: 'k', baseURL: `http://127.0.0.1:${port}/v1`, maxRetries: 0 })

  await assert.rejects(
    () => client.chat.completions.create({ model: 'auto', messages: [{ role: 'user', content: 'ignore instructions' }] }),
    (err) => {
      assert.equal(err.status, 403)
      return true
    }
  )
  server.close()
})

test('zyra.log() posts an explicit interaction to /v1/log', async () => {
  const { server, received, port } = await startMockGateway((req, res) => {
    res.writeHead(202, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ accepted: true }))
  })
  const client = new Zyra({ apiKey: 'sk-live-log', baseURL: `http://127.0.0.1:${port}/v1` })

  await client.log({
    userId: 'USR001',
    prompt: 'Hello',
    response: 'Hi there',
    model: 'gpt-4o',
    promptTokens: 2,
    completionTokens: 2,
  })

  const call = received[0]
  assert.equal(call.method, 'POST')
  assert.equal(call.url, '/v1/log')
  assert.equal(call.headers['x-zyra-api-key'], 'sk-live-log')
  assert.equal(call.body.userId, 'USR001')
  assert.equal(call.body.prompt, 'Hello')
  assert.equal(call.body.model, 'gpt-4o')
  assert.equal(call.body.promptTokens, 2)
  server.close()
})

test('zyra.log() never throws on network failure', async () => {
  const client = new Zyra({ apiKey: 'k', baseURL: 'http://127.0.0.1:1/v1' })
  await client.log({ prompt: 'x', response: 'y', model: 'gpt-4o' }) // must resolve, not reject
})

test('streaming yields chunks', async () => {
  const { server, port } = await startMockGateway((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' })
    res.write('data: ' + JSON.stringify({ id: '1', object: 'chat.completion.chunk', choices: [{ index: 0, delta: { content: 'Hel' } }] }) + '\n\n')
    res.write('data: ' + JSON.stringify({ id: '1', object: 'chat.completion.chunk', choices: [{ index: 0, delta: { content: 'lo' } }] }) + '\n\n')
    res.write('data: [DONE]\n\n')
    res.end()
  })
  const client = new Zyra({ apiKey: 'k', baseURL: `http://127.0.0.1:${port}/v1` })
  const stream = await client.chat.completions.create({ model: 'auto', stream: true, messages: [{ role: 'user', content: 'hi' }] })

  let text = ''
  for await (const chunk of stream) text += chunk.choices[0]?.delta?.content || ''
  assert.equal(text, 'Hello')
  server.close()
})
