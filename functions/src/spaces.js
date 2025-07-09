const {onRequest} = require('firebase-functions/v2/https');
const cors = require('cors')({origin: true});
const {
  getDb,
  handleResponse,
  handleError,
  sanitizeString,
  generateSequentialId,
  verifyAdminAuth,
  getUserRoleAndCity,
} = require('./utils/helpers');
const {uploadImageFromBase64, deleteImage} = require('./services/imageService');
const {
  getOperationalStatus,
  updateSpaceOperationalStatus,
  updateAllSpacesOperationalStatus,
} = require('./spacesOperationalStatusUpdater');

// Main spaces function that handles all space routes
const spaces = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const {method, url} = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter((part) => part);

      // Remove '/api' if hosting adds it
      if (pathParts[0] === 'api') {
        pathParts.shift();
      }
      // NEW: Strip resource segment to normalize routing
      if (pathParts[0] === 'spaces') {
        pathParts.shift();
      }

      // Route handling
      if (method === 'GET') {
        if (pathParts.length === 0) {
          // GET /spaces
          return await getAllSpaces(req, res);
        } else if (pathParts.length === 1) {
          // GET /spaces/:id
          return await getSpaceById(pathParts[0], req, res);
        } else if (pathParts.length === 2 && pathParts[1] === 'availability') {
          // GET /spaces/:id/availability
          return await getSpaceAvailability(pathParts[0], req, res);
        } else if (pathParts.length === 2 && pathParts[1] === 'update-operational-status') {
          // GET /spaces/:id/update-operational-status
          return await updateSingleSpaceOperationalStatus(pathParts[0], req, res);
        } else if (pathParts.length === 1 && pathParts[0] === 'update-all-operational-status') {
          // GET /spaces/update-all-operational-status
          return await updateAllOperationalStatusEndpoint(req, res);
        }
      } else if (method === 'POST') {
        // Require admin auth for all POST operations
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, {message: 'Admin access required'}, 403);
        }

        if (pathParts.length === 0) {
          // POST /spaces
          return await createSpace(req, res);
        } else if (pathParts.length === 2 && pathParts[1] === 'upload-images') {
          // POST /spaces/:id/upload-images
          return await uploadSpaceImages(pathParts[0], req, res);
        }
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /spaces/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, {message: 'Admin access required'}, 403);
        }
        return await updateSpace(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /spaces/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, {message: 'Admin access required'}, 403);
        }
        return await deleteSpace(pathParts[0], req, res);
      }

      // 404 for unknown routes
      handleResponse(res, {message: 'Space route not found'}, 404);
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
  if (!isUpdate && !data.buildingId) errors.push('Building ID is required');
  if (!isUpdate && !data.category) errors.push('Category is required');
  if (!isUpdate && !data.capacity) errors.push('Capacity is required');

  // Name validation
  if (data.name && (data.name.length < 2 || data.name.length > 100)) {
    errors.push('Name must be between 2 and 100 characters');
  }

  // Capacity validation
  if (data.capacity && (isNaN(data.capacity) || data.capacity < 1)) {
    errors.push('Capacity must be a positive number');
  }

  // Pricing validation if provided
  if (data.pricing) {
    const {hourly, halfday, daily, monthly, yearly} = data.pricing;
    if (hourly && (isNaN(hourly) || hourly < 0)) errors.push('Hourly rate must be a non-negative number');
    if (halfday && (isNaN(halfday) || halfday < 0)) errors.push('Half-day rate must be a non-negative number');
    if (daily && (isNaN(daily) || daily < 0)) errors.push('Daily rate must be a non-negative number');
    if (monthly && (isNaN(monthly) || monthly < 0)) errors.push('Monthly rate must be a non-negative number');
    if (yearly && (isNaN(yearly) || yearly < 0)) errors.push('Yearly rate must be a non-negative number');
  }

  // Operational hours validation if provided
  if (data.operationalHours) {
    const {isAlwaysOpen, schedule} = data.operationalHours;

    // If not always open, validate schedule
    if (!isAlwaysOpen && schedule) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      days.forEach((day) => {
        const daySchedule = schedule[day];
        if (daySchedule && daySchedule.isOpen) {
          const {openTime, closeTime} = daySchedule;

          if (openTime && !timeRegex.test(openTime)) {
            errors.push(`${day} open time must be in HH:MM format (e.g., 08:00)`);
          }

          if (closeTime && !timeRegex.test(closeTime)) {
            errors.push(`${day} close time must be in HH:MM format (e.g., 17:00)`);
          }

          // Validate that close time is after open time
          if (openTime && closeTime && timeRegex.test(openTime) && timeRegex.test(closeTime)) {
            const openMinutes = parseInt(openTime.split(':')[0]) * 60 + parseInt(openTime.split(':')[1]);
            const closeMinutes = parseInt(closeTime.split(':')[0]) * 60 + parseInt(closeTime.split(':')[1]);

            if (closeMinutes <= openMinutes) {
              errors.push(`${day} close time must be after open time`);
            }
          }
        }
      });
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
  if (data.category) sanitized.category = sanitizeString(data.category);
  if (data.buildingId) sanitized.buildingId = sanitizeString(data.buildingId);

  // Sanitize numbers
  if (data.capacity) sanitized.capacity = parseInt(data.capacity);

  // Sanitize pricing
  if (data.pricing) {
    sanitized.pricing = {
      hourly: data.pricing.hourly ? parseFloat(data.pricing.hourly) : null,
      halfday: data.pricing.halfday ? parseFloat(data.pricing.halfday) : null,
      daily: data.pricing.daily ? parseFloat(data.pricing.daily) : null,
      monthly: data.pricing.monthly ? parseFloat(data.pricing.monthly) : null,
      yearly: data.pricing.yearly ? parseFloat(data.pricing.yearly) : null,
      currency: data.pricing.currency || 'IDR',
    };
  }

  // Sanitize operational hours
  if (data.operationalHours) {
    sanitized.operationalHours = {
      isAlwaysOpen: Boolean(data.operationalHours.isAlwaysOpen),
      schedule: data.operationalHours.schedule || {
        monday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
        tuesday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
        wednesday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
        thursday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
        friday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
        saturday: {isOpen: true, openTime: '09:00', closeTime: '15:00'},
        sunday: {isOpen: false, openTime: '09:00', closeTime: '15:00'},
      },
    };
  }

  if (data.amenities) {
    sanitized.amenities = Array.isArray(data.amenities) ? data.amenities : [];
  }

  // Boolean values
  if (data.isActive !== undefined) {
    sanitized.isActive = Boolean(data.isActive);
  }

  return sanitized;
};

// Check if city exists and create if needed
const _findOrCreateCity = async (locationData) => {
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
      ...(cityName.split(' ').map((word) => word.toLowerCase())),
      ...(provinceName.split(' ').map((word) => word.toLowerCase())),
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
        totalRevenue: 0,
      },
      search: {
        keywords: searchKeywords,
        aliases: [],
      },
      thumbnail: null,
      isActive: true,
      createdBy: 'auto-create',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('cities').add(cityData);
    console.log(`✅ Created new city: ${docRef.id}`);

    return docRef.id;
  } catch (error) {
    console.error('Error in findOrCreateCity:', error);
    throw error;
  }
};

// Generate search keywords for space
const generateSearchKeywords = (spaceData) => {
  const keywords = new Set();

  // Add name words
  if (spaceData.name) {
    spaceData.name.toLowerCase().split(/\s+/).forEach((word) => keywords.add(word));
  }

  // Add category
  if (spaceData.category) {
    keywords.add(spaceData.category.toLowerCase());
  }

  // Add building ID
  if (spaceData.buildingId) {
    keywords.add(spaceData.buildingId.toLowerCase());
  }

  // Add capacity
  if (spaceData.capacity) {
    keywords.add(spaceData.capacity.toString());
  }

  // Add amenities
  if (Array.isArray(spaceData.amenities)) {
    spaceData.amenities.forEach((amenity) => {
      if (typeof amenity === 'string') {
        keywords.add(amenity.toLowerCase());
      }
    });
  }

  // Add location info from building if available
  if (spaceData.location) {
    if (spaceData.location.city) keywords.add(spaceData.location.city.toLowerCase());
    if (spaceData.location.province) keywords.add(spaceData.location.province.toLowerCase());
    if (spaceData.location.address) {
      spaceData.location.address.toLowerCase().split(/\s+/).forEach((word) => keywords.add(word));
    }
  }

  return Array.from(keywords);
};

// GET /spaces
const getAllSpaces = async (req, res) => {
  try {
    const db = getDb();
    const {search, city, brand, status, limit, category} = req.query;
    let spacesRef = db.collection('spaces');

    // Role-based restriction: limit staff to their city
    const {role: requesterRole, cityId: requesterCityId} = await getUserRoleAndCity(req);
    const enforceCityRestriction = requesterRole === 'staff' && requesterCityId;

    // If staff and cityId known, we cannot directly query by cityId (not stored), but we can narrow by city name if provided via query params later.
    // We'll filter after data retrieval.

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

    const buildingCityCache = {};

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Role-based filtering for staff
      if (enforceCityRestriction) {
        let spaceCityId = null;

        if (data.cityId) {
          spaceCityId = data.cityId;
        } else if (data.buildingId) {
          if (buildingCityCache[data.buildingId] === undefined) {
            try {
              const bDoc = await db.collection('buildings').doc(data.buildingId).get();
              buildingCityCache[data.buildingId] = bDoc.exists ? (bDoc.data().cityId || null) : null;
            } catch (err) {
              buildingCityCache[data.buildingId] = null;
            }
          }
          spaceCityId = buildingCityCache[data.buildingId];
        }

        if (!spaceCityId || spaceCityId !== requesterCityId) {
          continue; // Skip space not in staff city
        }
      }

      const operationalStatus = getOperationalStatus(data);
      spaces.push({
        id: doc.id,
        ...data,
        operationalStatus,
      });
    }

    // Apply client-side filtering for search
    if (search) {
      const searchLower = search.toLowerCase();
      spaces = spaces.filter((space) =>
        space.name.toLowerCase().includes(searchLower) ||
        space.description?.toLowerCase().includes(searchLower) ||
        space.category?.toLowerCase().includes(searchLower),
      );
    }

    // Apply limit
    if (limit) {
      spaces = spaces.slice(0, parseInt(limit));
    }

    handleResponse(res, {
      data: spaces,
      total: spaces.length,
      success: true,
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
      return handleResponse(res, {message: 'Space not found'}, 404);
    }

    const data = doc.data();
    const spaceData = {
      id: doc.id,
      ...data,
      status: data.isActive ? 'active' : 'inactive',
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
        errors: validationErrors,
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizeSpaceData(req.body);

    // Get building data for location info
    const buildingDoc = await db.collection('buildings').doc(sanitizedData.buildingId).get();
    if (!buildingDoc.exists) {
      return handleResponse(res, {message: 'Building not found'}, 404);
    }
    const buildingData = buildingDoc.data();

    // Generate space ID
    const spaceId = await generateSequentialId('spaces', 'SPC', 3);

    // Generate search keywords
    const searchKeywords = generateSearchKeywords({
      ...sanitizedData,
      location: buildingData.location, // Use building location for search
    });

    const spaceData = {
      spaceId,
      name: sanitizedData.name,
      description: sanitizedData.description || '',
      category: sanitizedData.category,
      buildingId: sanitizedData.buildingId,
      capacity: sanitizedData.capacity,
      operationalHours: sanitizedData.operationalHours || {
        isAlwaysOpen: false,
        schedule: {
          monday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
          tuesday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
          wednesday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
          thursday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
          friday: {isOpen: true, openTime: '08:00', closeTime: '17:00'},
          saturday: {isOpen: true, openTime: '09:00', closeTime: '15:00'},
          sunday: {isOpen: false, openTime: '09:00', closeTime: '15:00'},
        },
      },
      pricing: sanitizedData.pricing || {
        hourly: null,
        halfday: null,
        daily: null,
        monthly: null,
        yearly: null,
        currency: 'IDR',
      },
      amenities: sanitizedData.amenities || [],
      search: {
        keywords: searchKeywords,
      },
      cityId: buildingData.cityId || null,
      isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true,
      createdBy: req.body.createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Use spaceId as document ID
    await db.collection('spaces').doc(spaceId).set(spaceData);

    // Update building statistics for this building
    await updateBuildingStatistics(sanitizedData.buildingId);

    console.log(`✅ Space created: ${spaceId} - ${sanitizedData.name}`);

    handleResponse(res, {
      id: spaceId,
      ...spaceData,
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
      return handleResponse(res, {message: 'Space not found'}, 404);
    }

    // Validate update data
    const validationErrors = validateSpaceData(req.body, true);
    if (validationErrors.length > 0) {
      return handleResponse(res, {
        message: 'Validation failed',
        errors: validationErrors,
      }, 400);
    }

    // Sanitize data
    const sanitizedData = sanitizeSpaceData(req.body);
    const existingData = spaceDoc.data();

    // Update search keywords if relevant fields changed
    if (sanitizedData.name || sanitizedData.location) {
      const updatedSpaceData = {...existingData, ...sanitizedData};
      sanitizedData.search = {
        keywords: generateSearchKeywords(updatedSpaceData),
      };
    }

    sanitizedData.updatedAt = new Date();

    await db.collection('spaces').doc(spaceId).update(sanitizedData);

    // Update city statistics if city changed
    if (sanitizedData.location?.city && sanitizedData.location.city !== existingData.location?.city) {
      await Promise.all([
        updateCityStatistics(sanitizedData.location.city),
        updateCityStatistics(existingData.location.city),
      ]);
    }

    // Update building statistics (if buildingId unchanged)
    if (sanitizedData.buildingId) {
      await updateBuildingStatistics(sanitizedData.buildingId);
    } else if (existingData.buildingId) {
      await updateBuildingStatistics(existingData.buildingId);
    }

    // Get updated document
    const updatedDoc = await db.collection('spaces').doc(spaceId).get();
    const data = updatedDoc.data();

    console.log(`✅ Space updated: ${spaceId} - ${data.name}`);

    handleResponse(res, {
      id: spaceId,
      ...data,
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
      return handleResponse(res, {message: 'Space not found'}, 404);
    }

    const spaceData = spaceDoc.data();

    // Delete all images associated with the space
    if (spaceData.images && spaceData.images.length > 0) {
      await Promise.all(
          spaceData.images.map((imageUrl) => deleteImage(imageUrl)),
      );
    }

    await db.collection('spaces').doc(spaceId).delete();

    // Update city statistics
    if (spaceData.location?.city) {
      await updateCityStatistics(spaceData.location.city);
    }

    // Update building statistics after deletion
    if (spaceData.buildingId) {
      await updateBuildingStatistics(spaceData.buildingId);
    }

    console.log(`✅ Space deleted: ${spaceId} - ${spaceData.name}`);

    handleResponse(res, {message: 'Space deleted successfully'});
  } catch (error) {
    console.error('Error deleting space:', error);
    handleError(res, error);
  }
};

// POST /spaces/:id/upload-images
const uploadSpaceImages = async (spaceId, req, res) => {
  try {
    const db = getDb();
    const {images} = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return handleResponse(res, {message: 'No images provided'}, 400);
    }

    // Check if space exists
    const spaceDoc = await db.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return handleResponse(res, {message: 'Space not found'}, 404);
    }

    // Upload all images
    const uploadResults = [];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const result = await uploadImageFromBase64(
          image.data,
          image.name || `space_${spaceId}_${i}`,
          'spaces',
      );
      uploadResults.push(result.url);
    }

    // Update space document with new image URLs
    const existingImages = spaceDoc.data().images || [];
    const allImages = [...existingImages, ...uploadResults];

    await db.collection('spaces').doc(spaceId).update({
      images: allImages,
      updatedAt: new Date(),
    });

    console.log(`✅ Successfully uploaded ${uploadResults.length} images for space ${spaceId}`);

    handleResponse(res, {
      uploadedImages: uploadResults,
      allImages: allImages,
      count: uploadResults.length,
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
    const activeSpaces = spacesSnapshot.docs.filter((doc) => doc.data().isActive).length;

    // Update city statistics
    await db.collection('cities').doc(cityId).update({
      'statistics.totalSpaces': totalSpaces,
      'statistics.activeSpaces': activeSpaces,
      'updatedAt': new Date(),
    });

    console.log(`✅ Updated statistics for city ${cityName}: ${totalSpaces} total, ${activeSpaces} active`);
  } catch (error) {
    console.error('Error updating city statistics:', error);
    // Don't throw error, just log it
  }
};

// GET /spaces/:id/update-operational-status
const updateSingleSpaceOperationalStatus = async (spaceId, req, res) => {
  try {
    const updated = await updateSpaceOperationalStatus(spaceId);

    if (updated) {
      handleResponse(res, {
        message: `Operational status updated for space ${spaceId}`,
        updated: true,
      });
    } else {
      handleResponse(res, {
        message: `No update needed for space ${spaceId}`,
        updated: false,
      });
    }
  } catch (error) {
    console.error('Error updating single space operational status:', error);
    handleError(res, error);
  }
};

// GET /spaces/update-all-operational-status
const updateAllOperationalStatusEndpoint = async (req, res) => {
  try {
    const updatedCount = await updateAllSpacesOperationalStatus();

    handleResponse(res, {
      message: `Updated operational status for ${updatedCount} spaces`,
      updatedCount,
    });
  } catch (error) {
    console.error('Error updating all spaces operational status:', error);
    handleError(res, error);
  }
};

// Update building statistics
const updateBuildingStatistics = async (buildingId) => {
  try {
    const db = getDb();

    // Count spaces for this building
    const spacesSnapshot = await db.collection('spaces')
        .where('buildingId', '==', buildingId)
        .get();

    const totalSpaces = spacesSnapshot.size;
    const activeSpaces = spacesSnapshot.docs.filter((doc) => doc.data().isActive).length;

    await db.collection('buildings').doc(buildingId).update({
      'statistics.totalSpaces': totalSpaces,
      'statistics.activeSpaces': activeSpaces,
      'updatedAt': new Date(),
    });

    console.log(`✅ Updated building ${buildingId} statistics: ${totalSpaces} total, ${activeSpaces} active`);
  } catch (error) {
    console.error('Error updating building statistics:', error);
    // Do not throw to avoid failing main operation
  }
};

// GET /spaces/:id/availability
const getSpaceAvailability = async (spaceId, req, res) => {
  try {
    const db = getDb();
    const {from, to} = req.query;

    // Check if space exists
    const spaceDoc = await db.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return handleResponse(res, {message: 'Space not found'}, 404);
    }

    // Set default date range if not provided (next 30 days)
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Query orders for this space with confirmed or active status
    const ordersSnapshot = await db.collection('orders')
        .where('spaceId', '==', spaceId)
        .where('status', 'in', ['confirmed', 'active'])
        .get();

    const bookedRanges = [];
    const bookedSlots = []; // For hourly bookings

    ordersSnapshot.forEach((doc) => {
      const order = doc.data();
      const startDate = order.startDate && order.startDate.toDate ? order.startDate.toDate() : new Date(order.startDate);
      const endDate = order.endDate && order.endDate.toDate ? order.endDate.toDate() : new Date(order.endDate);

      // Only include orders that overlap with the requested date range
      if (startDate <= toDate && endDate >= fromDate) {
        const bookedRange = {
          orderId: doc.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          pricingType: order.pricingType,
          customerName: order.customerName,
          status: order.status,
        };

        bookedRanges.push(bookedRange);

        // For hourly and halfday bookings, also create hourly slots
        if (order.pricingType === 'hourly' || order.pricingType === 'halfday') {
          const current = new Date(startDate);
          while (current < endDate) {
            bookedSlots.push({
              datetime: current.toISOString(),
              orderId: doc.id,
              customerName: order.customerName,
            });
            current.setHours(current.getHours() + 1);
          }
        }
      }
    });

    // Generate available dates for the requested range
    const availableDates = [];
    const current = new Date(fromDate);
    current.setHours(0, 0, 0, 0);

    while (current <= toDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);

      // Check if this date has any bookings
      const hasBooking = bookedRanges.some((range) => {
        const rangeStart = new Date(range.startDate);
        const rangeEnd = new Date(range.endDate);
        return rangeStart <= dayEnd && rangeEnd >= dayStart;
      });

      availableDates.push({
        date: dateStr,
        available: !hasBooking,
        bookings: bookedRanges.filter((range) => {
          const rangeStart = new Date(range.startDate);
          const rangeEnd = new Date(range.endDate);
          return rangeStart <= dayEnd && rangeEnd >= dayStart;
        }),
      });

      current.setDate(current.getDate() + 1);
    }

    console.log(`✅ Retrieved availability for space ${spaceId}: ${bookedRanges.length} bookings found`);

    handleResponse(res, {
      spaceId,
      spaceName: spaceDoc.data().name,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      bookedRanges,
      bookedSlots, // For hourly bookings
      availableDates,
      summary: {
        totalDaysChecked: availableDates.length,
        availableDays: availableDates.filter((d) => d.available).length,
        bookedDays: availableDates.filter((d) => !d.available).length,
        totalBookings: bookedRanges.length,
      },
    });
  } catch (error) {
    console.error('Error getting space availability:', error);
    handleError(res, error);
  }
};

module.exports = {spaces};
