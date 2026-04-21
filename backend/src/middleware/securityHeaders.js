const crypto = require('crypto')

/**
 * Custom security headers middleware.
 * Supplements Helmet with additional hardening and request traceability.
 */
const securityHeaders = (req, res, next) => {
  // Generate unique request ID for traceability
  const requestId = crypto.randomUUID()
  req.requestId = requestId
  res.setHeader('X-Request-ID', requestId)

  // Prevent MIME type sniffing (Helmet handles this too, belt-and-suspenders)
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Restrict browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Prevent caching of sensitive responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('Pragma', 'no-cache')
  }

  next()
}

module.exports = securityHeaders
