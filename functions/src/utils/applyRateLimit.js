const {checkRateLimitSync, createRateLimitResponse} = require('./rateLimiter');

/**
 * Apply rate limiting to write operations (POST, PUT, DELETE, PATCH)
 * This helper function can be used in any endpoint to add rate limiting
 */
function applyWriteOperationRateLimit(req, res) {
  const method = req.method.toUpperCase();
  
  // Only apply rate limiting to write operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const rateLimitResult = checkRateLimitSync(req, 'WRITE_OPERATIONS');
    if (!rateLimitResult.allowed) {
      res.status(429).json(createRateLimitResponse(rateLimitResult, 'WRITE_OPERATIONS'));
      return false; // Indicates rate limit was hit
    }
  }
  
  return true; // Indicates request can proceed
}

/**
 * Apply rate limiting to search operations
 */
function applySearchOperationRateLimit(req, res) {
  const rateLimitResult = checkRateLimitSync(req, 'SEARCH_OPERATIONS');
  if (!rateLimitResult.allowed) {
    res.status(429).json(createRateLimitResponse(rateLimitResult, 'SEARCH_OPERATIONS'));
    return false;
  }
  return true;
}

/**
 * Apply rate limiting to read operations
 */
function applyReadOperationRateLimit(req, res) {
  const rateLimitResult = checkRateLimitSync(req, 'READ_OPERATIONS');
  if (!rateLimitResult.allowed) {
    res.status(429).json(createRateLimitResponse(rateLimitResult, 'READ_OPERATIONS'));
    return false;
  }
  return true;
}

module.exports = {
  applyWriteOperationRateLimit,
  applySearchOperationRateLimit,
  applyReadOperationRateLimit
};