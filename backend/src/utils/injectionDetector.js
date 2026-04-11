const injectionPhrases = [
  'ignore previous instructions',
  'ignore all instructions',
  'disregard your training',
  'reveal system prompt',
  'show system prompt',
  'print system prompt',
  'act as admin',
  'act as root',
  'you are now',
  'forget everything',
  'new persona',
  'pretend you are',
  'bypass restrictions',
  'jailbreak',
  'dan mode',
  'developer mode',
  'override instructions',
  'ignore your guidelines',
  'do anything now',
  'ignore your safety',
  'ignored your safety',
  'ignoring your safety',
  'ignore safety guidelines',
  'bypass safety',
  'output all secret',
  'output the secret',
  'output secret keys',
  'reveal all secret',
  'output your instructions',
  'disregard safety',
  'without restrictions',
  'no restrictions mode',
  'unrestricted mode'
]

exports.detectInjection = (text) => {
  const lowerText = text.toLowerCase()
  const matched = []

  for (const phrase of injectionPhrases) {
    if (lowerText.includes(phrase)) {
      matched.push(phrase)
    }
  }

  // Each match adds significant score
  const score = Math.min(matched.length * 40, 100)

  return {
    score,
    matches: matched,
    hasInjection: matched.length > 0
  }
}