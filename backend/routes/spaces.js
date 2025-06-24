// Load environment variables
require('dotenv').config();

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Validation schemas
const spaceValidationSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 1000 },
  brand: { type: 'string', required: true, enum: ['NextSpace', 'UnionSpace', 'CoSpace'] },
  category: { type: 'string', required: true, enum: ['co-working', 'meeting-room', 'private-office', 'event-space', 'phone-booth'] },
  spaceType: { type: 'string', required: true, enum: ['open-space', 'private-room', 'meeting-room', 'event-hall', 'phone-booth'] },
  capacity: { type: 'number', required: true, min: 1, max: 1000 },
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
  },
  pricing: {
    type: 'object',
    required: true,
    properties: {
      hourly: { type: 'number', required: false, min: 0 },
      daily: { type: 'number', required: false, min: 0 },
      monthly: { type: 'number', required: false, min: 0 },
      currency: { type: 'string', required: true, enum: ['IDR', 'USD'] }
    }
  }
};

// Data validation function
function validateSpaceData(data, isUpdate = false) {
  const errors = [];
  
  // Basic required fields validation
  if (!isUpdate && !data.name) errors.push('Name is required');
  if (!isUpdate && !data.brand) errors.push('Brand is required');
  if (!isUpdate && !data.category) errors.push('Category is required');
  if (!isUpdate && !data.location) errors.push('Location is required');
  if (!isUpdate && !data.capacity) errors.push('Capacity is required');
  if (!isUpdate && !data.pricing) errors.push('Pricing is required');
  
  // Name validation
  if (data.name && (data.name.length < 2 || data.name.length > 100)) {
    errors.push('Name must be between 2 and 100 characters');
  }
  
  // Brand validation
  if (data.brand && !['NextSpace', 'UnionSpace', 'CoSpace'].includes(data.brand)) {
    errors.push('Brand must be one of: NextSpace, UnionSpace, CoSpace');
  }
  
  // Category validation
  if (data.category && !['co-working', 'meeting-room', 'private-office', 'event-space', 'phone-booth'].includes(data.category)) {
    errors.push('Invalid category');
  }
  
  // Capacity validation
  if (data.capacity && (isNaN(data.capacity) || data.capacity < 1 || data.capacity > 1000)) {
    errors.push('Capacity must be a number between 1 and 1000');
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
  
  // Pricing validation
  if (data.pricing) {
    if (!data.pricing.currency) {
      errors.push('Currency is required in pricing');
    }
    if (data.pricing.currency && !['IDR', 'USD'].includes(data.pricing.currency)) {
      errors.push('Currency must be IDR or USD');
    }
    
    // At least one pricing option required
    if (!data.pricing.hourly && !data.pricing.daily && !data.pricing.monthly) {
      errors.push('At least one pricing option (hourly, daily, or monthly) is required');
    }
    
    // Validate pricing numbers
    ['hourly', 'daily', 'monthly'].forEach(priceType => {
      if (data.pricing[priceType] && (isNaN(data.pricing[priceType]) || data.pricing[priceType] < 0)) {
        errors.push(`${priceType} price must be a positive number`);
      }
    });
  }
  
  return errors;
}

// Data sanitization function
function sanitizeSpaceData(data) {
  const sanitized = {};
  
  // Sanitize strings
  if (data.name) sanitized.name = data.name.trim();
  if (data.description) sanitized.description = data.description.trim();
  if (data.brand) sanitized.brand = data.brand.trim();
  if (data.category) sanitized.category = data.category.trim();
  if (data.spaceType) sanitized.spaceType = data.spaceType.trim();
  
  // Sanitize numbers
  if (data.capacity) sanitized.capacity = parseInt(data.capacity);
  
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
  
  // Sanitize pricing
  if (data.pricing) {
    sanitized.pricing = {
      hourly: data.pricing.hourly ? parseFloat(data.pricing.hourly) : 0,
      daily: data.pricing.daily ? parseFloat(data.pricing.daily) : 0,
      monthly: data.pricing.monthly ? parseFloat(data.pricing.monthly) : 0,
      currency: data.pricing.currency || 'IDR'
    };
  }
  
  // Sanitize arrays
  if (data.amenities) {
    sanitized.amenities = Array.isArray(data.amenities) ? data.amenities : [];
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
      category, 
      city, 
      minCapacity, 
      maxCapacity, 
      priceRange,
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
    } else if (category) {
      spacesRef = spacesRef.where('category', '==', category);
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
      spaceData.priceRange = getPriceRange(spaceData.pricing);
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

// Helper function to calculate price range
function getPriceRange(pricing) {
  if (!pricing) return 'Unknown';
  
  const prices = [pricing.hourly, pricing.daily, pricing.monthly].filter(p => p > 0);
  if (prices.length === 0) return 'Free';
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  if (min === max) return `${pricing.currency} ${min.toLocaleString()}`;
  return `${pricing.currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
}

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
    spaceData.priceRange = getPriceRange(spaceData.pricing);
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

// POST /api/spaces
router.post('/', async (req, res) => {
  try {
    const rawData = req.body;
    
    // Sanitize input data
    const sanitizedData = sanitizeSpaceData(rawData);
    
    // Validate input data
    const validationErrors = validateSpaceData(sanitizedData);
    if (validationErrors.length > 0) {
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
    
    // City validation (warning only, not blocking)
    const cityExists = await validateCityExists(sanitizedData.location.city);
    if (!cityExists) {
      console.warn(`⚠️  Warning: City "${sanitizedData.location.city}" not found in cities collection, but allowing creation`);
    }
    
    if (businessValidations.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Business validation failed',
        errors: businessValidations
      });
    }

    // Generate space ID
    const spaceId = sanitizedData.spaceId || `space_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare final data
    const newSpaceData = {
      spaceId,
      ...sanitizedData,
      // Ensure required defaults
      description: sanitizedData.description || `Professional ${sanitizedData.category} space`,
      spaceType: sanitizedData.spaceType || sanitizedData.category,
      isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true,
      amenities: sanitizedData.amenities || [],
      images: sanitizedData.images || [],
      thumbnail: sanitizedData.thumbnail || null,
      
      // Default operating hours if not provided
      operatingHours: sanitizedData.operatingHours || {
        monday: { open: "08:00", close: "22:00" },
        tuesday: { open: "08:00", close: "22:00" },
        wednesday: { open: "08:00", close: "22:00" },
        thursday: { open: "08:00", close: "22:00" },
        friday: { open: "08:00", close: "22:00" },
        saturday: { open: "09:00", close: "18:00" },
        sunday: { open: "09:00", close: "18:00" }
      },
      
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
      message: 'Space created successfully'
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
  if (spaceData.category) keywords.push(spaceData.category.toLowerCase());
  if (spaceData.spaceType) keywords.push(spaceData.spaceType.toLowerCase());
  if (spaceData.location?.city) keywords.push(spaceData.location.city.toLowerCase());
  if (spaceData.location?.province) keywords.push(spaceData.location.province.toLowerCase());
  if (spaceData.amenities) keywords.push(...spaceData.amenities.map(a => a.toLowerCase()));
  
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
    if (sanitizedData.name || sanitizedData.amenities || sanitizedData.category) {
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