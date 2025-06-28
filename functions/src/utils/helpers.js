const admin = require("firebase-admin");

// Get Firestore instance
const getDb = () => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
};

// Common response handler
const handleResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: statusCode < 400,
    data: statusCode < 400 ? data : null,
    error: statusCode >= 400 ? data : null,
    timestamp: new Date().toISOString()
  });
};

// Error handler
const handleError = (res, error, statusCode = 500) => {
  console.error('Function Error:', error);
  handleResponse(res, {
    message: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR'
  }, statusCode);
};

// Validation helpers
const validateRequired = (data, fields) => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
};

const validateString = (value, field, minLength = 1, maxLength = 500) => {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  if (value.length < minLength) {
    throw new Error(`${field} must be at least ${minLength} characters`);
  }
  if (value.length > maxLength) {
    throw new Error(`${field} must be no more than ${maxLength} characters`);
  }
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
};

// Data sanitization
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/\s+/g, ' ');
};

const sanitizeObject = (obj, allowedFields) => {
  const sanitized = {};
  allowedFields.forEach(field => {
    if (obj[field] !== undefined) {
      if (typeof obj[field] === 'string') {
        sanitized[field] = sanitizeString(obj[field]);
      } else {
        sanitized[field] = obj[field];
      }
    }
  });
  return sanitized;
};

// Firebase helpers
const checkDocumentExists = async (collection, docId) => {
  const db = getDb();
  const doc = await db.collection(collection).doc(docId).get();
  return doc.exists;
};

const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

// Sequential ID generator with transaction
const generateSequentialId = async (counterName, prefix, digits = 3) => {
  const db = getDb();
  const year = new Date().getFullYear();
  const counterRef = db.collection('counters').doc(counterName);
  
  return await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    let lastId = 1;
    let currentYear = year;
    
    if (counterDoc.exists) {
      const data = counterDoc.data();
      lastId = data.lastId + 1;
      currentYear = data.year;
      
      // Reset counter if year changed
      if (currentYear !== year) {
        lastId = 1;
        currentYear = year;
      }
    }
    
    const yearSuffix = year.toString().slice(-2);
    const sequence = String(lastId).padStart(digits, '0');
    const id = `${prefix}${yearSuffix}${sequence}`;
    
    // Update counter
    transaction.set(counterRef, {
      lastId: lastId,
      year: currentYear,
      updatedAt: new Date()
    });
    
    return id;
  });
};

// Pagination helper
const createPaginatedQuery = (baseQuery, limit = 20, startAfter = null) => {
  let query = baseQuery.limit(limit);
  if (startAfter) {
    query = query.startAfter(startAfter);
  }
  return query;
};

// Parse query parameters
const parseQueryParams = (req) => {
  const {
    limit = 20,
    page = 1,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = '',
    filter = {}
  } = req.query;

  return {
    limit: Math.min(parseInt(limit) || 20, 100), // Max 100 items per page
    page: Math.max(parseInt(page) || 1, 1),
    sortBy: sanitizeString(sortBy),
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    search: sanitizeString(search),
    filter: typeof filter === 'string' ? JSON.parse(filter) : filter
  };
};

module.exports = {
  getDb,
  handleResponse,
  handleError,
  validateRequired,
  validateString,
  validateEmail,
  sanitizeString,
  sanitizeObject,
  checkDocumentExists,
  generateId,
  generateSequentialId,
  createPaginatedQuery,
  parseQueryParams
}; 