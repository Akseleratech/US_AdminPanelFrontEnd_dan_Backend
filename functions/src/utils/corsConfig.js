const cors = require('cors');

// functions/src/utils/corsConfig.js
const getCorsOrigins = () => {
  const env = process.env.NODE_ENV || 'development';

  const origins = {
    development: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],

    staging: [
      'https://unionspace-staging.web.app',
      'https://unionspace-staging.firebaseapp.com',
    ],

    production: [
      'https://unionspace-w9v242.web.app',
      'https://unionspace-w9v242.firebaseapp.com',
    ],
  };

  return origins[env] || origins.development;
};

// Detect if request is from a legitimate mobile app
const isMobileApp = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const appIdentifier = req.headers['x-app-identifier'] || '';
  const appVersion = req.headers['x-app-version'] || '';

  // Check for mobile app patterns in User-Agent
  const mobileAppPatterns = [
    /UnionSpace\/[\d.]+/, // Custom app identifier
    /okhttp\/[\d.]+/, // Android HTTP client
    /CFNetwork\/[\d.]+/, // iOS HTTP client
    /Alamofire\/[\d.]+/, // iOS HTTP client
    /Retrofit\/[\d.]+/, // Android HTTP client
  ];

  const hasMobilePattern = mobileAppPatterns.some((pattern) => pattern.test(userAgent));

  // Check for custom app headers
  const hasAppHeaders = appIdentifier === 'unionspace-mobile' && appVersion;

  // Additional security: check for suspicious patterns
  const suspiciousPatterns = [
    /curl/i,
    /postman/i,
    /insomnia/i,
    /httpie/i,
    /wget/i,
  ];

  const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(userAgent));

  return (hasMobilePattern || hasAppHeaders) && !isSuspicious;
};

const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = getCorsOrigins();

    // Handle requests with no origin (mobile apps, etc.)
    if (!origin) {
      // In development, allow no origin for easier testing
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // In production, validate mobile apps properly
      if (process.env.NODE_ENV === 'production') {
        // Get the full request object from the callback context
        const req = this.req;

        if (req && isMobileApp(req)) {
          console.log('Allowing legitimate mobile app request');
          return callback(null, true);
        } else {
          console.warn('Blocking suspicious no-origin request in production');
          return callback(new Error('Origin required for web requests'));
        }
      }

      // Default: allow in staging/other environments with warning
      console.warn('Request with no origin in non-production environment');
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-requested-with',
    'x-app-identifier',
    'x-app-version',
    'x-device-id',
    'x-platform',
  ],
  exposedHeaders: [
    'x-total-count',
    'x-page-count',
    'x-rate-limit-remaining',
    'x-rate-limit-reset',
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours preflight cache
};

// Enhanced CORS middleware with security headers
const corsMiddleware = cors(corsOptions);

// Wrapper to add security headers and enhanced validation
const secureCorsMiddleware = (req, res, next) => {
  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });

  // Add request object to CORS context for mobile app detection
  corsOptions.req = req;

  return corsMiddleware(req, res, next);
};

// Export configured CORS middleware
module.exports = secureCorsMiddleware;
