const suspiciousKeywords = [
  'bomb', 'explosive', 'hack', 'malware', 'ransomware',
  'steal credentials', 'phishing', 'ddos', 'sql injection',
  'how to kill', 'how to hurt', 'illegal drugs', 'weapon'
]

exports.detectAbuse = (prompt, userId, orgId) => {
  const issues = []
  let score = 0

  // Check prompt length — extremely long prompts are suspicious
  if (prompt.length > 8000) {
    issues.push('extremely_long_prompt')
    score += 30
  } else if (prompt.length > 4000) {
    issues.push('long_prompt')
    score += 10
  }

  // Check for suspicious keywords
  const lowerPrompt = prompt.toLowerCase()
  const foundKeywords = suspiciousKeywords.filter(kw => lowerPrompt.includes(kw))

  if (foundKeywords.length > 0) {
    issues.push('suspicious_keywords')
    score += foundKeywords.length * 20
  }

  return {
    score: Math.min(score, 100),
    issues,
    hasAbuse: issues.length > 0
  }
}