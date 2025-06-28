const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString,
  generateSequentialId 
} = require("./utils/helpers");
const { uploadImageFromBase64, deleteImage } = require("./services/imageService");

// Main spaces function that handles all space routes
const spaces = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      // Route handling
      if (method === 'GET') {
        if (pathParts.length === 0) {
          // GET /spaces
          return await getAllSpaces(req, res);
        } else if (pathParts.length === 1) {
          // GET /spaces/:id
          return await getSpaceById(pathParts[0], req, res);
        }
      } else if (method === 'POST') {
        if (pathParts.length === 0) {
          // POST /spaces
          return await createSpace(req, res);
        } else if (pathParts.length === 2 && pathParts[1] === 'upload-images') {
          // POST /spaces/:id/upload-images
          return await uploadSpaceImages(pathParts[0], req, res);
        }
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /spaces/:id
        return await updateSpace(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /spaces/:id
        return await deleteSpace(pathParts[0], req, res);
      }

      // 404 for unknown routes
      handleResponse(res, { message: 'Space route not found' }, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// Validation function for space data
const validateSpaceData = (data, isUpdate = false) => {
  console.log('🔍 validateSpaceData called with:', JSON.stringify(data, null, 2));
  const errors = [];
  
  // Basic required fields validation
  if (!isUpdate && !data.name) errors.push('Name is required');
  if (!isUpdate && !data.brand) errors.push('Brand is required');
  if (!isUpdate && !data.location) errors.push('Location is required');
  
  // Name validation
  if (data.name && (data.name.length < 2 || data.name.length > 100)) {
    errors.push('Name must be between 2 and 100 characters');
  }
  
  // Brand validation
  if (data.brand && !['NextSpace', 'UnionSpace', 'CoSpace'].includes(data.brand)) {
    errors.push('Brand must be one of: NextSpace, UnionSpace, CoSpace');
  }
  
  // Location validation
  if (data.location) {
    if (!data.location.address || data.location.address.length < 5) {
      errors.push('Address must be at least 5 characters');
    }
    if (!data.location.city || data.location.city.length < 2) {
      errors.push('City must be at least 2 characters');
    }
    if (!data.location.province || data.location.province.length < 2) {
      errors.push('Province must be at least 2 characters');
    }
    if (data.location.latitude && (data.location.latitude < -90 || data.location.latitude > 90)) {
      errors.push('Latitude must be between -90 and 90');
    }
    if (data.location.longitude && (data.location.longitude < -180 || data.location.longitude > 180)) {
      errors.push('Longitude must be between -180 and 180');
    }
  }
  
  console.log('🔍 validateSpaceData returning errors:', errors);
  return errors;
};

// Data sanitization function
const sanitizeSpaceData = (data) => {
  const sanitized = {};
  
  // Sanitize strings
  if (data.name) sanitized.name = sanitizeString(data.name);
  if (data.description) sanitized.description = sanitizeString(data.description);
  if (data.brand) sanitized.brand = sanitizeString(data.brand);
  
  // Sanitize location
  if (data.location) {
    sanitized.location = {
      address: data.location.address ? sanitizeString(data.location.address) : '',
      city: data.location.city ? sanitizeString(data.location.city) : '',
      province: data.location.province ? sanitizeString(data.location.province) : '',
      postalCode: data.location.postalCode ? sanitizeString(data.location.postalCode) : '',
      country: data.location.country ? sanitizeString(data.location.country) : 'Indonesia',
      coordinates: data.location.coordinates || null,
      latitude: data.location.latitude ? parseFloat(data.location.latitude) : null,
      longitude: data.location.longitude ? parseFloat(data.location.longitude) : null
    };
  }
  
  if (data.images) {
    sanitized.images = Array.isArray(data.images) ? data.images : [];
  }
  
  // Boolean values
  if (data.isActive !== undefined) {
    sanitized.isActive = Boolean(data.isActive);
  }
  
  // Operating hours
  if (data.operatingHours) {
    sanitized.operatingHours = data.operatingHours;
  }
  
  return sanitized;
};

// Check if city exists and create if needed
const findOrCreateCity = async (locationData) => {
  const db = getDb();
  try {
    const cityName = locationData.city;
    const provinceName = locationData.province;
    
    // First, try to find existing city
    const citySnapshot = await db.collection('cities')
      .where('name', '==', cityName)
      .limit(1)
      .get();
    
    if (!citySnapshot.empty) {
      console.log(`✅ Found existing city: ${cityName}`);
      return citySnapshot.docs[0].id;
    }
    
    // If city doesn't exist, create it
    console.log(`🏗️ Creating new city: ${cityName}`);
    
    const cityId = await generateSequentialId('cities', 'CTY', 3);
    const searchKeywords = [
      cityName.toLowerCase(),
      provinceName.toLowerCase(),
      ...(cityName.split(' ').map(word => word.toLowerCase())),
      ...(provinceName.split(' ').map(word => word.toLowerCase()))
    ];

    const cityData = {
      cityId,
      name: cityName,
      province: provinceName,
      country: locationData.country || 'Indonesia',
      postalCodes: locationData.postalCode ? [locationData.postalCode] : [],
      timezone: 'Asia/Jakarta',
      utcOffset: '+07:00',
      statistics: {
        totalSpaces: 0,
        activeSpaces: 0,
        totalOrders: 0,
        totalRevenue: 0
      },
      search: {
        keywords: searchKeywords,
        aliases: []
      },
      thumbnail: null,
      isActive: true,
      createdBy: 'auto-create',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('cities').add(cityData);
    console.log(`✅ Created new city: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error in findOrCreateCity:', error);
    throw error;
  }
};

// Generate search keywords
const generateSearchKeywords = (spaceData) => {
  const keywords = new Set();
  
  if (spaceData.name) {
    keywords.add(spaceData.name.toLowerCase());
    spaceData.name.split(' ').forEach(word => keywords.add(word.toLowerCase()));
  }
  
  if (spaceData.brand) {
    keywords.add(spaceData.brand.toLowerCase());
  }
  
  if (spaceData.location) {
    if (spaceData.location.city) keywords.add(spaceData.location.city.toLowerCase());
    if (spaceData.location.province) keywords.add(spaceData.location.province.toLowerCase());
    if (spaceData.location.address) {
      spaceData.location.address.split(' ').forEach(word => keywords.add(word.toLowerCase()));
    }
  }
  
  return Array.from(keywords);
};

// GET /spaces
const getAllSpaces = async (req, res) => {
  try {
    const db = getDb();
    const { search, city, brand, status, limit, category } = req.query;
    let spacesRef = db.collection('spaces');

    // Build query
    if (city) {
      spacesRef = spacesRef.where('location.city', '==', city);
    }
    
    if (brand) {
      spacesRef = spacesRef.where('brand', '==', brand);
    }
    
    if (status === 'active') {
      spacesRef = spacesRef.where('isActive', '==', true);
    } else if (status === 'inactive') {
      spacesRef = spacesRef.where('isActive', '==', false);
    }
    
    if (category) {
      spacesRef = spacesRef.where('category', '==', category);
    }

    // Order by creation date
    spacesRef = spacesRef.orderBy('createdAt', 'desc');

    // Execute query
    const snapshot = await spacesRef.get();
    let spaces = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      spaces.push({
        id: doc.id,
        ...data,
        // Frontend-compatible fields
        status: data.isActive ? 'active' : 'inactive'
      });
    });

    // Apply client-side filtering for search
    if (search) {
      const searchLower = search.toLowerCase();
      spaces = spaces.filter(space =>
        space.name.toLowerCase().includes(searchLower) ||
        space.description?.toLowerCase().includes(searchLower) ||
        space.location?.city?.toLowerCase().includes(searchLower) ||
        space.location?.address?.toLowerCase().includes(searchLower) ||
        space.brand?.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    if (limit) {
      spaces = spaces.slice(0, parseInt(limit));
    }

    handleResponse(res, {
      spaces,
      total: spaces.length
    });
  } catch (error) {
    console.error('Error fetching spaces:', error);
    handleError(res, error);
  }
};

// GET /spaces/:id
const getSpaceById = async (spaceId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('spaces').doc(spaceId).get();
    
    if (!doc.exists) {
      return handleResponse(res, { message: 'Space not found' }, 404);
    }

    const data = doc.data();
    const spaceData = {
      id: doc.id,
      ...data,
      status: data.isActive ? 'active' : 'inactive'
    };

    handleResponse(res, spaceData);
  } catch (error) {
    console.error('Error fetching space:', error);
    handleError(res, error);
  }
};

// POST /spaces
const createSpace = async (req, res) => {
  try {
    const db = getDb();
    console.log('🔍 Backend: Received create space request:', req.body);
    
    // Validate request data
    const validationErrors = validateSpaceData(req.body);
    if (validationErrors.length > 0) {
      return handleResponse(res, { 
        message: 'Validation failed', 
        errors: validationErrors 
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizeSpaceData(req.body);
    
    // Find or create city
    const cityDocId = await findOrCreateCity(sanitizedData.location);
    
    // Generate space ID
    const spaceId = await generateSequentialId('spaces', 'SPC', 3);
    
    // Generate search keywords
    const searchKeywords = generateSearchKeywords(sanitizedData);

    const spaceData = {
      spaceId,
      name: sanitizedData.name,
      description: sanitizedData.description || '',
      brand: sanitizedData.brand,
      location: sanitizedData.location,
      images: sanitizedData.images || [],
      category: req.body.category || 'General',
      operatingHours: sanitizedData.operatingHours || {
        monday: '09:00-18:00',
        tuesday: '09:00-18:00',
        wednesday: '09:00-18:00',
        thursday: '09:00-18:00',
        friday: '09:00-18:00',
        saturday: '09:00-17:00',
        sunday: 'Closed'
      },
      search: {
        keywords: searchKeywords
      },
      isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true,
      createdBy: req.body.createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('spaces').add(spaceData);
    
    // Update city statistics
    await updateCityStatistics(sanitizedData.location.city);

    console.log(`✅ Space created: ${docRef.id} - ${sanitizedData.name}`);

    handleResponse(res, {
      id: docRef.id,
      ...spaceData
    }, 201);
  } catch (error) {
    console.error('Error creating space:', error);
    handleError(res, error);
  }
};

// PUT /spaces/:id
const updateSpace = async (spaceId, req, res) => {
  try {
    const db = getDb();
    
    // Check if space exists
    const spaceDoc = await db.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return handleResponse(res, { message: 'Space not found' }, 404);
    }

    // Validate update data
    const validationErrors = validateSpaceData(req.body, true);
    if (validationErrors.length > 0) {
      return handleResponse(res, { 
        message: 'Validation failed', 
        errors: validationErrors 
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizeSpaceData(req.body);
    const existingData = spaceDoc.data();
    
    // Update search keywords if relevant fields changed
    if (sanitizedData.name || sanitizedData.location) {
      const updatedSpaceData = { ...existingData, ...sanitizedData };
      sanitizedData.search = {
        keywords: generateSearchKeywords(updatedSpaceData)
      };
    }

    sanitizedData.updatedAt = new Date();

    await db.collection('spaces').doc(spaceId).update(sanitizedData);

    // Update city statistics if city changed
    if (sanitizedData.location?.city && sanitizedData.location.city !== existingData.location?.city) {
      await Promise.all([
        updateCityStatistics(sanitizedData.location.city),
        updateCityStatistics(existingData.location.city)
      ]);
    }

    // Get updated document
    const updatedDoc = await db.collection('spaces').doc(spaceId).get();
    const data = updatedDoc.data();

    console.log(`✅ Space updated: ${spaceId} - ${data.name}`);

    handleResponse(res, {
      id: spaceId,
      ...data
    });
  } catch (error) {
    console.error('Error updating space:', error);
    handleError(res, error);
  }
};

// DELETE /spaces/:id
const deleteSpace = async (spaceId, req, res) => {
  try {
    const db = getDb();
    
    // Check if space exists
    const spaceDoc = await db.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return handleResponse(res, { message: 'Space not found' }, 404);
    }

    const spaceData = spaceDoc.data();

    // Delete all images associated with the space
    if (spaceData.images && spaceData.images.length > 0) {
      await Promise.all(
        spaceData.images.map(imageUrl => deleteImage(imageUrl))
      );
    }

    await db.collection('spaces').doc(spaceId).delete();

    // Update city statistics
    if (spaceData.location?.city) {
      await updateCityStatistics(spaceData.location.city);
    }

    console.log(`✅ Space deleted: ${spaceId} - ${spaceData.name}`);

    handleResponse(res, { message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Error deleting space:', error);
    handleError(res, error);
  }
};

// POST /spaces/:id/upload-images
const uploadSpaceImages = async (spaceId, req, res) => {
  try {
    const db = getDb();
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return handleResponse(res, { message: 'No images provided' }, 400);
    }

    // Check if space exists
    const spaceDoc = await db.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return handleResponse(res, { message: 'Space not found' }, 404);
    }

    // Upload all images
    const uploadResults = [];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const result = await uploadImageFromBase64(
        image.data,
        image.name || `space_${spaceId}_${i}`,
        'spaces'
      );
      uploadResults.push(result.url);
    }

    // Update space document with new image URLs
    const existingImages = spaceDoc.data().images || [];
    const allImages = [...existingImages, ...uploadResults];

    await db.collection('spaces').doc(spaceId).update({
      images: allImages,
      updatedAt: new Date()
    });

    console.log(`✅ Successfully uploaded ${uploadResults.length} images for space ${spaceId}`);

    handleResponse(res, {
      uploadedImages: uploadResults,
      allImages: allImages,
      count: uploadResults.length
    });
  } catch (error) {
    console.error('Error uploading space images:', error);
    handleError(res, error);
  }
};

// Update city statistics
const updateCityStatistics = async (cityName) => {
  try {
    const db = getDb();
    
    // Find city by name
    const citySnapshot = await db.collection('cities')
      .where('name', '==', cityName)
      .limit(1)
      .get();
    
    if (citySnapshot.empty) {
      console.warn(`City not found for statistics update: ${cityName}`);
      return;
    }
    
    const cityDoc = citySnapshot.docs[0];
    const cityId = cityDoc.id;
    
    // Count spaces in this city
    const spacesSnapshot = await db.collection('spaces')
      .where('location.city', '==', cityName)
      .get();
    
    const totalSpaces = spacesSnapshot.size;
    const activeSpaces = spacesSnapshot.docs.filter(doc => doc.data().isActive).length;
    
    // Update city statistics
    await db.collection('cities').doc(cityId).update({
      'statistics.totalSpaces': totalSpaces,
      'statistics.activeSpaces': activeSpaces,
      updatedAt: new Date()
    });
    
    console.log(`✅ Updated statistics for city ${cityName}: ${totalSpaces} total, ${activeSpaces} active`);
  } catch (error) {
    console.error('Error updating city statistics:', error);
    // Don't throw error, just log it
  }
};

module.exports = { spaces }; 