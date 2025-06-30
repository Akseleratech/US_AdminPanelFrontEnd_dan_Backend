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
const parseQueryParams = (query = {}) => {
  const {
    limit = 20,
    page = 1,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = '',
    filter = {}
  } = query;

  return {
    limit: Math.min(parseInt(limit) || 20, 100), // Max 100 items per page
    page: Math.max(parseInt(page) || 1, 1),
    sortBy: sanitizeString(sortBy),
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    search: sanitizeString(search),
    filter: typeof filter === 'string' ? JSON.parse(filter) : filter
  };
};

// Auth helpers
const verifyAuthToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split('Bearer ')[1];
};

const getUserFromToken = async (token) => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.email
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

// Helper function to get service type code
const getServiceTypeCode = (serviceName) => {
  if (!serviceName) return 'GEN';
  
  const name = serviceName.toLowerCase();
  
  if (name.includes('meeting') || name.includes('rapat')) return 'MTG';
  if (name.includes('workspace') || name.includes('kerja') || name.includes('coworking')) return 'WRK';
  if (name.includes('event') || name.includes('acara')) return 'EVT';
  if (name.includes('conference') || name.includes('konferensi')) return 'CFR';
  if (name.includes('training') || name.includes('pelatihan')) return 'TRN';
  if (name.includes('seminar')) return 'SEM';
  if (name.includes('workshop')) return 'WSP';
  
  return 'GEN'; // General/Umum as default
};

// Helper function to convert service type codes to readable labels
const getServiceTypeLabel = (serviceType) => {
  const labels = {
    'MTG': 'Meeting/Rapat',
    'WRK': 'Workspace/Kerja',
    'EVT': 'Event/Acara',
    'CFR': 'Conference/Konferensi',
    'TRN': 'Training/Pelatihan',
    'SEM': 'Seminar',
    'WSP': 'Workshop',
    'GEN': 'General/Umum'
  };
  return labels[serviceType] || serviceType;
};

// Generate structured OrderID: ORD-YYYYMMDD-SVC-SRC-XXXX
const generateStructuredOrderId = async (serviceName, source = 'manual') => {
  const db = getDb();
  const now = new Date();
  
  // Format date as YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Get service type code
  const serviceCode = getServiceTypeCode(serviceName);
  
  // Get source code
  const sourceCode = source === 'mobile' || source === 'app' ? 'APP' : 'MAN';
  
  // Generate sequence number (reset monthly)
  const counterName = `orders_${year}_${month}`;
  const counterRef = db.collection('counters').doc(counterName);
  
  return await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    let sequence = 1;
    if (counterDoc.exists) {
      sequence = (counterDoc.data().lastSequence || 0) + 1;
    }
    
    const sequenceStr = String(sequence).padStart(4, '0');
    const orderId = `ORD-${dateStr}-${serviceCode}-${sourceCode}-${sequenceStr}`;
    
    // Update counter
    transaction.set(counterRef, {
      lastSequence: sequence,
      updatedAt: new Date(),
      year: year,
      month: month
    });
    
    return orderId;
  });
};

// Parse structured OrderID components
const parseOrderId = (orderId) => {
  if (!orderId || !orderId.startsWith('ORD-')) {
    return null;
  }
  
  const parts = orderId.split('-');
  if (parts.length !== 5) {
    return null;
  }
  
  const [prefix, date, serviceType, source, sequence] = parts;
  
  return {
    prefix,
    date,
    serviceType,
    serviceTypeLabel: getServiceTypeLabel(serviceType),
    source,
    sourceLabel: source === 'APP' ? 'Mobile App' : 'Manual/CRM',
    sequence,
    full: orderId
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
  parseQueryParams,
  verifyAuthToken,
  getUserFromToken,
  getServiceTypeCode,
  getServiceTypeLabel,
  generateStructuredOrderId,
  parseOrderId
}; 