const {onSchedule} = require('firebase-functions/v2/scheduler');
const {cleanupRateLimits} = require('./utils/firestoreRateLimiter');

/**
 * Scheduled function to clean up old rate limit entries
 * Runs every 6 hours to keep Firestore collection size manageable
 */
const rateLimitCleanup = onSchedule('0 */6 * * *', async (_event) => {
  console.log('🧹 Starting rate limit cleanup job...');

  try {
    const deletedCount = await cleanupRateLimits();
    console.log(`✅ Rate limit cleanup completed. Deleted ${deletedCount} old entries.`);

    // Return success status for monitoring
    return {
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Rate limit cleanup failed:', error);

    // Don't throw error - let the scheduled function complete
    // Log error for monitoring instead
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});

module.exports = {rateLimitCleanup};
