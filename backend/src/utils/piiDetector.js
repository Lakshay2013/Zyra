const patterns = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g,
  phone: /(\+91|0)?[6-9]\d{9}/g,
  aadhaar: /\d{4}\s\d{4}\s\d{4}/g,
  creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
  pan: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g
}

exports.detectPII = (text) => {
  const found = []

  for (const [type, pattern] of Object.entries(patterns)) {
    pattern.lastIndex = 0
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      found.push(type)
    }
  }

  // Score based on how many types found
  const score = Math.min(found.length * 25, 100)

  return {
    score,
    types: found,
    hasPII: found.length > 0
  }
}