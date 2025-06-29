const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString,
  parseQueryParams,
  generateSequentialId 
} = require("./utils/helpers");
const { uploadImageFromBase64, deleteImage } = require("./services/imageService");

// Enhanced validation function for cities
function validateCityData(data, isUpdate = false) {
  const errors = [];
  
  // Basic required fields validation
  if (!isUpdate && !data.name) errors.push('Name is required');
  if (!isUpdate && !data.province) errors.push('Province is required');
  
  // Name validation
  if (data.name && (data.name.length < 2 || data.name.length > 100)) {
    errors.push('Name must be between 2 and 100 characters');
  }
  
  // Province validation
  if (data.province && (data.province.length < 2 || data.province.length > 100)) {
    errors.push('Province must be between 2 and 100 characters');
  }
  
  // Country validation
  if (data.country && data.country.length < 2) {
    errors.push('Country must be at least 2 characters');
  }
  
  return errors;
}

// Sanitize and format city data
function sanitizeCityData(data) {
  return {
    name: sanitizeString(data.name),
    province: sanitizeString(data.province),
    country: sanitizeString(data.country) || 'Indonesia',
    timezone: sanitizeString(data.timezone) || 'Asia/Jakarta',
    utcOffset: sanitizeString(data.utcOffset) || '+07:00',
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
  };
}

// Check for duplicate city names in same province
async function checkDuplicateCity(name, province, excludeId = null) {
  try {
    const db = getDb();
    let query = db.collection('cities')
      .where('name', '==', name)
      .where('province', '==', province);
    
    const snapshot = await query.get();
    
    if (excludeId) {
      // Filter out the current city being updated
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.warn('Could not check for duplicate cities:', error);
    return false; // Allow if check fails
  }
}

// Generate sequential city ID
async function generateSequentialCityId() {
  try {
    const db = getDb();
    const year = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('cities');
    
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
      const cityId = `CIT${yearSuffix}${sequence}`;
      
      // Update counter
      transaction.set(counterRef, {
        lastId: lastId,
        year: currentYear,
        updatedAt: new Date()
      });
      
      return cityId;
    });
    
    console.log(`✅ Generated sequential city ID: ${result}`);
    return result;
    
  } catch (error) {
    console.error('Error generating sequential city ID:', error);
    const fallbackId = `CIT${Date.now().toString().slice(-6)}`;
    console.log(`⚠️  Using fallback ID: ${fallbackId}`);
    return fallbackId;
  }
}

// Generate search keywords for cities
function generateCitySearchKeywords(cityData) {
  const keywords = [];
  
  // Add name keywords
  if (cityData.name) {
    keywords.push(cityData.name.toLowerCase());
    keywords.push(...cityData.name.toLowerCase().split(' '));
  }
  
  // Add province keywords
  if (cityData.province) {
    keywords.push(cityData.province.toLowerCase());
    keywords.push(...cityData.province.toLowerCase().split(' '));
  }
  
  // Add country keywords
  if (cityData.country) {
    keywords.push(cityData.country.toLowerCase());
  }
  
  // Remove duplicates and empty strings
  return [...new Set(keywords.filter(keyword => keyword && keyword.length > 1))];
}

// Calculate city statistics
async function calculateCityStatistics(cityName) {
  try {
    const db = getDb();
    
    // Count buildings in this city
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
    const activeSpaces = spaceSnapshot.docs.filter(doc => doc.data().isActive).length;
    
    return {
      totalBuildings,
      activeBuildings,
      totalSpaces,
      activeSpaces
    };
  } catch (error) {
    console.error('Error calculating city statistics:', error);
    return {
      totalBuildings: 0,
      activeBuildings: 0,
      totalSpaces: 0,
      activeSpaces: 0
    };
  }
}

// Main cities function that handles all city routes
const cities = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      // Route handling
      if (method === 'GET') {
        if (pathParts.length === 0) {
          // GET /cities
          return await getAllCities(req, res);
        } else if (pathParts.length === 1) {
          // GET /cities/:id
          return await getCityById(pathParts[0], req, res);
        }
      } else if (method === 'POST') {
        if (pathParts.length === 0) {
          // POST /cities
          return await createCity(req, res);
        } else if (pathParts.length === 2 && pathParts[1] === 'upload-image') {
          // POST /cities/:id/upload-image
          return await uploadCityImage(pathParts[0], req, res);
        }
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /cities/:id
        return await updateCity(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /cities/:id
        return await deleteCity(pathParts[0], req, res);
      }

      // 404 for unknown routes
      handleResponse(res, { message: 'City route not found' }, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /cities
const getAllCities = async (req, res) => {
  try {
    const db = getDb();
    const { 
      search = '', 
      status = '', 
      limit = '', 
      featured = '',
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = db.collection('cities');

    // Apply filters
    if (status === 'active') {
      query = query.where('isActive', '==', true);
    } else if (status === 'inactive') {
      query = query.where('isActive', '==', false);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    const snapshot = await query.get();
    let cities = [];

    // Process each city and add frontend-compatible fields
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Calculate real-time statistics
      const statistics = await calculateCityStatistics(data.name);
      
      const cityData = {
        id: doc.id,
        cityId: data.cityId,
        name: data.name,
        province: data.province,
        country: data.country,
        postalCodes: data.postalCodes || [],
        timezone: data.timezone || 'Asia/Jakarta',
        utcOffset: data.utcOffset || '+07:00',
        statistics: {
          ...data.statistics,
          ...statistics // Use real-time calculated statistics
        },
        search: data.search || {
          keywords: generateCitySearchKeywords(data),
          aliases: []
        },
        thumbnail: data.thumbnail || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy || 'system',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // Add frontend-compatible fields
        locations: statistics.totalBuildings, // Jumlah gedung/lokasi
        totalSpaces: statistics.totalSpaces,   // Total ruang/space
        status: data.isActive ? 'active' : 'inactive' // Convert boolean to string
      };
      
      cities.push(cityData);
    }

    // Apply client-side filtering for search (since Firestore has limited text search)
    if (search) {
      const searchLower = search.toLowerCase();
      cities = cities.filter(city =>
        city.name.toLowerCase().includes(searchLower) ||
        city.province?.toLowerCase().includes(searchLower) ||
        city.search?.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower)) ||
        city.search?.aliases?.some(alias => alias.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || cities.length;
    const offset = (pageNum - 1) * limitNum;
    
    if (limit) {
      cities = cities.slice(offset, offset + limitNum);
    }

    handleResponse(res, {
      cities,
      pagination: limit ? {
        page: pageNum,
        limit: limitNum,
        total: cities.length,
        totalPages: Math.ceil(cities.length / limitNum)
      } : undefined,
      total: cities.length
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    handleError(res, error);
  }
};

// GET /cities/:id
const getCityById = async (cityId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('cities').doc(cityId).get();
    
    if (!doc.exists) {
      return handleResponse(res, { message: 'City not found' }, 404);
    }

    const data = doc.data();
    
    // Calculate real-time statistics
    const statistics = await calculateCityStatistics(data.name);
    
    const responseData = {
      id: doc.id,
      cityId: data.cityId,
      name: data.name,
      province: data.province,
      country: data.country,
      timezone: data.timezone || 'Asia/Jakarta',
      utcOffset: data.utcOffset || '+07:00',
      statistics: {
        ...data.statistics,
        ...statistics // Use real-time calculated statistics
      },
      search: data.search || {
        keywords: generateCitySearchKeywords(data),
        aliases: []
      },
      thumbnail: data.thumbnail || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: data.createdBy || 'system',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Add frontend-compatible fields
      locations: statistics.totalBuildings, // Jumlah gedung/lokasi
      totalSpaces: statistics.totalSpaces,   // Total ruang/space
      status: data.isActive ? 'active' : 'inactive' // Convert boolean to string
    };

    handleResponse(res, responseData);
  } catch (error) {
    console.error('Error fetching city:', error);
    handleError(res, error);
  }
};

// POST /cities
const createCity = async (req, res) => {
  try {
    const db = getDb();
    console.log('🏙️ POST /cities - Request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Validate data
    const validationErrors = validateCityData(req.body);
    if (validationErrors.length > 0) {
      console.log('❌ Validation failed:', validationErrors);
      return handleResponse(res, {
        message: 'Validation failed',
        errors: validationErrors
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizeCityData(req.body);
    console.log('✅ Data sanitized:', JSON.stringify(sanitizedData, null, 2));

    // Check for duplicate city
    const isDuplicate = await checkDuplicateCity(
      sanitizedData.name,
      sanitizedData.province
    );

    if (isDuplicate) {
      return handleResponse(res, {
        message: 'A city with this name already exists in the same province'
      }, 409);
    }

    // Generate city ID
    const cityId = await generateSequentialCityId();

    // Calculate initial statistics
    const statistics = await calculateCityStatistics(sanitizedData.name);

    // Prepare city data
    const cityData = {
      cityId,
      ...sanitizedData,
      statistics,
      search: {
        keywords: generateCitySearchKeywords(sanitizedData),
        aliases: []
      },
      thumbnail: null,
      isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true,
      createdBy: req.body.createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Saving city data:', JSON.stringify(cityData, null, 2));

    // Save to Firestore using structured ID as document ID
    await db.collection('cities').doc(cityId).set(cityData);

    console.log(`✅ City created successfully with ID: ${cityId}`);

    // Return with frontend-compatible fields
    const responseData = {
      id: cityId,
      ...cityData,
      locations: statistics.totalSpaces,
      totalSpaces: statistics.totalSpaces,
      status: cityData.isActive ? 'active' : 'inactive'
    };

    handleResponse(res, responseData, 201);
  } catch (error) {
    console.error('Error creating city:', error);
    handleError(res, error);
  }
};

// PUT /cities/:id
const updateCity = async (cityId, req, res) => {
  try {
    const db = getDb();
    console.log(`🏙️ PUT /cities/${cityId} - Request received`);
    
    const cityDoc = await db.collection('cities').doc(cityId).get();
    if (!cityDoc.exists) {
      return handleResponse(res, { message: 'City not found' }, 404);
    }

    // Validate data
    const validationErrors = validateCityData(req.body, true);
    if (validationErrors.length > 0) {
      return handleResponse(res, {
        message: 'Validation failed',
        errors: validationErrors
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizeCityData(req.body);

    // Check for duplicate city (excluding current one)
    if (sanitizedData.name && sanitizedData.province) {
      const isDuplicate = await checkDuplicateCity(
        sanitizedData.name,
        sanitizedData.province,
        cityId
      );

      if (isDuplicate) {
        return handleResponse(res, {
          message: 'A city with this name already exists in the same province'
        }, 409);
      }
    }

    const existingData = cityDoc.data();

    // Calculate updated statistics
    const statistics = await calculateCityStatistics(sanitizedData.name || existingData.name);

    // Prepare update data
    const updateData = {
      ...sanitizedData,
      statistics,
      search: {
        keywords: generateCitySearchKeywords({
          ...existingData,
          ...sanitizedData
        }),
        aliases: existingData.search?.aliases || []
      },
      updatedAt: new Date()
    };

    // Update in Firestore
    await db.collection('cities').doc(cityId).update(updateData);

    // Get updated city
    const updatedDoc = await db.collection('cities').doc(cityId).get();
    const updatedData = updatedDoc.data();
    
    const responseData = {
      id: updatedDoc.id,
      ...updatedData,
      locations: statistics.totalSpaces,
      totalSpaces: statistics.totalSpaces,
      status: updatedData.isActive ? 'active' : 'inactive'
    };

    handleResponse(res, responseData);
  } catch (error) {
    console.error('Error updating city:', error);
    handleError(res, error);
  }
};

// DELETE /cities/:id
const deleteCity = async (cityId, req, res) => {
  try {
    const db = getDb();
    
    console.log(`🗑️ DELETE /cities/${cityId} - Request received`);
    
    const cityDoc = await db.collection('cities').doc(cityId).get();
    if (!cityDoc.exists) {
      return handleResponse(res, { message: 'City not found' }, 404);
    }

    const cityData = cityDoc.data();
    console.log(`🏙️ Attempting to delete city: ${cityData.name}`);

    // Enhanced check for buildings and spaces with exact match
    console.log('🔍 Checking for buildings with exact city name match...');
    const buildingSnapshot = await db.collection('buildings')
      .where('location.city', '==', cityData.name)
      .get();

    console.log('🔍 Checking for spaces with exact city name match...');
    const spaceSnapshot = await db.collection('spaces')
      .where('location.city', '==', cityData.name)
      .get();

    console.log(`📊 Found ${buildingSnapshot.size} buildings and ${spaceSnapshot.size} spaces`);

    // Also check for case-insensitive matches and partial matches to be extra safe
    console.log('🔍 Double-checking with broader search...');
    const allBuildingsSnapshot = await db.collection('buildings').get();
    const allSpacesSnapshot = await db.collection('spaces').get();

    const relatedBuildings = [];
    const relatedSpaces = [];

    allBuildingsSnapshot.forEach(doc => {
      const building = doc.data();
      const buildingCity = building.location?.city || '';
      
      // Exact match
      if (buildingCity === cityData.name) {
        relatedBuildings.push(building);
      }
      // Case-insensitive match
      else if (buildingCity.toLowerCase() === cityData.name.toLowerCase()) {
        relatedBuildings.push(building);
      }
      // Partial match (to catch potential data inconsistencies)
      else if (buildingCity.toLowerCase().includes(cityData.name.toLowerCase()) || 
               cityData.name.toLowerCase().includes(buildingCity.toLowerCase())) {
        console.log(`⚠️ Potential related building found: "${building.name}" in "${buildingCity}"`);
      }
    });

    allSpacesSnapshot.forEach(doc => {
      const space = doc.data();
      const spaceCity = space.location?.city || '';
      
      // Exact match
      if (spaceCity === cityData.name) {
        relatedSpaces.push(space);
      }
      // Case-insensitive match
      else if (spaceCity.toLowerCase() === cityData.name.toLowerCase()) {
        relatedSpaces.push(space);
      }
      // Partial match (to catch potential data inconsistencies)
      else if (spaceCity.toLowerCase().includes(cityData.name.toLowerCase()) || 
               cityData.name.toLowerCase().includes(spaceCity.toLowerCase())) {
        console.log(`⚠️ Potential related space found: "${space.name}" in "${spaceCity}"`);
      }
    });

    console.log(`📊 Enhanced check found ${relatedBuildings.length} buildings and ${relatedSpaces.length} spaces`);

    if (relatedBuildings.length > 0 || relatedSpaces.length > 0) {
      console.log('❌ Cannot delete city - has related buildings or spaces:');
      relatedBuildings.forEach(building => {
        console.log(`   Building: ${building.name} in "${building.location?.city}"`);
      });
      relatedSpaces.forEach(space => {
        console.log(`   Space: ${space.name} in "${space.location?.city}"`);
      });

      return handleResponse(res, {
        message: 'Cannot delete city that has buildings or spaces',
        details: {
          buildingCount: relatedBuildings.length,
          spaceCount: relatedSpaces.length
        }
      }, 409);
    }

    // Safe to delete
    console.log('✅ City has no related buildings or spaces, proceeding with deletion');
    await db.collection('cities').doc(cityId).delete();

    console.log(`✅ City deleted successfully: ${cityData.name}`);
    handleResponse(res, { message: 'City deleted successfully' });
  } catch (error) {
    console.error('Error deleting city:', error);
    handleError(res, error);
  }
};

// POST /cities/:id/upload-image
const uploadCityImage = async (cityId, req, res) => {
  try {
    const db = getDb();
    const { imageData, fileName } = req.body;

    if (!imageData) {
      return handleResponse(res, { message: 'No image data provided' }, 400);
    }

    // Check if city exists
    const cityDoc = await db.collection('cities').doc(cityId).get();
    if (!cityDoc.exists) {
      return handleResponse(res, { message: 'City not found' }, 404);
    }

    const cityData = cityDoc.data();

    // Delete existing thumbnail if any
    if (cityData.thumbnail) {
      await deleteImage(cityData.thumbnail);
    }

    // Upload new image
    const uploadResult = await uploadImageFromBase64(
      imageData, 
      fileName || `city_${cityId}`, 
      'cities'
    );

    // Update city document with new thumbnail URL
    await db.collection('cities').doc(cityId).update({
      thumbnail: uploadResult.url,
      updatedAt: new Date()
    });

    console.log(`✅ Successfully updated city ${cityId} with thumbnail: ${uploadResult.url}`);

    handleResponse(res, {
      thumbnail: uploadResult.url,
      filename: uploadResult.filename
    });
  } catch (error) {
    console.error('Error uploading city image:', error);
    handleError(res, error);
  }
};

module.exports = { cities }; 