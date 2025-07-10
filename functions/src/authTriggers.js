/* eslint-disable linebreak-style, no-trailing-spaces, eol-last, comma-dangle, indent, padded-blocks */
// Disabled linebreak-style to accommodate Windows CRLF; trailing spaces & eol-last also suppressed for this file.
const {onRequest} = require('firebase-functions/v2/https');
const cors = require('cors')({origin: true});
const admin = require('firebase-admin');
const {getDb, generateSequentialId, handleResponse, handleError} = require('./utils/helpers');

// HTTP function to create customer document when user signs up
// Called from frontend after successful Firebase Auth signup
exports.createCustomerOnSignup = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return handleError(res, 'Method not allowed', 405);
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
        displayName: decodedToken.name || decodedToken.email
      };

      const db = getDb();

  // Skip if user has no email (anonymous, phone-only, etc.)
  if (!user.email) {
    return handleError(res, 'User has no email address', 400);
  }

  const email = user.email.toLowerCase();

  // Check if a customer doc with this email already exists
  const existingSnap = await db.collection('customers').where('email', '==', email).limit(1).get();
  if (!existingSnap.empty) {
    return handleResponse(res, {message: 'Customer document already exists', customerId: existingSnap.docs[0].id}, 200);
  }

      // Generate sequential customerId (e.g., CUS240001)
      const customerId = await generateSequentialId('customers', 'CUS', 4);

      const displayName = user.displayName || email;
      const now = new Date();

      // Build searchable keywords
      const keywords = new Set();
      displayName.toLowerCase().split(' ').forEach((k) => keywords.add(k));
      keywords.add(displayName.toLowerCase());
      keywords.add(email);

      const customerData = {
        customerId,
        name: displayName,
        email,
        isActive: true,
        joinDate: now.toISOString(),
        createdAt: now,
        updatedAt: now,
        createdBy: {
          uid: user.uid,
          email: email,
          displayName: displayName,
        },
        updatedBy: {
          uid: user.uid,
          email: email,
          displayName: displayName,
        },
        search: {
          keywords: Array.from(keywords),
          slug: displayName.toLowerCase().replace(/\s+/g, '-'),
          metaTitle: `Customer: ${displayName}`,
          metaDescription: `Customer profile for ${displayName}`,
        },
      };

      await db.collection('customers').doc(customerId).set(customerData);

      console.log(`✅ Customer document ${customerId} created for new user ${user.uid} (${email})`);
      
      return handleResponse(res, {
        message: 'Customer document created successfully',
        customerId: customerId,
        customerData: {
          customerId,
          name: displayName,
          email,
          isActive: true
        }
      }, 201);
      
    } catch (error) {
      console.error('Error creating customer on signup:', error);
      return handleError(res, `Failed to create customer: ${error.message}`, 500);
    }
  });
}); 