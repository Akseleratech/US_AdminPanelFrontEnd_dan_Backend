const admin = require('firebase-admin');

// In-memory store for rate limiting (for simple implementation)
// In production, consider using Redis or Firestore for distributed rate limiting
const requestStore = new Map();

// Rate limit configurations
const RATE_LIMITS = {
  // High priority - very strict limits
  ACCOUNT_CREATION: {requests: 3, window: 60000}, // 3 requests per minute
  ADMIN_OPERATIONS: {requests: 5, window: 300000}, // 5 requests per 5 minutes
  GEOCODE: {requests: 10, window: 60000}, // 10 requests per minute

  // Write operations - moderate limits
  WRITE_OPERATIONS: {requests: 30, window: 60000}, // 30 requests per minute

  // Read operations - more lenient
  SEARCH_OPERATIONS: {requests: 60, window: 60000}, // 60 requests per minute
  READ_OPERATIONS: {requests: 100, window: 60000}, // 100 requests per minute
};

/**
 * Get client identifier from request
 * Uses IP address, user ID (if authenticated), or combination
 */
function getClientId(req) {
  // Try to get user ID from auth token first
  const authHeader = req.headers.authorization;
  let userId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1];
      // For production, you might want to verify the token here
      // For now, we'll use a simple approach
      userId = `auth_${token.substring(0, 10)}`; // First 10 chars as identifier
    } catch (error) {
      // Ignore auth errors for rate limiting purposes
    }
  }

  // Get IP address
  const ip = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip ||
            'unknown';

  // Combine user ID and IP for better identification
  return userId ? `${userId}_${ip}` : `ip_${ip}`;
}

/**
 * Sliding window rate limiter implementation
 */
function checkRateLimit(clientId, limit) {
  const now = Date.now();
  const windowStart = now - limit.window;

  // Get or create client's request history
  if (!requestStore.has(clientId)) {
    requestStore.set(clientId, []);
  }

  const requests = requestStore.get(clientId);

  // Remove old requests outside the window
  const validRequests = requests.filter((timestamp) => timestamp > windowStart);

  // Check if limit exceeded
  if (validRequests.length >= limit.requests) {
    return {
      allowed: false,
      resetTime: Math.min(...validRequests) + limit.window,
      remaining: 0,
      total: limit.requests,
    };
  }

  // Add current request
  validRequests.push(now);
  requestStore.set(clientId, validRequests);

  return {
    allowed: true,
    resetTime: now + limit.window,
    remaining: limit.requests - validRequests.length,
    total: limit.requests,
  };
}

/**
 * Clean up old entries periodically to prevent memory leaks
 */
function cleanupStore() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [clientId, requests] of requestStore.entries()) {
    const validRequests = requests.filter((timestamp) => (now - timestamp) < maxAge);
    if (validRequests.length === 0) {
      requestStore.delete(clientId);
    } else {
      requestStore.set(clientId, validRequests);
    }
  }
}

// Clean up every hour
setInterval(cleanupStore, 60 * 60 * 1000);

/**
 * Rate limiting middleware
 */
function createRateLimiter(limitType) {
  return (req, res, next) => {
    const limit = RATE_LIMITS[limitType];
    if (!limit) {
      console.warn(`Unknown rate limit type: ${limitType}`);
      return next();
    }

    const clientId = getClientId(req);
    const result = checkRateLimit(clientId, limit);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.requests);
    res.setHeader('X-RateLimit-Window', Math.floor(limit.window / 1000));
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime / 1000));

    if (!result.allowed) {
      console.warn(`Rate limit exceeded for client ${clientId} on ${limitType}`);
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      });
    }

    // Continue to next middleware/handler
    if (typeof next === 'function') {
      return next();
    }
  };
}

/**
 * Check rate limit without middleware (for use in Firebase functions)
 */
function checkRateLimitSync(req, limitType) {
  const limit = RATE_LIMITS[limitType];
  if (!limit) {
    console.warn(`Unknown rate limit type: ${limitType}`);
    return {allowed: true};
  }

  const clientId = getClientId(req);
  return checkRateLimit(clientId, limit);
}

/**
 * Rate limit response helper
 */
function createRateLimitResponse(result, limitType) {
  const limit = RATE_LIMITS[limitType];
  return {
    success: false,
    error: 'Rate limit exceeded',
    message: `Too many requests. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    rateLimit: {
      limit: limit.requests,
      window: Math.floor(limit.window / 1000),
      remaining: result.remaining,
      reset: Math.floor(result.resetTime / 1000),
    },
  };
}

module.exports = {
  RATE_LIMITS,
  createRateLimiter,
  checkRateLimitSync,
  createRateLimitResponse,
  getClientId,
};
