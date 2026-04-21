/**
 * Input sanitization middleware.
 * Prevents NoSQL injection by stripping $ prefixes from keys
 * and trimming string values.
 */

function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitizeObject)

  const clean = {}
  for (const [key, value] of Object.entries(obj)) {
    // Strip keys starting with $ (MongoDB operator injection)
    if (key.startsWith('$')) continue

    // Strip keys containing dots (MongoDB field traversal)
    if (key.includes('.')) continue

    if (typeof value === 'string') {
      clean[key] = value.trim()
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeObject(value)
    } else {
      clean[key] = value
    }
  }
  return clean
}

const sanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query)
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params)
  }
  next()
}

module.exports = sanitize
