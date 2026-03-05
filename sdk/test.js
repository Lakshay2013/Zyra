const { AIShield, OpenAIShield, AIShieldMiddleware } = require('./index')

const shield = new AIShield({
  apiKey: 'sk-live-e603a189c888796a5a061e6e2b5fb6f5eb2935857a056a53',
  baseUrl: 'http://localhost:5000'
})

// ─────────────────────────────────────────
// PATTERN 1: Manual logging (what we built before)
// ─────────────────────────────────────────
async function testManual() {
  console.log('\n[Pattern 1] Manual logging...')
  await shield.log({
    userId: 'user_manual',
    model: 'gpt-4',
    prompt: 'What is 2 + 2?',
    response: '4',
    tokens: { prompt: 10, completion: 5, total: 15 },
    latency: 120
  })
  console.log('✅ Manual log queued')
}

// ─────────────────────────────────────────
// PATTERN 2: OpenAI wrapper (auto-logging)
// Customer just swaps their openai client
// ─────────────────────────────────────────
async function testOpenAIWrapper() {
  console.log('\n[Pattern 2] OpenAI wrapper...')

  // Simulate what the openai client looks like
  // In real usage: const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY })
  const mockOpenAI = {
    chat: {
      completions: {
        create: async (params) => ({
          choices: [{ message: { content: 'Paris is the capital of France.' } }],
          usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 }
        })
      }
    }
  }

  // Wrap it — this is all the customer does
  const monitoredOpenAI = new OpenAIShield(mockOpenAI, shield)

  // Customer uses it exactly like normal OpenAI — zero extra code
  const response = await monitoredOpenAI.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'What is the capital of France?' }]
  }, { userId: 'user_wrapped' })

  console.log('✅ OpenAI wrapper response:', response.choices[0].message.content)
  console.log('   (logged automatically to AI Shield)')
}

// ─────────────────────────────────────────
// PATTERN 3: Express middleware usage example
// ─────────────────────────────────────────
function showMiddlewareExample() {
  console.log('\n[Pattern 3] Express middleware usage:')
  console.log(`
  const { AIShieldMiddleware } = require('ai-shield-sdk')
  const shieldMiddleware = new AIShieldMiddleware(shield)

  // Apply globally to your Express app
  app.use(shieldMiddleware.middleware())

  // In your route, just attach data to res.locals
  app.post('/chat', async (req, res) => {
    const response = await openai.chat.completions.create({ ... })

    // Attach this — middleware handles the rest
    res.locals.aishield = {
      userId: req.user.id,
      model: 'gpt-4',
      prompt: req.body.message,
      response: response.choices[0].message.content,
      tokens: response.usage
    }

    res.json({ reply: response.choices[0].message.content })
  })
  `)
}

async function run() {
  await testManual()
  await testOpenAIWrapper()
  showMiddlewareExample()

  console.log('\nWaiting for batch flush...')
  await new Promise(r => setTimeout(r, 4000))
  await shield.shutdown()
  console.log('\n✅ All done. Check your dashboard.')
}

run()