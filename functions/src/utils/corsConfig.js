const cors = require('cors');

// Configure CORS with restricted origins for security
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Alternative dev port
  'http://localhost:3001', // Current dev port
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  `https://${process.env.FIREBASE_PROJECT_ID || 'unionspace-w9v242'}.web.app`, // Production domain
  `https://${process.env.FIREBASE_PROJECT_ID || 'unionspace-w9v242'}.firebaseapp.com`, // Firebase app domain
];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests in development)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

// Export configured CORS middleware
module.exports = cors(corsOptions);
