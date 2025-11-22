/**
 * Input sanitization middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */

/**
 * Sanitize a string by removing HTML tags and dangerous characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input
  }
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Escape special characters that could be used in XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  return sanitized.trim()
}

/**
 * Recursively sanitize an object
 * @param {any} obj - The object to sanitize
 * @returns {any} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }
  
  if (typeof obj === 'object') {
    const sanitized = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip sanitization for certain fields that may contain valid HTML/JSON
        if (key === 'avatar' || key === 'description' || key === 'data') {
          // These fields might contain URLs or JSON, sanitize more carefully
          sanitized[key] = typeof obj[key] === 'string' 
            ? sanitizeString(obj[key]) 
            : sanitizeObject(obj[key])
        } else {
          sanitized[key] = sanitizeObject(obj[key])
        }
      }
    }
    return sanitized
  }
  
  return obj
}

/**
 * Middleware to sanitize request body
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query)
  }
  
  next()
}

/**
 * Sanitize specific fields while preserving others
 * Useful for fields that need HTML (like rich text editors)
 */
export const sanitizeSelective = (allowedHtmlFields = []) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const sanitized = {}
      for (const key in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          if (allowedHtmlFields.includes(key)) {
            // Only remove script tags, allow other HTML
            sanitized[key] = typeof req.body[key] === 'string'
              ? req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              : req.body[key]
          } else {
            sanitized[key] = sanitizeObject(req.body[key])
          }
        }
      }
      req.body = sanitized
    }
    next()
  }
}

