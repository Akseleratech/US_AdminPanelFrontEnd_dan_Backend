const {onRequest} = require('firebase-functions/v2/https');
const cors = require('./utils/corsConfig');
const admin = require('firebase-admin');
const {
  getDb,
  handleResponse,
  handleError,
  sanitizeString,
  parseQueryParams,
  verifyAdminAuth,
  _getUserRoleAndCity,
} = require('./utils/helpers');
const {
  handleValidationError,
} = require('./utils/errorHandler');

// Middleware to get user info from auth token
const getUserFromToken = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.email,
    };
  } catch (error) {
    console.warn('Failed to verify auth token:', error.message);
    return null;
  }
};

// Enhanced validation function for customers
function validateCustomerData(data, isUpdate = false) {
  const errors = [];

  // Basic required fields validation
  if (!isUpdate && !data.name) errors.push('Name is required');
  if (!isUpdate && !data.email) errors.push('Email is required');

  // Name validation
  if (data.name && (data.name.length < 2 || data.name.length > 100)) {
    errors.push('Name must be between 2 and 100 characters');
  }

  // Email validation
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Please enter a valid email address');
    }
    if (data.email.length > 255) {
      errors.push('Email must be less than 255 characters');
    }
  }

  // Phone validation
  if (data.phone && data.phone.length > 50) {
    errors.push('Phone number must be less than 50 characters');
  }

  // Gender validation
  if (data.gender) {
    const allowedGenders = ['male', 'female', 'other', 'prefer not to say'];
    if (!allowedGenders.includes(String(data.gender).toLowerCase())) {
      errors.push('Gender must be male, female, or other');
    }
  }

  // Date of birth validation
  if (data.dateOfBirth) {
    const date = new Date(data.dateOfBirth);
    if (isNaN(date.getTime())) {
      errors.push('Please enter a valid date of birth');
    }
    const today = new Date();
    if (date > today) {
      errors.push('Date of birth cannot be in the future');
    }
  }

  return errors;
}

// Sanitize and format customer data
function sanitizeCustomerData(data) {
  const sanitized = {
    name: sanitizeString(data.name),
    email: sanitizeString(data.email)?.toLowerCase(),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
  };

  // Optional fields
  if (data.phone) sanitized.phone = sanitizeString(data.phone);
  if (data.gender) sanitized.gender = sanitizeString(data.gender).toLowerCase();
  if (data.dateOfBirth) sanitized.dateOfBirth = data.dateOfBirth;
  if (data.notes) sanitized.notes = sanitizeString(data.notes);
  if (data.tags && Array.isArray(data.tags)) sanitized.tags = data.tags;

  return sanitized;
}

// Check for duplicate customer email
async function checkDuplicateEmail(email, excludeId = null) {
  try {
    const db = getDb();
    const query = db.collection('customers').where('email', '==', email.toLowerCase());

    const snapshot = await query.get();

    if (excludeId) {
      // Filter out the current customer being updated
      return snapshot.docs.some((doc) => doc.id !== excludeId);
    }

    return !snapshot.empty;
  } catch (error) {
    console.warn('Could not check for duplicate email:', error);
    return false; // Allow if check fails
  }
}

// Generate sequential customer ID
async function generateSequentialCustomerId() {
  try {
    const db = getDb();
    const year = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('customers');

    const result = await db.runTransaction(async (transaction) => {
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
      const sequence = String(lastId).padStart(4, '0');
      const customerId = `CUS${yearSuffix}${sequence}`;

      // Update counter
      transaction.set(counterRef, {
        lastId: lastId,
        year: currentYear,
        updatedAt: new Date(),
      });

      return customerId;
    });

    console.log(`✅ Generated sequential customer ID: ${result}`);
    return result;
  } catch (error) {
    console.error('Error generating sequential customer ID:', error);
    const fallbackId = `CUS${Date.now().toString().slice(-7)}`;
    console.log(`⚠️  Using fallback ID: ${fallbackId}`);
    return fallbackId;
  }
}

// Generate search keywords for customers
function generateCustomerSearchKeywords(customerData) {
  const keywords = [];

  // Add name keywords
  if (customerData.name) {
    keywords.push(customerData.name.toLowerCase());
    keywords.push(...customerData.name.toLowerCase().split(' '));
  }

  // Add email keywords
  if (customerData.email) {
    keywords.push(customerData.email.toLowerCase());
    const emailParts = customerData.email.split('@');
    if (emailParts.length === 2) {
      keywords.push(emailParts[0].toLowerCase());
      keywords.push(emailParts[1].toLowerCase());
    }
  }

  // Add phone keywords (numbers only)
  if (customerData.phone) {
    const phoneNumbers = customerData.phone.replace(/\D/g, '');
    if (phoneNumbers) {
      keywords.push(phoneNumbers);
    }
  }

  // Remove duplicates and empty strings
  return [...new Set(keywords.filter((keyword) => keyword && keyword.length > 1))];
}

// Main customers function that handles all customer routes
const customers = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const {method, url} = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter((part) => part);
      if (pathParts[0] === 'api') pathParts.shift();

      // NEW: Remove resource name ('customers') if present so that route parsing works for root endpoints
      if (pathParts[0] === 'customers') pathParts.shift();

      // Enhanced logging for debugging routing issues
      console.log(`[CUSTOMERS ROUTER] Received request: ${method} ${url}`);
      console.log(`[CUSTOMERS ROUTER] Parsed path parts:`, pathParts);

      // Route handling
      if (method === 'GET') {
        if (pathParts.length === 0) {
          // GET /customers
          return await getAllCustomers(req, res);
        } else if (pathParts.length === 1) {
          const identifier = pathParts[0];

          // Special routes
          if (identifier === 'search') {
            return await searchCustomers(req, res);
          } else if (identifier === 'active') {
            return await getActiveCustomers(req, res);
          } else if (identifier === 'statistics') {
            return await getCustomerStatistics(req, res);
          } else {
            // GET /customers/:id
            return await getCustomerById(identifier, req, res);
          }
        }
      } else if (method === 'POST') {
        // Require admin auth for all POST operations
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleError(res, 'Admin access required', 403, req);
        }

        if (pathParts.length === 0) {
          // POST /customers
          return await createCustomer(req, res);
        } else if (pathParts.length === 1 && pathParts[0] === 'migrate') {
          // POST /customers/migrate
          return await migrateCustomers(req, res);
        }
      } else if (method === 'PUT') {
        // PUT /customers/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleError(res, 'Admin access required', 403, req);
        }

        if (pathParts.length === 1) {
          const customerId = pathParts[0];
          return await updateCustomer(customerId, req, res);
        }
      } else if (method === 'DELETE') {
        // DELETE /customers/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleError(res, 'Admin access required', 403, req);
        }

        if (pathParts.length === 1) {
          const customerId = pathParts[0];
          return await deleteCustomer(customerId, req, res);
        }
      }

      // If no route matches
      return handleError(res, `Route not found: ${method} ${path}`, 404, req);
    } catch (error) {
      console.error('[CUSTOMERS ROUTER] Unhandled error:', error);
      return handleError(res, 'Internal server error', 500, req);
    }
  });
});

// GET all customers
const getAllCustomers = async (req, res) => {
  try {
    console.log('[GET /customers] Fetching all customers');

    const db = getDb();
    const {limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc', ...filters} = parseQueryParams(req.query);

    let query = db.collection('customers');

    // Apply filters
    if (filters.isActive !== undefined) {
      query = query.where('isActive', '==', filters.isActive === 'true');
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Apply pagination
    query = query.limit(parseInt(limit)).offset(parseInt(offset));

    const snapshot = await query.get();
    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      joinDate: doc.data().joinDate?.toDate?.()?.toISOString() || doc.data().joinDate,
    }));

    const result = {
      customers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: customers.length === parseInt(limit),
      },
    };

    console.log(`✅ Retrieved ${customers.length} customers.`);
    return handleResponse(res, result, 200);
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    return handleError(res, error, 500, req);
  }
};

// GET single customer by ID
const getCustomerById = async (customerId, req, res) => {
  try {
    console.log(`[GET /customers/${customerId}] Fetching customer by ID`);

    const db = getDb();
    const customerDoc = await db.collection('customers').doc(customerId).get();

    if (!customerDoc.exists) {
      return handleError(res, 'Customer not found', 404, req);
    }

    const customerData = {
      id: customerDoc.id,
      ...customerDoc.data(),
      createdAt: customerDoc.data().createdAt?.toDate?.()?.toISOString() || customerDoc.data().createdAt,
      updatedAt: customerDoc.data().updatedAt?.toDate?.()?.toISOString() || customerDoc.data().updatedAt,
      joinDate: customerDoc.data().joinDate?.toDate?.()?.toISOString() || customerDoc.data().joinDate,
    };

    console.log(`✅ Retrieved customer: ${customerData.name}`);
    return handleResponse(res, customerData, 200, 'Customer retrieved successfully');
  } catch (error) {
    console.error(`Error in getCustomerById for ${customerId}:`, error);
    return handleError(res, error, 500, req);
  }
};

// CREATE new customer
const createCustomer = async (req, res) => {
  try {
    console.log('[POST /customers] Creating new customer');
    console.log('Request body:', req.body);

    // Get user info from auth token
    const user = await getUserFromToken(req);
    console.log('Authenticated user:', user);

    // Validate required fields
    const validationErrors = validateCustomerData(req.body);
    if (validationErrors.length > 0) {
      return handleValidationError(res, validationErrors.map(error => ({ message: error })), req);
    }

    // Check for duplicate email
    const isDuplicate = await checkDuplicateEmail(req.body.email);
    if (isDuplicate) {
      return handleError(res, 'A customer with this email already exists', 409, req);
    }

    // Sanitize input data
    const sanitizedData = sanitizeCustomerData(req.body);

    // Generate sequential customer ID
    const customerId = await generateSequentialCustomerId();

    // Generate search keywords
    const searchKeywords = generateCustomerSearchKeywords(sanitizedData);

    // Prepare customer document with user tracking
    const customerData = {
      ...sanitizedData,
      customerId,
      joinDate: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      } : null,
      updatedBy: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      } : null,
      search: {
        keywords: searchKeywords,
        slug: sanitizedData.name.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: `Customer: ${sanitizedData.name}`,
        metaDescription: `Customer profile for ${sanitizedData.name}`,
      },
    };

    // Save to database using customerId as document ID
    const db = getDb();
    await db.collection('customers').doc(customerId).set(customerData);

    // Get the created document
    const createdDoc = await db.collection('customers').doc(customerId).get();
    const result = {
      id: customerId, // Use customerId as document ID
      ...createdDoc.data(),
      createdAt: createdDoc.data().createdAt?.toDate?.()?.toISOString() || createdDoc.data().createdAt,
      updatedAt: createdDoc.data().updatedAt?.toDate?.()?.toISOString() || createdDoc.data().updatedAt,
    };

    console.log(`✅ Created customer: ${result.name} (${result.customerId}) by ${user?.displayName || 'Unknown'}`);
    return handleResponse(res, result, 201);
  } catch (error) {
    console.error('Error in createCustomer:', error);
    return handleError(res, error, 500, req);
  }
};

// UPDATE existing customer
const updateCustomer = async (customerId, req, res) => {
  try {
    console.log(`[PUT /customers/${customerId}] Updating customer`);
    console.log('Request body:', req.body);

    // Get user info from auth token
    const user = await getUserFromToken(req);
    console.log('Authenticated user:', user);

    const db = getDb();

    // Check if customer exists
    const customerDoc = await db.collection('customers').doc(customerId).get();
    if (!customerDoc.exists) {
      return handleError(res, 'Customer not found', 404, req);
    }

    // Validate updated data
    const validationErrors = validateCustomerData(req.body, true);
    if (validationErrors.length > 0) {
      return handleValidationError(res, validationErrors.map(error => ({ message: error })), req);
    }

    // Check for duplicate email (excluding current customer)
    if (req.body.email) {
      const isDuplicate = await checkDuplicateEmail(req.body.email, customerId);
      if (isDuplicate) {
        return handleError(res, 'A customer with this email already exists', 409, req);
      }
    }

    // Sanitize input data
    const sanitizedData = sanitizeCustomerData(req.body);

    // Generate updated search keywords
    const existingData = customerDoc.data();
    const mergedData = {...existingData, ...sanitizedData};
    const searchKeywords = generateCustomerSearchKeywords(mergedData);

    // Prepare update data with user tracking
    const updateData = {
      ...sanitizedData,
      updatedAt: new Date(),
      updatedBy: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      } : null,
      search: {
        keywords: searchKeywords,
        slug: mergedData.name.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: `Customer: ${mergedData.name}`,
        metaDescription: `Customer profile for ${mergedData.name}`,
      },
    };

    // Update document
    await db.collection('customers').doc(customerId).update(updateData);

    // Get updated document
    const updatedDoc = await db.collection('customers').doc(customerId).get();
    const responseData = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data().createdAt?.toDate?.()?.toISOString() || updatedDoc.data().createdAt,
      updatedAt: updatedDoc.data().updatedAt?.toDate?.()?.toISOString() || updatedDoc.data().updatedAt,
      joinDate: updatedDoc.data().joinDate?.toDate?.()?.toISOString() || updatedDoc.data().joinDate,
    };

    console.log(`✅ Customer ${customerId} updated successfully by ${user?.displayName || 'Unknown'}.`);
    return handleResponse(res, responseData, 200, 'Customer updated successfully');
  } catch (error) {
    console.error(`Error in updateCustomer for ${customerId}:`, error);
    return handleError(res, error, 500, req);
  }
};

// DELETE customer
const deleteCustomer = async (customerId, req, res) => {
  try {
    console.log(`[DELETE /customers/${customerId}] Deleting customer`);

    // Get user info from auth token
    const user = await getUserFromToken(req);
    console.log('Authenticated user:', user);

    const db = getDb();

    // Check if customer exists and get data first
    const customerDoc = await db.collection('customers').doc(customerId).get();
    if (!customerDoc.exists) {
      return handleError(res, 'Customer not found', 404, req);
    }

    const customerData = customerDoc.data();
    console.log(`🗑️ Deleting customer: ${customerData.name} by ${user?.displayName || 'Unknown'}`);

    // Delete the customer document
    await db.collection('customers').doc(customerId).delete();

    console.log(`✅ Customer deleted: ${customerData.name} (${customerId}) by ${user?.displayName || 'Unknown'}`);
    return handleResponse(res, {id: customerId}, 200, 'Customer deleted successfully');
  } catch (error) {
    console.error(`Error in deleteCustomer for ${customerId}:`, error);
    return handleError(res, error, 500, req);
  }
};

// SEARCH customers
const searchCustomers = async (req, res) => {
  try {
    console.log('[GET /customers/search] Searching customers');

    const {search, limit = 50, offset = 0, ...filters} = parseQueryParams(req.query);

    if (!search) {
      return handleValidationError(res, [{ field: 'search', message: 'Search term is required' }], req);
    }

    const db = getDb();

    // For simple search, we'll use array-contains-any on search keywords
    const searchTerms = search.toLowerCase().split(' ').filter((term) => term.length > 1);

    let query = db.collection('customers')
        .where('search.keywords', 'array-contains-any', searchTerms);

    // Apply additional filters
    if (filters.isActive !== undefined) {
      query = query.where('isActive', '==', filters.isActive === 'true');
    }

    // Apply sorting and pagination
    query = query.orderBy('updatedAt', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

    const snapshot = await query.get();
    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      joinDate: doc.data().joinDate?.toDate?.()?.toISOString() || doc.data().joinDate,
    }));

    const result = {
      customers,
      searchTerm: search,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: customers.length === parseInt(limit),
      },
    };

    console.log(`✅ Found ${customers.length} customers matching "${search}"`);
    return handleResponse(res, result, 200, 'Customer search completed');
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    return handleError(res, error, 500, req);
  }
};

// GET active customers
const getActiveCustomers = async (req, res) => {
  try {
    console.log('[GET /customers/active] Fetching active customers');

    const db = getDb();
    const {limit = 100, offset = 0} = parseQueryParams(req.query);

    const query = db.collection('customers')
        .where('isActive', '==', true)
        .orderBy('name', 'asc')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

    const snapshot = await query.get();
    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      joinDate: doc.data().joinDate?.toDate?.()?.toISOString() || doc.data().joinDate,
    }));

    console.log(`✅ Retrieved ${customers.length} active customers`);
    return handleResponse(res, {customers}, 200, 'Active customers retrieved successfully');
  } catch (error) {
    console.error('Error in getActiveCustomers:', error);
    return handleError(res, error, 500, req);
  }
};

// GET customer statistics
const getCustomerStatistics = async (req, res) => {
  try {
    console.log('[GET /customers/statistics] Calculating customer statistics');

    const db = getDb();

    // Get all customers
    const customersSnapshot = await db.collection('customers').get();
    const customers = customersSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.isActive).length;
    const inactiveCustomers = totalCustomers - activeCustomers;

    // Calculate join dates distribution (last 12 months)
    const monthlyJoins = {};
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = month.toISOString().substring(0, 7); // YYYY-MM format
      monthlyJoins[monthKey] = 0;
    }

    customers.forEach((customer) => {
      if (customer.joinDate) {
        const joinMonth = customer.joinDate.substring(0, 7);
        if (monthlyJoins.hasOwnProperty(joinMonth)) {
          monthlyJoins[joinMonth]++;
        }
      }
    });

    const statistics = {
      total: totalCustomers,
      active: activeCustomers,
      inactive: inactiveCustomers,
      monthlyJoins,
    };

    console.log('✅ Customer statistics calculated');
    return handleResponse(res, statistics, 200, 'Customer statistics retrieved successfully');
  } catch (error) {
    console.error('Error in getCustomerStatistics:', error);
    return handleError(res, error, 500, req);
  }
};

// POST /customers/migrate - Migrate existing customers to new structure
const migrateCustomers = async (req, res) => {
  try {
    const db = getDb();
    console.log('🔄 Starting customers migration...');

    // Get all existing customers
    const customersSnapshot = await db.collection('customers').get();

    if (customersSnapshot.empty) {
      return handleResponse(res, {
        message: 'No customers found to migrate.',
        migratedCount: 0,
      });
    }

    console.log(`📊 Found ${customersSnapshot.size} customers to migrate.`);

    const batch = db.batch();
    const migrationResults = [];

    customersSnapshot.forEach((doc) => {
      const data = doc.data();
      const oldDocId = doc.id;
      const customerId = data.customerId; // Internal customer ID like "CUS250001"

      // Check if migration is needed (document ID != customerId)
      if (customerId && oldDocId !== customerId) {
        // Create new document with customerId as document ID
        const newDocRef = db.collection('customers').doc(customerId);

        // Add to batch: create new document with same data
        batch.set(newDocRef, data);

        // Add to batch: delete old document
        batch.delete(doc.ref);

        migrationResults.push({
          oldDocId,
          newDocId: customerId,
          customerId: customerId,
          customerName: data.name,
        });

        console.log(`📝 Migrating customer: ${oldDocId} -> ${customerId} (${data.name})`);
      } else if (!customerId) {
        console.log(`⚠️  Customer ${oldDocId} missing customerId, skipping migration.`);
      } else {
        console.log(`⚠️  Customer ${oldDocId} already has correct structure, skipping.`);
      }
    });

    if (migrationResults.length > 0) {
      // Execute batch operation
      await batch.commit();
      console.log(`✅ Successfully migrated ${migrationResults.length} customers.`);

      return handleResponse(res, {
        message: `Successfully migrated ${migrationResults.length} customers.`,
        migratedCount: migrationResults.length,
        results: migrationResults,
      });
    } else {
      return handleResponse(res, {
        message: 'All customers already have correct structure.',
        migratedCount: 0,
      });
    }
  } catch (error) {
    console.error('❌ Customer migration failed:', error);
    return handleError(res, error, 500, req);
  }
};

module.exports = {customers};
