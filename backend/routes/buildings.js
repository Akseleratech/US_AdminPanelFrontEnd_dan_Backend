// Load environment variables
require('dotenv').config();

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Validation schema for Buildings (simplified - no category, capacity, pricing, amenities)
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

// Data validation function for buildings
function validateBuildingData(data, isUpdate = false) {
  console.log('🏢 validateBuildingData called with:', JSON.stringify(data, null, 2));
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
  
  console.log('🏢 validateBuildingData returning errors:', errors);
  return errors;
}

// Data sanitization function for buildings
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

// Helper function to generate sequential building ID
async function generateSequentialBuildingId() {
  try {
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
      
      const yearSuffix = year.toString().slice(-2); // Last 2 digits of year
      const sequence = String(lastId).padStart(3, '0'); // 3-digit sequence with leading zeros
      const buildingId = `BLD${yearSuffix}${sequence}`; // Format: BLD25001
      
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
    // Fallback to timestamp-based ID if sequential fails
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
  }
  
  // Remove duplicates
  return [...new Set(keywords)];
}

// Find or create city
async function findOrCreateCity(locationData) {
  try {
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
    
    // Create new city
    const cityData = {
      name: cityName,
      province: provinceName,
      country: countryName,
      createdAt: new Date(),
      updatedAt: new Date(),
      buildingCount: 0,
      isActive: true
    };
    
    const cityRef = await db.collection('cities').add(cityData);
    console.log(`✅ Created new city: ${cityName} with ID: ${cityRef.id}`);
    
    return cityRef.id;
  } catch (error) {
    console.error('Error in findOrCreateCity:', error);
    throw error;
  }
}

// Update city statistics
async function updateCityStatistics(cityName) {
  try {
    const citySnapshot = await db.collection('cities')
      .where('name', '==', cityName)
      .limit(1)
      .get();
    
    if (citySnapshot.empty) return;
    
    const cityDoc = citySnapshot.docs[0];
    const buildingCount = await db.collection('buildings')
      .where('location.city', '==', cityName)
      .where('isActive', '==', true)
      .get();
    
    await cityDoc.ref.update({
      buildingCount: buildingCount.size,
      updatedAt: new Date()
    });
    
    console.log(`✅ Updated city statistics for ${cityName}: ${buildingCount.size} buildings`);
  } catch (error) {
    console.error('Error updating city statistics:', error);
  }
}

// GET /api/buildings - Get all buildings with filtering and pagination
router.get('/', async (req, res) => {
  try {
    console.log('🏢 GET /api/buildings - Request received');
    console.log('Query params:', req.query);
    
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
    
    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;
    
    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));
    
    const snapshot = await query.get();
    
    const buildings = [];
    snapshot.forEach(doc => {
      buildings.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const response = {
      buildings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
    
    console.log(`✅ Retrieved ${buildings.length} buildings`);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buildings',
      error: error.message
    });
  }
});

// GET /api/buildings/:id - Get building by ID
router.get('/:id', async (req, res) => {
  try {
    const buildingId = req.params.id;
    console.log(`🏢 GET /api/buildings/${buildingId} - Request received`);
    
    const doc = await db.collection('buildings').doc(buildingId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }
    
    const building = {
      id: doc.id,
      ...doc.data()
    };
    
    console.log(`✅ Retrieved building: ${building.name}`);
    res.status(200).json({
      success: true,
      building
    });
    
  } catch (error) {
    console.error('Error fetching building:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch building',
      error: error.message
    });
  }
});

// POST /api/buildings - Create new building
router.post('/', async (req, res) => {
  try {
    console.log('🏢 POST /api/buildings - Request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate data
    const validationErrors = validateBuildingData(req.body);
    if (validationErrors.length > 0) {
      console.log('❌ Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
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
      return res.status(409).json({
        success: false,
        message: 'A building with this name already exists in the same city'
      });
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
    
    // Save to Firestore
    const docRef = await db.collection('buildings').add(buildingData);
    
    // Update city statistics
    await updateCityStatistics(sanitizedData.location.city);
    
    console.log(`✅ Building created successfully with ID: ${docRef.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Building created successfully',
      building: {
        id: docRef.id,
        ...buildingData
      }
    });
    
  } catch (error) {
    console.error('Error creating building:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create building',
      error: error.message
    });
  }
});

// PUT /api/buildings/:id - Update building
router.put('/:id', async (req, res) => {
  try {
    const buildingId = req.params.id;
    console.log(`🏢 PUT /api/buildings/${buildingId} - Request received`);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Check if building exists
    const buildingDoc = await db.collection('buildings').doc(buildingId).get();
    if (!buildingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }
    
    // Validate data
    const validationErrors = validateBuildingData(req.body, true);
    if (validationErrors.length > 0) {
      console.log('❌ Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Sanitize data
    const sanitizedData = sanitizeBuildingData(req.body);
    console.log('✅ Data sanitized:', JSON.stringify(sanitizedData, null, 2));
    
    // Check for duplicate building (excluding current one)
    if (sanitizedData.name && sanitizedData.location?.city) {
      const isDuplicate = await checkDuplicateBuilding(
        sanitizedData.name,
        sanitizedData.location.city,
        buildingId
      );
      
      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: 'A building with this name already exists in the same city'
        });
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
    
    console.log('💾 Updating building data:', JSON.stringify(updateData, null, 2));
    
    // Update in Firestore
    await db.collection('buildings').doc(buildingId).update(updateData);
    
    // Update city statistics for both old and new cities
    if (oldCityName) {
      await updateCityStatistics(oldCityName);
    }
    if (sanitizedData.location?.city && sanitizedData.location.city !== oldCityName) {
      await updateCityStatistics(sanitizedData.location.city);
    }
    
    console.log(`✅ Building updated successfully: ${buildingId}`);
    
    // Get updated building
    const updatedDoc = await db.collection('buildings').doc(buildingId).get();
    const updatedBuilding = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
    
    res.status(200).json({
      success: true,
      message: 'Building updated successfully',
      building: updatedBuilding
    });
    
  } catch (error) {
    console.error('Error updating building:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update building',
      error: error.message
    });
  }
});

// DELETE /api/buildings/:id - Delete building
router.delete('/:id', async (req, res) => {
  try {
    const buildingId = req.params.id;
    console.log(`🏢 DELETE /api/buildings/${buildingId} - Request received`);
    
    // Check if building exists
    const buildingDoc = await db.collection('buildings').doc(buildingId).get();
    if (!buildingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }
    
    const buildingData = buildingDoc.data();
    const cityName = buildingData.location?.city;
    
    // Delete building
    await db.collection('buildings').doc(buildingId).delete();
    
    // Update city statistics
    if (cityName) {
      await updateCityStatistics(cityName);
    }
    
    console.log(`✅ Building deleted successfully: ${buildingId}`);
    
    res.status(200).json({
      success: true,
      message: 'Building deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting building:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete building',
      error: error.message
    });
  }
});

module.exports = router; 