// functions/src/utils/errorHandler.js
const crypto = require('crypto');

// Generate unique error ID for tracking
const generateErrorId = () => {
  return crypto.randomBytes(8).toString('hex');
};

// Define safe error messages for different error types
const getSafeErrorMessage = (error, statusCode) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Common safe messages based on status codes
  const safeMessages = {
    400: 'Invalid request parameters',
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Resource not found',
    409: 'Resource already exists',
    429: 'Too many requests',
    500: 'Internal server error',
    502: 'Service temporarily unavailable',
    503: 'Service unavailable'
  };

  // In development, show more details
  if (isDevelopment) {
    return error.message || safeMessages[statusCode] || 'An error occurred';
  }

  // In production, only show safe messages
  return safeMessages[statusCode] || 'An error occurred';
};

// Log error details securely
const logError = (error, errorId, req = null) => {
  const logData = {
    errorId,
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
  };

  // Add request context if available (without sensitive data)
  if (req) {
    logData.request = {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      // Don't log authorization headers or request body
    };
  }

  console.error('ERROR:', JSON.stringify(logData, null, 2));
};

// Secure error response handler
const handleError = (res, error, statusCode = 500, req = null) => {
  const errorId = generateErrorId();
  
  // Log the actual error for debugging
  logError(error, errorId, req);
  
  // Determine if this is an Error object or string
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  
  // Get safe message for client
  const safeMessage = getSafeErrorMessage(errorObj, statusCode);
  
  // Response structure
  const response = {
    success: false,
    error: {
      message: safeMessage,
      errorId: errorId,
      timestamp: new Date().toISOString(),
    }
  };

  // Add error code only if it's safe to expose
  if (statusCode >= 400 && statusCode < 500) {
    response.error.code = statusCode;
  }

  // In development, add more debug info
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      originalMessage: errorObj.message,
      stack: errorObj.stack?.split('\n').slice(0, 5), // Limit stack trace
      name: errorObj.name,
    };
  }

  return res.status(statusCode).json(response);
};

// Secure success response handler
const handleResponse = (res, data, statusCode = 200, message = null) => {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
  };

  // Add message if provided
  if (message) {
    response.message = message;
  }

  // Add data if provided
  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Validation error handler
const handleValidationError = (res, validationErrors, req = null) => {
  const errorId = generateErrorId();
  
  // Log validation errors
  console.warn('VALIDATION_ERROR:', {
    errorId,
    timestamp: new Date().toISOString(),
    errors: validationErrors,
    url: req?.url,
    method: req?.method,
  });

  const response = {
    success: false,
    error: {
      message: 'Validation failed',
      errorId: errorId,
      timestamp: new Date().toISOString(),
      validation: validationErrors.map(error => ({
        field: error.field || 'unknown',
        message: error.message || error,
      }))
    }
  };

  return res.status(400).json(response);
};

// Authentication error handler
const handleAuthError = (res, message = 'Authentication required', req = null) => {
  const errorId = generateErrorId();
  
  console.warn('AUTH_ERROR:', {
    errorId,
    timestamp: new Date().toISOString(),
    message,
    url: req?.url,
    method: req?.method,
    userAgent: req?.headers['user-agent'],
  });

  const response = {
    success: false,
    error: {
      message,
      errorId: errorId,
      timestamp: new Date().toISOString(),
      code: 401,
    }
  };

  return res.status(401).json(response);
};

// Rate limiting error handler
const handleRateLimitError = (res, req = null) => {
  const errorId = generateErrorId();
  
  console.warn('RATE_LIMIT_ERROR:', {
    errorId,
    timestamp: new Date().toISOString(),
    url: req?.url,
    method: req?.method,
    ip: req?.ip || req?.connection?.remoteAddress,
  });

  const response = {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      errorId: errorId,
      timestamp: new Date().toISOString(),
      code: 429,
    }
  };

  return res.status(429).json(response);
};

module.exports = {
  handleError,
  handleResponse,
  handleValidationError,
  handleAuthError,
  handleRateLimitError,
  generateErrorId,
  logError,
};