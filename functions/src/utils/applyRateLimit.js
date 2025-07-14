const {applyRateLimit} = require('./firestoreRateLimiter');

/**
 * Apply rate limiting to write operations (POST, PUT, DELETE, PATCH)
 * This helper function can be used in any endpoint to add rate limiting
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @return {Promise<boolean>} True if request is allowed, false if rate limited
 */
async function applyWriteOperationRateLimit(req, res) {
  const method = req.method.toUpperCase();

  // Only apply rate limiting to write operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const allowed = await applyRateLimit(req, res, 'WRITE_OPERATIONS');
    return allowed;
  }

  return true; // Non-write operations are allowed
}

/**
 * Apply rate limiting to search operations
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @return {Promise<boolean>} True if request is allowed, false if rate limited
 */
async function applySearchOperationRateLimit(req, res) {
  const allowed = await applyRateLimit(req, res, 'SEARCH_OPERATIONS');
  return allowed;
}

/**
 * Apply rate limiting to read operations
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @return {Promise<boolean>} True if request is allowed, false if rate limited
 */
async function applyReadOperationRateLimit(req, res) {
  const allowed = await applyRateLimit(req, res, 'READ_OPERATIONS');
  return allowed;
}

/**
 * Apply rate limiting to account creation operations
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @return {Promise<boolean>} True if request is allowed, false if rate limited
 */
async function applyAccountCreationRateLimit(req, res) {
  const allowed = await applyRateLimit(req, res, 'ACCOUNT_CREATION');
  return allowed;
}

/**
 * Apply rate limiting to admin operations
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @return {Promise<boolean>} True if request is allowed, false if rate limited
 */
async function applyAdminOperationRateLimit(req, res) {
  const allowed = await applyRateLimit(req, res, 'ADMIN_OPERATIONS');
  return allowed;
}

/**
 * Apply rate limiting to geocode operations
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @return {Promise<boolean>} True if request is allowed, false if rate limited
 */
async function applyGeocodeRateLimit(req, res) {
  const allowed = await applyRateLimit(req, res, 'GEOCODE');
  return allowed;
}

module.exports = {
  applyWriteOperationRateLimit,
  applySearchOperationRateLimit,
  applyReadOperationRateLimit,
  applyAccountCreationRateLimit,
  applyAdminOperationRateLimit,
  applyGeocodeRateLimit,
};
