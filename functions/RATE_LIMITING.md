# Rate Limiting Implementation

## Overview

This project implements a robust, Firestore-based rate limiting system designed specifically for Firebase Cloud Functions. Unlike in-memory solutions, this implementation provides global rate limiting across all function instances.

## Key Features

### ✅ Serverless-Ready
- Uses Firestore for persistent storage
- Works across multiple function instances
- No memory limitations or instance-specific counters

### ✅ Sliding Window Algorithm
- More flexible than fixed windows
- Prevents burst traffic from overwhelming resources
- Accurate rate limiting over time

### ✅ Multiple Operation Types
- Different limits for different operation types
- Granular control over API usage
- Configurable limits per operation

### ✅ Automatic Cleanup
- Scheduled cleanup of old rate limit data
- Prevents Firestore storage bloat
- Maintains optimal performance

## Rate Limit Configurations

```javascript
const RATE_LIMITS = {
  // High priority - very strict limits
  ACCOUNT_CREATION: { requests: 3, window: 60000 },    // 3 requests per minute
  ADMIN_OPERATIONS: { requests: 5, window: 300000 },   // 5 requests per 5 minutes
  GEOCODE: { requests: 10, window: 60000 },            // 10 requests per minute
  
  // Write operations - moderate limits
  WRITE_OPERATIONS: { requests: 30, window: 60000 },   // 30 requests per minute
  
  // Read operations - more lenient
  SEARCH_OPERATIONS: { requests: 60, window: 60000 },  // 60 requests per minute
  READ_OPERATIONS: { requests: 100, window: 60000 },   // 100 requests per minute
};
```

## Usage

### Basic Rate Limiting

```javascript
const { applyRateLimit } = require('./utils/firestoreRateLimiter');

// In your Cloud Function
const allowed = await applyRateLimit(req, res, 'WRITE_OPERATIONS');
if (!allowed) {
  return; // Rate limit response already sent
}
```

### Using Helper Functions

```javascript
const { 
  applyWriteOperationRateLimit,
  applySearchOperationRateLimit,
  applyAccountCreationRateLimit 
} = require('./utils/applyRateLimit');

// For write operations (POST, PUT, DELETE, PATCH)
const allowed = await applyWriteOperationRateLimit(req, res);

// For search operations
const allowed = await applySearchOperationRateLimit(req, res);

// For account creation
const allowed = await applyAccountCreationRateLimit(req, res);
```

## Client Identification

The system identifies clients using a combination of:
1. **Authentication Token** (first 10 characters as identifier)
2. **IP Address** (with proper header parsing)
3. **Operation Type** (for granular limiting)

Example client ID: `auth_abc1234567_192.168.1.1_WRITE_OPERATIONS`

## Response Headers

When rate limiting is applied, the following headers are sent:

```
X-RateLimit-Type: WRITE_OPERATIONS
X-RateLimit-Limit: 30
X-RateLimit-Window: 60
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1640995200
```

## Error Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests for WRITE_OPERATIONS. Try again in 45 seconds.",
  "retryAfter": 45,
  "rateLimit": {
    "type": "WRITE_OPERATIONS",
    "limit": 30,
    "window": 60,
    "remaining": 0,
    "reset": 1640995200
  }
}
```

## Firestore Structure

Rate limiting data is stored in Firestore:

```
rate_limits/
├── {clientId}
│   ├── requests: [timestamp1, timestamp2, ...]
│   └── metadata: {
│       firstRequest: timestamp,
│       lastRequest: timestamp,
│       totalRequests: number,
│       lastBlocked?: timestamp
│   }
```

## Cleanup Process

Automatic cleanup runs every 6 hours via scheduled function:

```javascript
// Scheduled function: rateLimitCleanup
// Schedule: '0 */6 * * *' (every 6 hours)
// Removes entries older than 24 hours
```

## Implementation in Endpoints

### Orders Example

```javascript
const orders = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Apply rate limiting
      const rateLimitAllowed = await applyWriteOperationRateLimit(req, res);
      if (!rateLimitAllowed) {
        return; // Rate limit exceeded, response already sent
      }

      // Continue with normal processing...
    } catch (error) {
      return handleError(res, error, 500, req);
    }
  });
});
```

### Custom Rate Limiting

```javascript
const { applyRateLimit } = require('./utils/firestoreRateLimiter');

// Custom rate limiting for specific operations
const allowed = await applyRateLimit(req, res, 'GEOCODE');
if (!allowed) {
  return;
}
```

## Monitoring

### Rate Limit Statistics

```javascript
const { getRateLimitStats } = require('./utils/firestoreRateLimiter');

// Get stats for specific client and operation
const stats = await getRateLimitStats('ip_192.168.1.1', 'WRITE_OPERATIONS');

// Get all stats for client
const allStats = await getRateLimitStats('ip_192.168.1.1');
```

### Logging

The system logs:
- Rate limit violations with client details
- Cleanup operations and results
- Transaction failures (with fail-open behavior)

## Security Benefits

### ✅ DoS Protection
- Prevents overwhelming the API with too many requests
- Protects against both accidental and malicious traffic spikes

### ✅ Brute Force Protection
- Account creation limits prevent account enumeration
- Authentication limits prevent password brute forcing

### ✅ Resource Protection
- Database operation limits prevent expensive query abuse
- Geocoding limits prevent external API quota exhaustion

### ✅ Cost Control
- Limits Firebase usage to prevent unexpected billing
- Protects against runaway processes or scripts

## Best Practices

1. **Fail Open**: If Firestore fails, allow requests to prevent service disruption
2. **Atomic Operations**: Use Firestore transactions for consistent rate limit checking
3. **Cleanup**: Regular cleanup prevents storage bloat
4. **Monitoring**: Log violations for security monitoring
5. **Headers**: Provide rate limit information to clients

## Migration from In-Memory

The new Firestore-based system replaces the previous in-memory implementation:

- ❌ **Old**: `requestStore = new Map()` (per-instance only)
- ✅ **New**: Firestore collection (global across instances)

- ❌ **Old**: `checkRateLimitSync(req, 'TYPE')`
- ✅ **New**: `await applyRateLimit(req, res, 'TYPE')`

## Testing

Rate limiting can be tested by:
1. Making rapid requests to any protected endpoint
2. Observing rate limit headers in responses
3. Checking Firestore for rate limit documents
4. Monitoring cleanup function execution

## Troubleshooting

### Common Issues

1. **High Firestore Usage**: Check cleanup function execution
2. **False Positives**: Verify client identification logic
3. **Transaction Conflicts**: Monitor for high concurrency scenarios

### Debug Information

Enable detailed logging by checking:
- Client ID generation
- Firestore transaction success/failure
- Rate limit calculation accuracy