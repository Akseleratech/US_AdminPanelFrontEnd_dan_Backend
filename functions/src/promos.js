const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString
} = require("./utils/helpers");
const { uploadImageFromBase64, deleteImage } = require("./services/imageService");

// Enhanced validation schema for Promos
const promoValidationSchema = {
  title: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 500 },
  type: { type: 'string', required: true, enum: ['banner', 'section'] },
  image: { type: 'string', required: false },
  isActive: { type: 'boolean', required: false, default: true },
  order: { type: 'number', required: false, default: 0 }
};

// Enhanced validation function for promos
function validatePromoData(data, isUpdate = false) {
  const errors = [];
  
  // Basic required fields validation
  if (!isUpdate && !data.title) errors.push('Title is required');
  if (!isUpdate && !data.type) errors.push('Type is required');
  
  // Title validation
  if (data.title && (data.title.length < 2 || data.title.length > 100)) {
    errors.push('Title must be between 2 and 100 characters');
  }
  
  // Type validation
  if (data.type && !['banner', 'section'].includes(data.type)) {
    errors.push('Type must be either "banner" or "section"');
  }
  
  // Description validation
  if (data.description && data.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }
  
  // Order validation
  if (data.order && (typeof data.order !== 'number' || data.order < 0)) {
    errors.push('Order must be a non-negative number');
  }
  
  return errors;
}

// Enhanced data sanitization function for promos
function sanitizePromoData(data) {
  const sanitized = {};
  
  // Sanitize strings
  if (data.title) sanitized.title = data.title.trim();
  if (data.description) sanitized.description = data.description.trim();
  if (data.type) sanitized.type = data.type.trim();
  if (data.image) sanitized.image = data.image.trim();
  
  // Boolean and number values
  if (data.isActive !== undefined) {
    sanitized.isActive = Boolean(data.isActive);
  }
  
  if (data.order !== undefined) {
    sanitized.order = parseInt(data.order) || 0;
  }
  
  return sanitized;
}

// Generate sequential promo ID
async function generateSequentialPromoId() {
  try {
    const db = getDb();
    const year = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('promos');
    
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
      const sequence = String(lastId).padStart(3, '0');
      const promoId = `PROMO${yearSuffix}${sequence}`;
      
      // Update counter
      transaction.set(counterRef, {
        lastId: lastId,
        year: currentYear,
        updatedAt: new Date()
      });
      
      return promoId;
    });
    
    console.log(`✅ Generated sequential promo ID: ${result}`);
    return result;
    
  } catch (error) {
    console.error('Error generating sequential promo ID:', error);
    const fallbackId = `PROMO${Date.now().toString().slice(-6)}`;
    console.log(`⚠️  Using fallback ID: ${fallbackId}`);
    return fallbackId;
  }
}

// Generate search keywords for promos
function generatePromoSearchKeywords(promoData) {
  const keywords = [];
  
  // Add title keywords
  if (promoData.title) {
    keywords.push(promoData.title.toLowerCase());
    keywords.push(...promoData.title.toLowerCase().split(' '));
  }
  
  // Add type keywords
  if (promoData.type) {
    keywords.push(promoData.type.toLowerCase());
  }
  
  // Add description keywords
  if (promoData.description) {
    const descWords = promoData.description.toLowerCase().split(' ').filter(word => word.length > 2);
    keywords.push(...descWords.slice(0, 10)); // Limit to first 10 meaningful words
  }
  
  // Remove duplicates and empty strings
  return [...new Set(keywords.filter(keyword => keyword && keyword.length > 0))];
}

// Main promos function
const promos = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      if (method === 'GET') {
        if (pathParts.length === 0) {
          return await getAllPromos(req, res);
        } else if (pathParts.length === 1) {
          return await getPromoById(pathParts[0], req, res);
        }
      } else if (method === 'POST') {
        if (pathParts.length === 0) {
          return await createPromo(req, res);
        } else if (pathParts.length === 2 && pathParts[1] === 'upload-image') {
          return await uploadPromoImage(pathParts[0], req, res);
        }
      } else if (method === 'PUT' && pathParts.length === 1) {
        return await updatePromo(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        return await deletePromo(pathParts[0], req, res);
      }

      handleResponse(res, { message: 'Promo route not found' }, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /promos
const getAllPromos = async (req, res) => {
  try {
    const db = getDb();
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      isActive = '',
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    let query = db.collection('promos');

    // Apply filters
    if (type) {
      query = query.where('type', '==', type);
    }

    if (isActive !== '') {
      query = query.where('isActive', '==', isActive === 'true');
    }

    // Apply search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.where('searchKeywords', 'array-contains', searchLower);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    const snapshot = await query.get();
    let promos = [];

    snapshot.forEach(doc => {
      promos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedPromos = promos.slice(offset, offset + parseInt(limit));

    handleResponse(res, {
      promos: paginatedPromos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: promos.length,
        totalPages: Math.ceil(promos.length / parseInt(limit))
      },
      total: promos.length
    });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /promos/:id
const getPromoById = async (promoId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('promos').doc(promoId).get();
    
    if (!doc.exists) {
      return handleResponse(res, { message: 'Promo not found' }, 404);
    }

    handleResponse(res, { id: doc.id, ...doc.data() });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /promos
const createPromo = async (req, res) => {
  try {
    const db = getDb();
    console.log('🎯 POST /promos - Request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Validate data
    const validationErrors = validatePromoData(req.body);
    if (validationErrors.length > 0) {
      console.log('❌ Validation failed:', validationErrors);
      return handleResponse(res, {
        message: 'Validation failed',
        errors: validationErrors
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizePromoData(req.body);
    console.log('✅ Data sanitized:', JSON.stringify(sanitizedData, null, 2));

    // Generate promo ID
    const promoId = await generateSequentialPromoId();

    // Prepare promo data
    const promoData = {
      promoId,
      ...sanitizedData,
      searchKeywords: generatePromoSearchKeywords(sanitizedData),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      },
      isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true,
      order: sanitizedData.order || 0
    };

    console.log('💾 Saving promo data:', JSON.stringify(promoData, null, 2));

    // Save to Firestore using structured ID as document ID
    await db.collection('promos').doc(promoId).set(promoData);

    console.log(`✅ Promo created successfully with ID: ${promoId}`);

    handleResponse(res, {
      id: promoId,
      ...promoData
    }, 201);
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /promos/:id
const updatePromo = async (promoId, req, res) => {
  try {
    const db = getDb();
    console.log(`🎯 PUT /promos/${promoId} - Request received`);
    
    const promoDoc = await db.collection('promos').doc(promoId).get();
    if (!promoDoc.exists) {
      return handleResponse(res, { message: 'Promo not found' }, 404);
    }

    // Validate data
    const validationErrors = validatePromoData(req.body, true);
    if (validationErrors.length > 0) {
      return handleResponse(res, {
        message: 'Validation failed',
        errors: validationErrors
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizePromoData(req.body);

    const existingData = promoDoc.data();

    // Prepare update data
    const updateData = {
      ...sanitizedData,
      searchKeywords: generatePromoSearchKeywords({
        ...existingData,
        ...sanitizedData
      }),
      metadata: {
        ...existingData.metadata,
        updatedAt: new Date(),
        version: (existingData.metadata?.version || 1) + 1
      }
    };

    // Update in Firestore
    await db.collection('promos').doc(promoId).update(updateData);

    // Get updated promo
    const updatedDoc = await db.collection('promos').doc(promoId).get();
    const updatedPromo = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    handleResponse(res, updatedPromo);
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /promos/:id
const deletePromo = async (promoId, req, res) => {
  try {
    const db = getDb();
    
    const promoDoc = await db.collection('promos').doc(promoId).get();
    if (!promoDoc.exists) {
      return handleResponse(res, { message: 'Promo not found' }, 404);
    }

    const promoData = promoDoc.data();

    // Delete associated image if exists
    if (promoData.image) {
      await deleteImage(promoData.image);
    }

    await db.collection('promos').doc(promoId).delete();

    handleResponse(res, { message: 'Promo deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /promos/:id/upload-image
const uploadPromoImage = async (promoId, req, res) => {
  try {
    const db = getDb();
    const { imageData, fileName } = req.body;

    if (!imageData) {
      return handleResponse(res, { message: 'No image data provided' }, 400);
    }

    // Check if promo exists
    const promoDoc = await db.collection('promos').doc(promoId).get();
    if (!promoDoc.exists) {
      return handleResponse(res, { message: 'Promo not found' }, 404);
    }

    const promoData = promoDoc.data();

    // Delete existing image if any
    if (promoData.image) {
      await deleteImage(promoData.image);
    }

    // Upload new image
    const uploadResult = await uploadImageFromBase64(
      imageData, 
      fileName || `promo_${promoId}`, 
      'promos'
    );

    // Update promo document with new image URL
    await db.collection('promos').doc(promoId).update({
      image: uploadResult.url,
      metadata: {
        ...promoData.metadata,
        updatedAt: new Date(),
        version: (promoData.metadata?.version || 1) + 1
      }
    });

    console.log(`✅ Successfully updated promo ${promoId} with image: ${uploadResult.url}`);

    handleResponse(res, {
      image: uploadResult.url,
      filename: uploadResult.filename
    });
  } catch (error) {
    console.error('Error uploading promo image:', error);
    handleError(res, error);
  }
};

module.exports = { promos }; 