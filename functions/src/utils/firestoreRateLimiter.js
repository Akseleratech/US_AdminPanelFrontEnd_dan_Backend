const admin = require('firebase-admin');
const {getDb} = require('./helpers');

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
      // Use first 10 chars as identifier (avoid storing full tokens)
      userId = `auth_${token.substring(0, 10)}`;
    } catch (error) {
      // Ignore auth errors for rate limiting purposes
    }
  }

  // Get IP address with multiple fallbacks
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip ||
            'unknown';

  // Combine user ID and IP for better identification
  return userId ? `${userId}_${ip}` : `ip_${ip}`;
}

/**
 * Firestore-based sliding window rate limiter
 * Uses Firestore transactions for atomic operations
 */
async function checkRateLimit(clientId, limit) {
  const db = getDb();
  const now = Date.now();
  const windowStart = now - limit.window;

  // Use rate_limits collection with subcollections for each client
  const rateLimitRef = db.collection('rate_limits').doc(clientId);

  try {
    // Use transaction to ensure atomic read-modify-write
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);

      let requests = [];
      let metadata = {firstRequest: now, lastRequest: now};

      if (doc.exists) {
        const data = doc.data();
        requests = data.requests || [];
        metadata = data.metadata || metadata;
      }

      // Remove old requests outside the window
      const validRequests = requests.filter((timestamp) => timestamp > windowStart);

      // Check if limit exceeded
      if (validRequests.length >= limit.requests) {
        // Update last request time even if blocked (for monitoring)
        transaction.set(rateLimitRef, {
          requests: validRequests,
          metadata: {
            ...metadata,
            lastRequest: now,
            lastBlocked: now,
          },
        });

        return {
          allowed: false,
          resetTime: Math.min(...validRequests) + limit.window,
          remaining: 0,
          total: limit.requests,
        };
      }

      // Add current request
      validRequests.push(now);

      // Update Firestore document
      transaction.set(rateLimitRef, {
        requests: validRequests,
        metadata: {
          ...metadata,
          lastRequest: now,
          totalRequests: (metadata.totalRequests || 0) + 1,
        },
      });

      return {
        allowed: true,
        resetTime: now + limit.window,
        remaining: limit.requests - validRequests.length,
        total: limit.requests,
      };
    });

    return result;
  } catch (error) {
    console.error('Rate limiter transaction failed:', error);
    // In case of Firestore error, allow the request (fail open)
    // This prevents Firestore issues from blocking all traffic
    return {
      allowed: true,
      resetTime: now + limit.window,
      remaining: limit.requests - 1,
      total: limit.requests,
      error: true,
    };
  }
}

/**
 * Cleanup old rate limit entries
 * Should be called periodically (e.g., via scheduled function)
 */
async function cleanupRateLimits() {
  const db = getDb();
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const cutoffTime = now - maxAge;

  try {
    // Query documents older than cutoff time
    const snapshot = await db.collection('rate_limits')
        .where('metadata.lastRequest', '<', cutoffTime)
        .limit(100) // Process in batches to avoid timeouts
        .get();

    if (snapshot.empty) {
      console.log('No old rate limit entries to clean up');
      return 0;
    }

    // Delete old documents in batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${snapshot.docs.length} old rate limit entries`);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
    throw error;
  }
}

/**
 * Check rate limit for a specific operation type
 */
async function checkRateLimitForOperation(req, limitType) {
  const limit = RATE_LIMITS[limitType];
  if (!limit) {
    console.warn(`Unknown rate limit type: ${limitType}`);
    return {allowed: true};
  }

  const clientId = getClientId(req);

  // Add operation type to client ID for granular limiting
  const operationClientId = `${clientId}_${limitType}`;

  return await checkRateLimit(operationClientId, limit);
}

/**
 * Rate limit response helper
 */
function createRateLimitResponse(result, limitType, req) {
  const limit = RATE_LIMITS[limitType];
  const clientId = getClientId(req);

  // Log rate limit violations for monitoring
  console.warn(`Rate limit exceeded: ${limitType} for client ${clientId}`, {
    limitType,
    clientId,
    limit: limit.requests,
    window: limit.window,
    resetTime: result.resetTime,
  });

  return {
    success: false,
    error: 'Rate limit exceeded',
    message: `Too many requests for ${limitType}. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    rateLimit: {
      type: limitType,
      limit: limit.requests,
      window: Math.floor(limit.window / 1000),
      remaining: result.remaining,
      reset: Math.floor(result.resetTime / 1000),
    },
  };
}

/**
 * Apply rate limiting with automatic response handling
 */
async function applyRateLimit(req, res, limitType) {
  try {
    const result = await checkRateLimitForOperation(req, limitType);

    // Set rate limit headers for client awareness
    const limit = RATE_LIMITS[limitType];
    if (limit) {
      res.setHeader('X-RateLimit-Type', limitType);
      res.setHeader('X-RateLimit-Limit', limit.requests);
      res.setHeader('X-RateLimit-Window', Math.floor(limit.window / 1000));
      res.setHeader('X-RateLimit-Remaining', result.remaining || 0);
      res.setHeader('X-RateLimit-Reset', Math.floor((result.resetTime || Date.now()) / 1000));
    }

    if (!result.allowed) {
      const errorResponse = createRateLimitResponse(result, limitType, req);
      res.status(429).json(errorResponse);
      return false; // Request blocked
    }

    return true; // Request allowed
  } catch (error) {
    console.error(`Rate limiting error for ${limitType}:`, error);
    // Fail open - allow request if rate limiting system fails
    return true;
  }
}

/**
 * Get rate limit statistics for monitoring
 */
async function getRateLimitStats(clientId, limitType = null) {
  const db = getDb();

  try {
    if (limitType) {
      // Get stats for specific operation type
      const operationClientId = `${clientId}_${limitType}`;
      const doc = await db.collection('rate_limits').doc(operationClientId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        clientId: operationClientId,
        requests: data.requests?.length || 0,
        metadata: data.metadata || {},
      };
    } else {
      // Get all stats for client
      const snapshot = await db.collection('rate_limits')
          .where('__name__', '>=', clientId)
          .where('__name__', '<', clientId + '\uf8ff')
          .get();

      const stats = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        stats[doc.id] = {
          requests: data.requests?.length || 0,
          metadata: data.metadata || {},
        };
      });

      return stats;
    }
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return null;
  }
}

module.exports = {
  RATE_LIMITS,
  getClientId,
  checkRateLimit,
  checkRateLimitForOperation,
  applyRateLimit,
  createRateLimitResponse,
  cleanupRateLimits,
  getRateLimitStats,
};
