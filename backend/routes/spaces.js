// Load environment variables
require('dotenv').config();

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Validation schemas - Simplified for Buildings (no category, capacity, pricing, amenities)
const spaceValidationSchema = {
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
      postalCode: { type: 'string', required: false, pattern: /^\d{5}$/ },
      country: { type: 'string', required: true, default: 'Indonesia' },
      latitude: { type: 'number', required: false, min: -90, max: 90 },
      longitude: { type: 'number', required: false, min: -180, max: 180 }
    }
  }
};

// Data validation function
function validateSpaceData(data, isUpdate = false) {
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
}

// Data sanitization function
function sanitizeSpaceData(data) {
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
      postalCode: data.location.postalCode?.trim(),
      country: data.location.country?.trim() || 'Indonesia',
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
}

// Check if city exists
async function validateCityExists(cityName) {
  try {
    const citySnapshot = await db.collection('cities')
      .where('name', '==', cityName)
      .limit(1)
      .get();
    
    return !citySnapshot.empty;
  } catch (error) {
    console.warn('Could not validate city existence:', error);
    return true; // Allow if validation fails
  }
}




// Check for duplicate space names in same city
async function checkDuplicateSpace(name, city, excludeId = null) {
  try {
    let query = db.collection('spaces')
      .where('name', '==', name)
      .where('location.city', '==', city);
    
    const snapshot = await query.get();
    
    if (excludeId) {
      // Filter out the current space being updated
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.warn('Could not check for duplicate spaces:', error);
    return false; // Allow if check fails
  }
}

// Helper function to generate sequential space ID
async function generateSequentialSpaceId() {
  try {
    const year = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('spaces');
    
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
      const spaceId = `SPC${yearSuffix}${sequence}`; // Format: SPC25001
      
      // Update counter
      transaction.set(counterRef, {
        lastId: lastId,
        year: currentYear,
        updatedAt: new Date()
      });
      
      return spaceId;
    });
    
    console.log(`✅ Generated sequential space ID: ${result}`);
    return result;
    
  } catch (error) {
    console.error('Error generating sequential space ID:', error);
    // Fallback to timestamp-based ID if sequential fails
    const fallbackId = `SPC${Date.now().toString().slice(-6)}`;
    console.log(`⚠️  Using fallback ID: ${fallbackId}`);
    return fallbackId;
  }
}

// GET /api/spaces
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      type, 
      location, 
      status, 
      limit, 
      brand, 
      city, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1
    } = req.query;
    
    let spacesRef = db.collection('spaces');

    // SIMPLIFIED QUERY - Avoid complex composite index requirements
    // Only use single field queries to prevent index errors
    
    // Primary filter - choose the most selective one
    if (brand) {
      spacesRef = spacesRef.where('brand', '==', brand);
    } else if (status === 'active') {
      spacesRef = spacesRef.where('isActive', '==', true);
    } else if (status === 'inactive') {
      spacesRef = spacesRef.where('isActive', '==', false);
    }

    // Add ordering - simple field only
    spacesRef = spacesRef.orderBy('createdAt', 'desc');

    // Execute simplified query
    const snapshot = await spacesRef.get();
    let spaces = [];

    snapshot.forEach(doc => {
      const spaceData = {
        id: doc.id,
        ...doc.data()
      };
      
      // Add computed fields
      spaceData.slug = spaceData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      spaceData.hasCoordinates = !!(spaceData.location?.latitude && spaceData.location?.longitude);
      
      spaces.push(spaceData);
    });

    // Apply client-side filtering for all complex queries
    // This avoids Firebase composite index requirements
    
    if (search) {
      const searchLower = search.toLowerCase();
      spaces = spaces.filter(space =>
        space.name?.toLowerCase().includes(searchLower) ||
        space.description?.toLowerCase().includes(searchLower) ||
        space.location?.address?.toLowerCase().includes(searchLower) ||
        space.amenities?.some(amenity => amenity.toLowerCase().includes(searchLower))
      );
    }

    // Additional status filtering (if not used in primary query)
    if (status && !brand && !category) {
      if (status === 'active') {
        spaces = spaces.filter(space => space.isActive === true);
      } else if (status === 'inactive') {
        spaces = spaces.filter(space => space.isActive === false);
      }
    }

    // Type filtering
    if (type) {
      spaces = spaces.filter(space => space.spaceType === type);
    }

    // City filtering
    if (city) {
      spaces = spaces.filter(space => space.location?.city === city);
    }

    if (location && !city) {
      const locationLower = location.toLowerCase();
      spaces = spaces.filter(space =>
        space.location?.city?.toLowerCase().includes(locationLower) ||
        space.location?.address?.toLowerCase().includes(locationLower) ||
        space.location?.province?.toLowerCase().includes(locationLower)
      );
    }

    // Capacity filtering
    if (minCapacity) {
      spaces = spaces.filter(space => space.capacity >= parseInt(minCapacity));
    }
    if (maxCapacity) {
      spaces = spaces.filter(space => space.capacity <= parseInt(maxCapacity));
    }

    // Price range filtering
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      spaces = spaces.filter(space => {
        const minPrice = Math.min(
          space.pricing?.hourly || Infinity,
          space.pricing?.daily || Infinity,
          space.pricing?.monthly || Infinity
        );
        return minPrice >= min && minPrice <= max;
      });
    }

    // Sorting for non-date fields
    if (sortBy !== 'createdAt' && sortBy !== 'updatedAt') {
      spaces.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Pagination
    const pageSize = Math.min(parseInt(limit) || 20, 100); // Max 100 items per page
    const offset = (parseInt(page) - 1) * pageSize;
    const paginatedSpaces = spaces.slice(offset, offset + pageSize);

    res.json({
      success: true,
      data: paginatedSpaces,
      pagination: {
        total: spaces.length,
        page: parseInt(page),
        pageSize,
        totalPages: Math.ceil(spaces.length / pageSize)
      },
      filters: {
        search,
        type,
        location,
        status,
        brand,
        category,
        city,
        minCapacity,
        maxCapacity,
        priceRange
      }
    });
  } catch (error) {
    console.error('Error fetching spaces:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spaces',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});



// GET /api/spaces/:id
router.get('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;
    
    // Validate space ID format
    if (!spaceId || spaceId.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid space ID format'
      });
    }
    
    const doc = await db.collection('spaces').doc(spaceId).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    const spaceData = {
      id: doc.id,
      ...doc.data()
    };
    
    // Add computed fields
    spaceData.slug = spaceData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    spaceData.hasCoordinates = !!(spaceData.location?.latitude && spaceData.location?.longitude);

    res.json({
      success: true,
      data: spaceData
    });
  } catch (error) {
    console.error('Error fetching space:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch space',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to find or create city based on Google Maps data
async function findOrCreateCity(locationData) {
  try {
    console.log('🏙️  findOrCreateCity: Function called with data:', JSON.stringify(locationData, null, 2));
    
    const { city, province, country } = locationData;
    
    console.log('🏙️  findOrCreateCity: Extracted values - city:', city, 'province:', province, 'country:', country);
    
    if (!city || !province || !country) {
      const errorMsg = `Missing required fields: city=${city}, province=${province}, country=${country}`;
      console.error('❌ findOrCreateCity: Validation failed -', errorMsg);
      throw new Error('City, province, and country are required to create/find city');
    }

    // First, try to find existing city
    const existingCitySnapshot = await db.collection('cities')
      .where('name', '==', city)
      .where('province', '==', province)
      .where('country', '==', country)
      .limit(1)
      .get();

    if (!existingCitySnapshot.empty) {
      // City exists, return the existing city data
      const existingCityDoc = existingCitySnapshot.docs[0];
      console.log(`✅ Found existing city: ${city}, ${province}, ${country}`);
      return {
        id: existingCityDoc.id,
        ...existingCityDoc.data(),
        existed: true
      };
    }

    // City doesn't exist, create new one
    console.log(`🆕 Creating new city: ${city}, ${province}, ${country}`);
    
    const cityId = `CTY${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newCityData = {
      cityId,
      name: city,
      province,
      country,
      postalCodes: locationData.postalCode ? [locationData.postalCode] : [],
      timezone: 'Asia/Jakarta', // Default timezone - can be enhanced later
      utcOffset: '+07:00',
      statistics: {
        totalSpaces: 0,
        activeSpaces: 0
      },
      search: {
        keywords: [city.toLowerCase(), province.toLowerCase()],
        aliases: [],
        slug: city.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: `Co-working Spaces in ${city}`,
        metaDescription: `Find and book workspaces in ${city}, ${province}`
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'auto_maps_api'
    };

    // Save to database
    await db.collection('cities').doc(cityId).set(newCityData);

    console.log(`✅ Successfully created new city: ${cityId}`);
    
    return {
      id: cityId,
      ...newCityData,
      existed: false
    };
  } catch (error) {
    console.error('Error in findOrCreateCity:', error);
    // Don't throw error, just log warning and continue
    console.warn(`⚠️  Could not create/find city for: ${locationData.city}, continuing with space creation`);
    return null;
  }
}

// POST /api/spaces
router.post('/', async (req, res) => {
  try {
    console.log('🔍 POST /spaces: Received raw data:', JSON.stringify(req.body, null, 2));
    const rawData = req.body;
    
    // Sanitize input data
    const sanitizedData = sanitizeSpaceData(rawData);
    console.log('🔍 POST /spaces: Sanitized data:', JSON.stringify(sanitizedData, null, 2));
    
    // Validate input data
    const validationErrors = validateSpaceData(sanitizedData);
    console.log('🔍 POST /spaces: Validation errors from validateSpaceData:', validationErrors);
    if (validationErrors.length > 0) {
      console.log('🔍 POST /spaces: Returning validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Additional business logic validations
    const businessValidations = [];
    

    
    // Check for duplicate space names in same city (strict validation)
    const isDuplicate = await checkDuplicateSpace(sanitizedData.name, sanitizedData.location.city);
    if (isDuplicate) {
      businessValidations.push(`A space with name "${sanitizedData.name}" already exists in ${sanitizedData.location.city}`);
    }
    
    if (businessValidations.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Business validation failed',
        errors: businessValidations
      });
    }

    // AUTO-CREATE CITY: Find or create city based on location data
    console.log('🔍 POST /spaces: Starting auto-create city process...');
    console.log('🔍 POST /spaces: Location data:', JSON.stringify(sanitizedData.location, null, 2));
    
    const cityResult = await findOrCreateCity(sanitizedData.location);
    console.log('🔍 POST /spaces: findOrCreateCity result:', cityResult);
    
    let cityMessage = '';
    if (cityResult) {
      if (cityResult.existed) {
        cityMessage = ` (City "${sanitizedData.location.city}" already exists)`;
        console.log('✅ POST /spaces: Using existing city');
      } else {
        cityMessage = ` (New city "${sanitizedData.location.city}" created automatically)`;
        console.log('🆕 POST /spaces: New city created successfully');
      }
    } else {
      console.log('❌ POST /spaces: findOrCreateCity returned null - city creation failed');
    }

    // Generate space ID using new sequential format
    const spaceId = sanitizedData.spaceId || await generateSequentialSpaceId();
    
    // Prepare final data
    const newSpaceData = {
      spaceId,
      ...sanitizedData,
      // Ensure required defaults
      description: sanitizedData.description || `Modern building space`,
      isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true,
      images: sanitizedData.images || [],
      thumbnail: sanitizedData.thumbnail || null,
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user?.uid || 'api',
      version: 1,
      
      // SEO and search optimization
      slug: sanitizedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      searchKeywords: generateSearchKeywords(sanitizedData)
    };

    // Save to database
    await db.collection('spaces').doc(spaceId).set(newSpaceData);

    // Update city statistics
    await updateCityStatistics(sanitizedData.location.city);

    res.status(201).json({
      success: true,
      data: newSpaceData,
      message: `Space created successfully${cityMessage}`
    });
  } catch (error) {
    console.error('Error creating space:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create space',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to generate search keywords
function generateSearchKeywords(spaceData) {
  const keywords = [];
  
  if (spaceData.name) keywords.push(...spaceData.name.toLowerCase().split(' '));
  if (spaceData.brand) keywords.push(spaceData.brand.toLowerCase());
  if (spaceData.location?.city) keywords.push(spaceData.location.city.toLowerCase());
  if (spaceData.location?.province) keywords.push(spaceData.location.province.toLowerCase());
  
  // Remove duplicates and empty strings
  return [...new Set(keywords.filter(k => k && k.length > 1))];
}

// Helper function to update city statistics
async function updateCityStatistics(cityName) {
  try {
    const citySnapshot = await db.collection('cities')
      .where('name', '==', cityName)
      .limit(1)
      .get();
    
    if (!citySnapshot.empty) {
      const cityDoc = citySnapshot.docs[0];
      const cityRef = cityDoc.ref;
      
      // Count total and active spaces in this city
      const spacesSnapshot = await db.collection('spaces')
        .where('location.city', '==', cityName)
        .get();
      
      let totalSpaces = 0;
      let activeSpaces = 0;
      
      spacesSnapshot.forEach(doc => {
        totalSpaces++;
        if (doc.data().isActive) activeSpaces++;
      });
      
      // Update city statistics
      await cityRef.update({
        'statistics.totalSpaces': totalSpaces,
        'statistics.activeSpaces': activeSpaces,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.warn('Could not update city statistics:', error);
  }
}

// PUT /api/spaces/:id
router.put('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;
    const rawData = req.body;
    
    // Validate space ID
    if (!spaceId || spaceId.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid space ID format'
      });
    }
    
    const spaceRef = db.collection('spaces').doc(spaceId);
    const doc = await spaceRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }
    
    const existingData = doc.data();
    
    // Sanitize input data
    const sanitizedData = sanitizeSpaceData(rawData);
    
    // Validate input data for updates
    const validationErrors = validateSpaceData(sanitizedData, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Business logic validations
    const businessValidations = [];
    

    
    // Check for duplicate space names (excluding current space)
    if (sanitizedData.name && sanitizedData.location?.city) {
      const isDuplicate = await checkDuplicateSpace(
        sanitizedData.name, 
        sanitizedData.location.city, 
        spaceId
      );
      if (isDuplicate) {
        businessValidations.push(`A space with name "${sanitizedData.name}" already exists in ${sanitizedData.location.city}`);
      }
    }
    
    if (businessValidations.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Business validation failed',
        errors: businessValidations
      });
    }

    // Prepare update data
    const updateData = {
      ...sanitizedData,
      updatedAt: new Date(),
      updatedBy: req.user?.uid || 'api',
      version: (existingData.version || 1) + 1
    };

    // Update search keywords if name or other searchable fields changed
    if (sanitizedData.name) {
      updateData.searchKeywords = generateSearchKeywords({
        ...existingData,
        ...sanitizedData
      });
    }

    // Update slug if name changed
    if (sanitizedData.name) {
      updateData.slug = sanitizedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await spaceRef.update(updateData);

    // Update city statistics if city changed
    if (sanitizedData.location?.city && sanitizedData.location.city !== existingData.location?.city) {
      await updateCityStatistics(existingData.location?.city); // Old city
      await updateCityStatistics(sanitizedData.location.city); // New city
    }

    // Get updated document
    const updatedDoc = await spaceRef.get();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      },
      message: 'Space updated successfully'
    });
  } catch (error) {
    console.error('Error updating space:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update space',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/spaces/:id
router.delete('/:id', async (req, res) => {
  try {
    const spaceId = req.params.id;
    
    // Validate space ID
    if (!spaceId || spaceId.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid space ID format'
      });
    }
    
    const spaceRef = db.collection('spaces').doc(spaceId);
    const doc = await spaceRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    const spaceData = doc.data();

    // Check for existing orders/bookings (business rule)
    const ordersSnapshot = await db.collection('orders')
      .where('spaceId', '==', spaceId)
      .where('status', 'in', ['pending', 'confirmed', 'active'])
      .limit(1)
      .get();

    if (!ordersSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete space with active bookings. Please cancel all bookings first.'
      });
    }

    await spaceRef.delete();

    // Update city statistics
    if (spaceData.location?.city) {
      await updateCityStatistics(spaceData.location.city);
    }

    res.json({
      success: true,
      message: 'Space deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting space:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete space',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/spaces/:id/toggle-status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const spaceId = req.params.id;
    
    const spaceRef = db.collection('spaces').doc(spaceId);
    const doc = await spaceRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    const currentStatus = doc.data().isActive;
    const newStatus = !currentStatus;

    await spaceRef.update({
      isActive: newStatus,
      updatedAt: new Date(),
      updatedBy: req.user?.uid || 'api'
    });

    // Update city statistics
    if (doc.data().location?.city) {
      await updateCityStatistics(doc.data().location.city);
    }

    res.json({
      success: true,
      data: {
        id: spaceId,
        isActive: newStatus
      },
      message: `Space ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling space status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle space status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 