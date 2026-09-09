const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('http')

test('dispatchLog never throws and is fire-and-forget', () => {
  const { dispatchLog } = require('../src/logger')
  assert.doesNotThrow(() => {
    dispatchLog({
      zyraKey: 'k', sdkLanguage: 'node', provider: 'openai',
      modelRequested: 'gpt-4o-mini', promptTokens: 1, completionTokens: 1, latencyMs: 5, status: 'success',
    })
  })
})

test('dispatchLog POSTs the canonical payload to /v1/log', async () => {
  const calls = []
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      calls.push({ url: req.url, headers: req.headers, body: JSON.parse(body || '{}') })
      res.writeHead(202); res.end('{"accepted":true}')
    })
  })
  await new Promise((r) => server.listen(0, r))
  process.env.ZYRA_API_URL = `http://127.0.0.1:${server.address().port}`
  delete require.cache[require.resolve('../src/logger')]
  const { dispatchLog } = require('../src/logger')

  dispatchLog({
    zyraKey: 'sk-live-xyz', sdkLanguage: 'node', provider: 'openai',
    modelRequested: 'gpt-4o', modelRoutedTo: 'gpt-4o-mini',
    promptTokens: 10, completionTokens: 4, latencyMs: 120, status: 'success',
  })

  await new Promise((r) => setTimeout(r, 300))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/v1/log')
  assert.equal(calls[0].headers['x-zyra-api-key'], 'sk-live-xyz')
  assert.equal(calls[0].body.model_requested, 'gpt-4o')
  assert.equal(calls[0].body.model_routed_to, 'gpt-4o-mini')
  server.close()
  delete process.env.ZYRA_API_URL
})
