const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString
} = require("./utils/helpers");

// Enhanced validation schema for Buildings
const buildingValidationSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 1000 },
  brand: { type: 'string', required: true, enum: ['NextSpace', 'UnionSpace', 'CoSpace'] },
  location: {
    type: 'object',
    required: true,
    properties: {
      address: { type: 'string', required: true, minLength: 5 },
      city: { type: 'string', required: true, minLength: 2 },
      province: { type: 'string', required: true, minLength: 2 },
      postalCode: { type: 'string', required: false },
      country: { type: 'string', required: true, default: 'Indonesia' },
      latitude: { type: 'number', required: false, min: -90, max: 90 },
      longitude: { type: 'number', required: false, min: -180, max: 180 }
    }
  }
};

// Enhanced validation function for buildings
function validateBuildingData(data, isUpdate = false) {
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
    if (!data.location.country || data.location.country.length < 2) {
      errors.push('Country is required');
    }
    if (data.location.latitude && (data.location.latitude < -90 || data.location.latitude > 90)) {
      errors.push('Latitude must be between -90 and 90');
    }
    if (data.location.longitude && (data.location.longitude < -180 || data.location.longitude > 180)) {
      errors.push('Longitude must be between -180 and 180');
    }
  }
  
  return errors;
}

// Enhanced data sanitization function for buildings
function sanitizeBuildingData(data) {
  const sanitized = {};
  
  // Sanitize strings
  if (data.name) sanitized.name = data.name.trim();
  if (data.description) sanitized.description = data.description.trim();
  if (data.brand) sanitized.brand = data.brand.trim();
  
  // Sanitize location
  if (data.location) {
    sanitized.location = {
      address: data.location.address?.trim(),
      city: data.location.city?.trim(),
      province: data.location.province?.trim(),
      postalCode: data.location.postalCode?.trim() || '',
      country: data.location.country?.trim() || 'Indonesia',
      coordinates: data.location.coordinates || null,
      latitude: data.location.latitude ? parseFloat(data.location.latitude) : null,
      longitude: data.location.longitude ? parseFloat(data.location.longitude) : null
    };
  }
  
  // Boolean values
  if (data.isActive !== undefined) {
    sanitized.isActive = Boolean(data.isActive);
  }
  
  return sanitized;
}

// Check for duplicate building names in same city
async function checkDuplicateBuilding(name, city, excludeId = null) {
  try {
    const db = getDb();
    let query = db.collection('buildings')
      .where('name', '==', name)
      .where('location.city', '==', city);
    
    const snapshot = await query.get();
    
    if (excludeId) {
      // Filter out the current building being updated
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.warn('Could not check for duplicate buildings:', error);
    return false; // Allow if check fails
  }
}

// Generate sequential building ID
async function generateSequentialBuildingId() {
  try {
    const db = getDb();
    const year = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('buildings');
    
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
      const buildingId = `BLD${yearSuffix}${sequence}`;
      
      // Update counter
      transaction.set(counterRef, {
        lastId: lastId,
        year: currentYear,
        updatedAt: new Date()
      });
      
      return buildingId;
    });
    
    console.log(`✅ Generated sequential building ID: ${result}`);
    return result;
    
  } catch (error) {
    console.error('Error generating sequential building ID:', error);
    const fallbackId = `BLD${Date.now().toString().slice(-6)}`;
    console.log(`⚠️  Using fallback ID: ${fallbackId}`);
    return fallbackId;
  }
}

// Generate search keywords for buildings
function generateBuildingSearchKeywords(buildingData) {
  const keywords = [];
  
  // Add name keywords
  if (buildingData.name) {
    keywords.push(buildingData.name.toLowerCase());
    keywords.push(...buildingData.name.toLowerCase().split(' '));
  }
  
  // Add brand keywords
  if (buildingData.brand) {
    keywords.push(buildingData.brand.toLowerCase());
  }
  
  // Add location keywords
  if (buildingData.location) {
    if (buildingData.location.city) {
      keywords.push(buildingData.location.city.toLowerCase());
    }
    if (buildingData.location.province) {
      keywords.push(buildingData.location.province.toLowerCase());
    }
    if (buildingData.location.country) {
      keywords.push(buildingData.location.country.toLowerCase());
    }
    if (buildingData.location.address) {
      keywords.push(...buildingData.location.address.toLowerCase().split(' '));
    }
  }
  
  // Remove duplicates and empty strings
  return [...new Set(keywords.filter(keyword => keyword && keyword.length > 1))];
}

// Find or create city automatically
async function findOrCreateCity(locationData) {
  try {
    const db = getDb();
    const cityName = locationData.city;
    const provinceName = locationData.province;
    const countryName = locationData.country || 'Indonesia';
    
    // Check if city already exists
    const citySnapshot = await db.collection('cities')
      .where('name', '==', cityName)
      .where('province', '==', provinceName)
      .limit(1)
      .get();
    
    if (!citySnapshot.empty) {
      console.log(`✅ City ${cityName} already exists`);
      return citySnapshot.docs[0].id;
    }
    
    // Generate city ID
    const year = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('cities');
    
    const cityId = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let lastId = 1;
      let currentYear = year;
      
      if (counterDoc.exists) {
        const data = counterDoc.data();
        lastId = data.lastId + 1;
        currentYear = data.year;
        
        if (currentYear !== year) {
          lastId = 1;
          currentYear = year;
        }
      }
      
      const yearSuffix = year.toString().slice(-2);
      const sequence = String(lastId).padStart(3, '0');
      const generatedCityId = `CIT${yearSuffix}${sequence}`;
      
      transaction.set(counterRef, {
        lastId: lastId,
        year: currentYear,
        updatedAt: new Date()
      });
      
      return generatedCityId;
    });
    
    // Create new city
    const cityData = {
      cityId,
      name: cityName,
      province: provinceName,
      country: countryName,
      statistics: {
        totalSpaces: 0,
        totalBuildings: 0,
        activeBuildings: 0
      },
      search: {
        keywords: [cityName.toLowerCase(), provinceName.toLowerCase()],
        aliases: []
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Use structured ID as document ID
    await db.collection('cities').doc(cityId).set(cityData);
    console.log(`✅ Created new city: ${cityName} with ID: ${cityId}`);
    
    return cityId;
  } catch (error) {
    console.error('Error in findOrCreateCity:', error);
    throw error;
  }
}

// Update city statistics
async function updateCityStatistics(cityName) {
  try {
    const db = getDb();
    const citySnapshot = await db.collection('cities')
      .where('name', '==', cityName)
      .limit(1)
      .get();
    
    if (citySnapshot.empty) return;
    
    const cityDoc = citySnapshot.docs[0];
    
    // Count buildings and spaces in this city
    const buildingSnapshot = await db.collection('buildings')
      .where('location.city', '==', cityName)
      .get();
    
    const totalBuildings = buildingSnapshot.size;
    const activeBuildings = buildingSnapshot.docs.filter(doc => doc.data().isActive).length;
    
    // Count spaces in this city
    const spaceSnapshot = await db.collection('spaces')
      .where('location.city', '==', cityName)
      .get();
    
    const totalSpaces = spaceSnapshot.size;
    
    await cityDoc.ref.update({
      'statistics.totalBuildings': totalBuildings,
      'statistics.activeBuildings': activeBuildings,
      'statistics.totalSpaces': totalSpaces,
      updatedAt: new Date()
    });
    
    console.log(`✅ Updated statistics for city ${cityName}: ${totalBuildings} buildings, ${totalSpaces} spaces`);
  } catch (error) {
    console.error('Error updating city statistics:', error);
  }
}

// Main buildings function
const buildings = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      if (method === 'GET') {
        if (pathParts.length === 0) {
          return await getAllBuildings(req, res);
        } else if (pathParts.length === 1) {
          return await getBuildingById(pathParts[0], req, res);
        }
      } else if (method === 'POST' && pathParts.length === 0) {
        return await createBuilding(req, res);
      } else if (method === 'PUT' && pathParts.length === 1) {
        return await updateBuilding(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        return await deleteBuilding(pathParts[0], req, res);
      }

      handleResponse(res, { message: 'Building route not found' }, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /buildings
const getAllBuildings = async (req, res) => {
  try {
    const db = getDb();
    const {
      page = 1,
      limit = 10,
      search = '',
      brand = '',
      city = '',
      province = '',
      country = '',
      isActive = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = db.collection('buildings');

    // Apply filters
    if (brand) {
      query = query.where('brand', '==', brand);
    }

    if (city) {
      query = query.where('location.city', '==', city);
    }

    if (province) {
      query = query.where('location.province', '==', province);
    }

    if (country) {
      query = query.where('location.country', '==', country);
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
    let buildings = [];

    snapshot.forEach(doc => {
      buildings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBuildings = buildings.slice(offset, offset + parseInt(limit));

    handleResponse(res, {
      buildings: paginatedBuildings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: buildings.length,
        totalPages: Math.ceil(buildings.length / parseInt(limit))
      },
      total: buildings.length
    });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /buildings/:id
const getBuildingById = async (buildingId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('buildings').doc(buildingId).get();
    
    if (!doc.exists) {
      return handleResponse(res, { message: 'Building not found' }, 404);
    }

    handleResponse(res, { id: doc.id, ...doc.data() });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /buildings
const createBuilding = async (req, res) => {
  try {
    const db = getDb();
    console.log('🏢 POST /buildings - Request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Validate data
    const validationErrors = validateBuildingData(req.body);
    if (validationErrors.length > 0) {
      console.log('❌ Validation failed:', validationErrors);
      return handleResponse(res, {
        message: 'Validation failed',
        errors: validationErrors
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizeBuildingData(req.body);
    console.log('✅ Data sanitized:', JSON.stringify(sanitizedData, null, 2));

    // Check for duplicate building
    const isDuplicate = await checkDuplicateBuilding(
      sanitizedData.name,
      sanitizedData.location.city
    );

    if (isDuplicate) {
      return handleResponse(res, {
        message: 'A building with this name already exists in the same city'
      }, 409);
    }

    // Generate building ID
    const buildingId = await generateSequentialBuildingId();

    // Find or create city
    const cityId = await findOrCreateCity(sanitizedData.location);

    // Prepare building data
    const buildingData = {
      buildingId,
      ...sanitizedData,
      cityId,
      searchKeywords: generateBuildingSearchKeywords(sanitizedData),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      },
      isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true
    };

    console.log('💾 Saving building data:', JSON.stringify(buildingData, null, 2));

    // Save to Firestore using structured ID as document ID
    await db.collection('buildings').doc(buildingId).set(buildingData);

    // Update city statistics
    await updateCityStatistics(sanitizedData.location.city);

    console.log(`✅ Building created successfully with ID: ${buildingId}`);

    handleResponse(res, {
      id: buildingId,
      ...buildingData
    }, 201);
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /buildings/:id
const updateBuilding = async (buildingId, req, res) => {
  try {
    const db = getDb();
    console.log(`🏢 PUT /buildings/${buildingId} - Request received`);
    
    const buildingDoc = await db.collection('buildings').doc(buildingId).get();
    if (!buildingDoc.exists) {
      return handleResponse(res, { message: 'Building not found' }, 404);
    }

    // Validate data
    const validationErrors = validateBuildingData(req.body, true);
    if (validationErrors.length > 0) {
      return handleResponse(res, {
        message: 'Validation failed',
        errors: validationErrors
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizeBuildingData(req.body);

    // Check for duplicate building (excluding current one)
    if (sanitizedData.name && sanitizedData.location?.city) {
      const isDuplicate = await checkDuplicateBuilding(
        sanitizedData.name,
        sanitizedData.location.city,
        buildingId
      );

      if (isDuplicate) {
        return handleResponse(res, {
          message: 'A building with this name already exists in the same city'
        }, 409);
      }
    }

    const existingData = buildingDoc.data();
    const oldCityName = existingData.location?.city;

    // Find or create city if location changed
    let cityId = existingData.cityId;
    if (sanitizedData.location) {
      cityId = await findOrCreateCity(sanitizedData.location);
    }

    // Prepare update data
    const updateData = {
      ...sanitizedData,
      cityId,
      searchKeywords: generateBuildingSearchKeywords({
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
    await db.collection('buildings').doc(buildingId).update(updateData);

    // Update city statistics for both old and new cities
    if (oldCityName) {
      await updateCityStatistics(oldCityName);
    }
    if (sanitizedData.location?.city && sanitizedData.location.city !== oldCityName) {
      await updateCityStatistics(sanitizedData.location.city);
    }

    // Get updated building
    const updatedDoc = await db.collection('buildings').doc(buildingId).get();
    const updatedBuilding = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    handleResponse(res, updatedBuilding);
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /buildings/:id
const deleteBuilding = async (buildingId, req, res) => {
  try {
    const db = getDb();
    
    const buildingDoc = await db.collection('buildings').doc(buildingId).get();
    if (!buildingDoc.exists) {
      return handleResponse(res, { message: 'Building not found' }, 404);
    }

    const buildingData = buildingDoc.data();
    const cityName = buildingData.location?.city;

    await db.collection('buildings').doc(buildingId).delete();

    // Update city statistics
    if (cityName) {
      await updateCityStatistics(cityName);
    }

    handleResponse(res, { message: 'Building deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { buildings }; 