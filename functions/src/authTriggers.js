/* eslint-disable linebreak-style, no-trailing-spaces, eol-last, comma-dangle, indent, padded-blocks */
// Disabled linebreak-style to accommodate Windows CRLF; trailing spaces & eol-last also suppressed for this file.
const {onRequest} = require('firebase-functions/v2/https');
const cors = require('cors')({origin: true});
const admin = require('firebase-admin');
const {getDb, generateSequentialId, sanitizeString} = require('./utils/helpers');
const {
  handleResponse,
  handleError,
  handleValidationError: _handleValidationError,
} = require('./utils/errorHandler');
const {applyAccountCreationRateLimit} = require('./utils/applyRateLimit');

// Sanitize and format auth data
function sanitizeAuthData(authData) {
  const sanitized = {};

  if (authData.uid) sanitized.uid = sanitizeString(authData.uid);
  if (authData.email) sanitized.email = sanitizeString(authData.email)?.toLowerCase();
  if (authData.name) sanitized.displayName = sanitizeString(authData.name);
  if (authData.displayName) sanitized.displayName = sanitizeString(authData.displayName);

  // Use email as fallback for displayName if not provided
  if (!sanitized.displayName && sanitized.email) {
    sanitized.displayName = sanitized.email;
  }

  return sanitized;
}

// HTTP function to create customer document when user signs up
// Called from frontend after successful Firebase Auth signup
exports.createCustomerOnSignup = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return handleError(res, 'Method not allowed', 405);
      }

      // Apply rate limiting for account creation
      const rateLimitAllowed = await applyAccountCreationRateLimit(req, res);
      if (!rateLimitAllowed) {
        return; // Rate limit exceeded, response already sent
      }

      // Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return handleError(res, 'No authorization token provided', 401);
      }

      const token = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (error) {
        return handleError(res, 'Invalid authorization token', 401);
      }

      // Sanitize auth data
      const sanitizedUser = sanitizeAuthData({
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        displayName: decodedToken.displayName
      });

      const db = getDb();

      // Skip if user has no email (anonymous, phone-only, etc.)
      if (!sanitizedUser.email) {
        return handleError(res, 'User has no email address', 400);
      }

      const email = sanitizedUser.email;

      // Check if a customer doc with this email already exists
      const existingSnap = await db.collection('customers').where('email', '==', email).limit(1).get();
      if (!existingSnap.empty) {
        return handleResponse(res, {message: 'Customer document already exists', customerId: existingSnap.docs[0].id}, 200);
      }

      // Generate sequential customerId (e.g., CUS240001)
      const customerId = await generateSequentialId('customers', 'CUS', 4);

      const customerDisplayName = sanitizedUser.displayName;
      const now = new Date();

      // Build searchable keywords
      const keywords = new Set();
      customerDisplayName.toLowerCase().split(' ').forEach((k) => keywords.add(k));
      keywords.add(customerDisplayName.toLowerCase());
      keywords.add(email);

      const customerData = {
        customerId,
        name: customerDisplayName,
        email,
        isActive: true,
        joinDate: now.toISOString(),
        createdAt: now,
        updatedAt: now,
        createdBy: {
          uid: sanitizedUser.uid,
          email: email,
          displayName: customerDisplayName,
        },
        updatedBy: {
          uid: sanitizedUser.uid,
          email: email,
          displayName: customerDisplayName,
        },
        search: {
          keywords: Array.from(keywords),
          slug: customerDisplayName.toLowerCase().replace(/\s+/g, '-'),
          metaTitle: `Customer: ${customerDisplayName}`,
          metaDescription: `Customer profile for ${customerDisplayName}`,
        },
      };

      await db.collection('customers').doc(customerId).set(customerData);

      console.log(`✅ Customer document ${customerId} created for new user ${sanitizedUser.uid} (${email})`);
      
      return handleResponse(res, {
        message: 'Customer document created successfully',
        customerId: customerId,
        customerData: {
          customerId,
          name: customerDisplayName,
          email,
          isActive: true
        }
      }, 201);
      
    } catch (error) {
      console.error('Error creating customer on signup:', error);
      return handleError(res, error, 500, req);
    }
  });
});

// HTTP function to get or create customer document for any user
// This function works for both email and phone users
exports.getOrCreateCustomer = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return handleError(res, 'Method not allowed', 405);
      }

      // Apply rate limiting for account creation/login attempts
      const rateLimitAllowed = await applyAccountCreationRateLimit(req, res);
      if (!rateLimitAllowed) {
        return; // Rate limit exceeded, response already sent
      }

      // Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return handleError(res, 'No authorization token provided', 401);
      }

      const token = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (error) {
        return handleError(res, 'Invalid authorization token', 401);
      }

      const user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        phoneNumber: decodedToken.phone_number,
        displayName: decodedToken.name || decodedToken.email || 'User'
      };

      const db = getDb();

      // First, check if customer document already exists by createdBy.uid
      const existingByUid = await db.collection('customers')
        .where('createdBy.uid', '==', user.uid)
        .limit(1)
        .get();

      if (!existingByUid.empty) {
        const existingDoc = existingByUid.docs[0];
        const data = existingDoc.data();
        return handleResponse(res, {
          message: 'Customer document found',
          customerId: existingDoc.id,
          customerData: data,
          exists: true
        }, 200);
      }

      // If no document found by UID, check by email (if user has email)
      if (user.email) {
        const existingByEmail = await db.collection('customers')
          .where('email', '==', user.email.toLowerCase())
          .limit(1)
          .get();

        if (!existingByEmail.empty) {
          const existingDoc = existingByEmail.docs[0];
          const data = existingDoc.data();
          return handleResponse(res, {
            message: 'Customer document found by email',
            customerId: existingDoc.id,
            customerData: data,
            exists: true
          }, 200);
        }
      }

      // If no document exists, create a new one
      const customerId = await generateSequentialId('customers', 'CUS', 4);
      const customerDisplayName = user.displayName || user.email || user.phoneNumber || 'User';
      const now = new Date();

      // Build searchable keywords
      const keywords = new Set();
      customerDisplayName.toLowerCase().split(' ').forEach((k) => keywords.add(k));
      keywords.add(customerDisplayName.toLowerCase());
      if (user.email) keywords.add(user.email.toLowerCase());
      if (user.phoneNumber) keywords.add(user.phoneNumber);

      const customerData = {
        customerId,
        name: customerDisplayName,
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        isActive: true,
        joinDate: now.toISOString(),
        createdAt: now,
        updatedAt: now,
        createdBy: {
          uid: user.uid,
          email: user.email || '',
          displayName: customerDisplayName,
        },
        updatedBy: {
          uid: user.uid,
          email: user.email || '',
          displayName: customerDisplayName,
        },
        search: {
          keywords: Array.from(keywords),
          slug: customerDisplayName.toLowerCase().replace(/\s+/g, '-'),
          metaTitle: `Customer: ${customerDisplayName}`,
          metaDescription: `Customer profile for ${customerDisplayName}`,
        },
      };

      await db.collection('customers').doc(customerId).set(customerData);

      console.log(`✅ Customer document ${customerId} created for user ${user.uid}`);
      
      return handleResponse(res, {
        message: 'Customer document created successfully',
        customerId: customerId,
        customerData: customerData,
        exists: false
      }, 201);
      
    } catch (error) {
      console.error('Error in getOrCreateCustomer:', error);
      return handleError(res, error, 500, req);
    }
  });
});