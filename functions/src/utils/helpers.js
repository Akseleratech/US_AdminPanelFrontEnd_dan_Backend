const admin = require('firebase-admin');
const {
  handleError: secureHandleError,
  handleResponse: secureHandleResponse,
  handleValidationError,
  handleAuthError,
  handleRateLimitError,
} = require('./errorHandler');

// Get Firestore instance
const getDb = () => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
};

// Common response handler - use secure version
const handleResponse = (res, data, statusCode = 200, message = null) => {
  return secureHandleResponse(res, data, statusCode, message);
};

// Error handler - use secure version
const handleError = (res, error, statusCode = 500, req = null) => {
  return secureHandleError(res, error, statusCode, req);
};

// Validation helpers
const validateRequired = (data, fields) => {
  const missing = fields.filter((field) => !data[field]);
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
  allowedFields.forEach((field) => {
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
      updatedAt: new Date(),
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
    filter = {},
  } = query;

  return {
    limit: Math.min(parseInt(limit) || 20, 100), // Max 100 items per page
    page: Math.max(parseInt(page) || 1, 1),
    sortBy: sanitizeString(sortBy),
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    search: sanitizeString(search),
    filter: typeof filter === 'string' ? JSON.parse(filter) : filter,
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
      displayName: decodedToken.name || decodedToken.email,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

// Check if user is admin by looking up in Firestore
const checkIsAdmin = async (uid) => {
  try {
    const db = getDb();
    const adminDoc = await db.collection('admins').doc(uid).get();
    return adminDoc.exists && adminDoc.data()?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Middleware to require admin authentication
const requireAdmin = async (req, res, next) => {
  try {
    const token = verifyAuthToken(req);
    if (!token) {
      return handleAuthError(res, 'Authentication required', req);
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return handleAuthError(res, 'Invalid authentication token', req);
    }

    const isAdmin = await checkIsAdmin(user.uid);
    if (!isAdmin) {
      return handleError(res, 'Admin access required', 403, req);
    }

    // Attach user info to request for use in handlers
    req.user = user;
    req.isAdmin = true;

    if (next) {
      next();
    } else {
      return true; // For non-express usage
    }
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

// Simpler version that just returns boolean for inline usage
const verifyAdminAuth = async (req) => {
  try {
    const token = verifyAuthToken(req);
    if (!token) return false;

    const user = await getUserFromToken(token);
    if (!user) return false;

    return await checkIsAdmin(user.uid);
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return false;
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
    'GEN': 'General/Umum',
  };
  return labels[serviceType] || serviceType;
};

// Generate structured OrderID: ORD-YYYYMMDD-SRC-XXXX (service type removed)
const generateStructuredOrderId = async (source = 'manual') => {
  const db = getDb();
  const now = new Date();

  // Format date as YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

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
    const orderId = `ORD-${dateStr}-${sourceCode}-${sequenceStr}`;

    // Update counter
    transaction.set(counterRef, {
      lastSequence: sequence,
      updatedAt: new Date(),
      year: year,
      month: month,
    });

    return orderId;
  });
};

// Parse structured OrderID components (supports old 5-part and new 4-part format)
const parseOrderId = (orderId) => {
  if (!orderId || !orderId.startsWith('ORD-')) {
    return null;
  }

  const parts = orderId.split('-');

  // Old format: ORD-YYYYMMDD-SVC-SRC-XXXX (5 parts)
  if (parts.length === 5) {
    const [prefix, date, serviceType, source, sequence] = parts;
    return {
      prefix,
      date,
      serviceType,
      serviceTypeLabel: getServiceTypeLabel(serviceType),
      source,
      sourceLabel: source === 'APP' ? 'Mobile App' : 'Manual/CRM',
      sequence,
      full: orderId,
    };
  }

  // New format: ORD-YYYYMMDD-SRC-XXXX (4 parts)
  if (parts.length === 4) {
    const [prefix, date, source, sequence] = parts;
    return {
      prefix,
      date,
      serviceType: null,
      serviceTypeLabel: null,
      source,
      sourceLabel: source === 'APP' ? 'Mobile App' : 'Manual/CRM',
      sequence,
      full: orderId,
    };
  }

  return null;
};

// Get current tax rate from settings
const getCurrentTaxRate = async () => {
  try {
    const db = getDb();
    const docSnap = await db.collection('settings').doc('global').get();

    if (docSnap.exists) {
      const data = docSnap.data();
      // Convert percentage to decimal (e.g., 11% -> 0.11)
      return (data.taxRate || 11) / 100;
    }

    // Fallback to 11% if no settings found
    return 0.11;
  } catch (error) {
    console.error('Error getting tax rate:', error);
    // Fallback to 11% on error
    return 0.11;
  }
};

// Helper to get user role and managed city for the authenticated user
const getUserRoleAndCity = async (req) => {
  try {
    const token = verifyAuthToken(req);
    if (!token) return {role: null, cityId: null};

    const user = await getUserFromToken(token);
    if (!user) return {role: null, cityId: null};

    const db = getDb();
    const adminDoc = await db.collection('admins').doc(user.uid).get();
    if (!adminDoc.exists) return {role: null, cityId: null};

    const data = adminDoc.data();
    return {
      role: data.role || null,
      cityId: data.cityId || null,
    };
  } catch (error) {
    console.error('Error in getUserRoleAndCity:', error);
    return {role: null, cityId: null};
  }
};

module.exports = {
  getDb,
  handleResponse,
  handleError,
  handleValidationError,
  handleAuthError,
  handleRateLimitError,
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
  checkIsAdmin,
  requireAdmin,
  verifyAdminAuth,
  getServiceTypeCode,
  getServiceTypeLabel,
  generateStructuredOrderId,
  parseOrderId,
  getCurrentTaxRate,
  getUserRoleAndCity,
  _getUserRoleAndCity: getUserRoleAndCity, // Alias for backward compatibility
};
