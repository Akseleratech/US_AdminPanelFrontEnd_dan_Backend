const {onRequest} = require('firebase-functions/v2/https');
const cors = require('./utils/corsConfig');
const {
  getDb,
  validateRequired,
  sanitizeString,
  generateSequentialId,
  verifyAdminAuth,
} = require('./utils/helpers');
const {
  handleResponse,
  handleError,
  handleValidationError,
  handleAuthError,
} = require('./utils/errorHandler');
const {applyWriteOperationRateLimit} = require('./utils/applyRateLimit');

// Main services function that handles all service routes
const services = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Apply rate limiting for write operations
      if (!applyWriteOperationRateLimit(req, res)) {
        return; // Rate limit exceeded, response already sent
      }

      const {method, url} = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter((part) => part);

      // Strip '/api' prefix inserted by Firebase Hosting rewrite, if present
      if (pathParts[0] === 'api') {
        pathParts.shift();
      }
      // NEW: Strip resource name ('services') if still present to normalize routing
      if (pathParts[0] === 'services') {
        pathParts.shift();
      }

      // Route handling
      if (method === 'GET') {
        if (pathParts.length === 0) {
          // GET /services
          return await getAllServices(req, res);
        } else if (pathParts.length === 1) {
          // GET /services/:id
          return await getServiceById(pathParts[0], req, res);
        }
      } else if (method === 'POST' && pathParts.length === 0) {
        // POST /services - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }
        return await createService(req, res);
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /services/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }
        return await updateService(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /services/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }
        return await deleteService(pathParts[0], req, res);
      }

      // 404 for unknown routes
      return handleError(res, new Error('Service route not found'), 404, req);
    } catch (error) {
      return handleError(res, error, 500, req);
    }
  });
});

// GET /services
const getAllServices = async (req, res) => {
  try {
    // Log public endpoint access for monitoring
    const userAgent = req.headers['user-agent'] || 'unknown';
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    console.log(`📱 Public endpoint access: GET /services from ${clientIP} - ${userAgent}`);

    const db = getDb();
    const {search, status, limit, category, type, skipStats} = req.query;
    let servicesRef = db.collection('layanan');

    // Build query
    if (status === 'published') {
      servicesRef = servicesRef.where('status', '==', 'published');
    } else if (status === 'draft') {
      servicesRef = servicesRef.where('status', '==', 'draft');
    } else if (status === 'archived') {
      servicesRef = servicesRef.where('status', '==', 'archived');
    }

    if (category) {
      servicesRef = servicesRef.where('category', '==', category);
    }

    if (type) {
      servicesRef = servicesRef.where('type', '==', type);
    }

    // Execute query
    const snapshot = await servicesRef.get();
    let services = [];

    // Conditionally get spaces data for performance optimization
    const spacesData = [];
    if (skipStats !== 'true') {
      // Get all spaces to count usage (only if not skipping stats)
      const spacesSnapshot = await db.collection('spaces').get();
      spacesSnapshot.forEach((doc) => {
        spacesData.push(doc.data());
      });
    }

    snapshot.forEach((doc) => {
      const data = doc.data();

      let spaceCount = {
        total: 0,
        active: 0,
      };

      // Only calculate space counts if not skipping stats
      if (skipStats !== 'true' && spacesData.length > 0) {
        // Count spaces using this service (enhanced matching)
        const serviceSpaces = spacesData.filter((space) => {
          // Direct category match with service name (most common)
          if (space.category === data.name) return true;

          // Alternative matches for backwards compatibility
          if (space.category === (data.layananId || data.serviceId) || space.serviceId === (data.layananId || data.serviceId)) return true;

          // Case-insensitive match
          if (space.category && data.name &&
              space.category.toLowerCase() === data.name.toLowerCase()) return true;

          return false;
        });

        const activeSpaces = serviceSpaces.filter((space) => space.isActive === true);
        spaceCount = {
          total: serviceSpaces.length,
          active: activeSpaces.length,
        };
      }

      services.push({
        id: doc.id,
        ...data,
        // Frontend-compatible fields
        description: data.description?.short || data.description?.long || 'No description available',
        price: data.metrics?.averageLifetimeValue || 0,
        // Add space count (0 if skipped)
        spaceCount,
        // Ensure layananId is available (for backward compatibility)
        layananId: data.layananId || data.serviceId || doc.id,
      });
    });

    // Apply client-side filtering for search
    if (search) {
      const searchLower = search.toLowerCase();
      services = services.filter((service) =>
        service.name.toLowerCase().includes(searchLower) ||
        service.slug.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower),
      );
    }

    // Apply limit
    if (limit) {
      services = services.slice(0, parseInt(limit));
    }

    handleResponse(res, {
      services,
      total: services.length,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return handleError(res, error, 500, req);
  }
};

// GET /services/:id
const getServiceById = async (serviceId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('layanan').doc(serviceId).get();

    if (!doc.exists) {
      return handleError(res, new Error('Service not found'), 404, req);
    }

    const data = doc.data();

    // Get spaces using this service
    const spacesSnapshot = await db.collection('spaces').get();
    const serviceSpaces = [];
    const activeSpaces = [];

    spacesSnapshot.forEach((spaceDoc) => {
      const spaceData = spaceDoc.data();

      // Enhanced matching logic (same as in getAll)
      let isMatch = false;

      // Direct category match with service name (most common)
      if (spaceData.category === data.name) isMatch = true;

      // Alternative matches for backwards compatibility
      if (spaceData.category === (data.layananId || data.serviceId) || spaceData.serviceId === (data.layananId || data.serviceId)) isMatch = true;

      // Case-insensitive match
      if (spaceData.category && data.name &&
          spaceData.category.toLowerCase() === data.name.toLowerCase()) isMatch = true;

      if (isMatch) {
        serviceSpaces.push(spaceData);
        if (spaceData.isActive === true) {
          activeSpaces.push(spaceData);
        }
      }
    });

    const serviceData = {
      id: doc.id,
      ...data,
      // Frontend-compatible fields
      description: data.description?.short || data.description?.long || 'No description available',
      price: data.metrics?.averageLifetimeValue || 0,
      // Add space count
      spaceCount: {
        total: serviceSpaces.length,
        active: activeSpaces.length,
      },
      // Ensure layananId is available (for backward compatibility)
      layananId: data.layananId || data.serviceId || doc.id,
    };

    handleResponse(res, serviceData);
  } catch (error) {
    console.error('Error fetching service:', error);
    return handleError(res, error, 500, req);
  }
};

// POST /services
const createService = async (req, res) => {
  try {
    const db = getDb();
    const {
      serviceId,
      name,
      slug,
      category,
      type,
      description,
      metrics,
      status = 'draft',
      createdBy,
      lastModifiedBy,
    } = req.body;

    // Validation
    validateRequired(req.body, ['name']);

    // Generate structured layanan ID for both field and document ID
    const finalLayananId = serviceId || await generateSequentialId('layanan', 'LAY', 3);

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check for duplicate slug
    const slugQuery = await db.collection('layanan').where('slug', '==', finalSlug).get();
    if (!slugQuery.empty) {
      return handleValidationError(res, [{message: 'Service slug already exists'}], req);
    }

    const serviceData = {
      layananId: finalLayananId,
      name: sanitizeString(name),
      slug: finalSlug,
      category: category || 'general',
      type: type || 'standard',
      description: {
        short: description?.short || '',
        long: description?.long || '',
      },
      metrics: {
        totalSpaces: 0,
        activeSpaces: 0,
        averageLifetimeValue: metrics?.averageLifetimeValue || 0,
        conversionRate: metrics?.conversionRate || 0,
      },
      status,
      createdBy: createdBy || 'system',
      lastModifiedBy: lastModifiedBy || createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Use structured ID as document ID instead of random
    await db.collection('layanan').doc(finalLayananId).set(serviceData);

    console.log(`✅ Service created: ${finalLayananId} - ${name}`);

    handleResponse(res, {
      id: finalLayananId,
      ...serviceData,
    }, 201);
  } catch (error) {
    console.error('Error creating service:', error);
    return handleError(res, error, 500, req);
  }
};

// PUT /services/:id
const updateService = async (serviceId, req, res) => {
  try {
    const db = getDb();
    const updateData = {...req.body};
    delete updateData.id; // Remove id from update data

    // Check if service exists
    const serviceDoc = await db.collection('layanan').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return handleError(res, new Error('Service not found'), 404, req);
    }

    // Sanitize strings
    if (updateData.name) updateData.name = sanitizeString(updateData.name);
    if (updateData.slug) updateData.slug = sanitizeString(updateData.slug);

    // Check for duplicate slug if slug is being updated
    if (updateData.slug) {
      const slugQuery = await db.collection('layanan')
          .where('slug', '==', updateData.slug)
          .get();

      const duplicateSlug = slugQuery.docs.find((doc) => doc.id !== serviceId);
      if (duplicateSlug) {
        return handleValidationError(res, [{message: 'Service slug already exists'}], req);
      }
    }

    updateData.updatedAt = new Date();

    await db.collection('layanan').doc(serviceId).update(updateData);

    // Get updated document
    const updatedDoc = await db.collection('layanan').doc(serviceId).get();
    const data = updatedDoc.data();

    console.log(`✅ Service updated: ${serviceId} - ${data.name}`);

    handleResponse(res, {
      id: serviceId,
      ...data,
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return handleError(res, error, 500, req);
  }
};

// DELETE /services/:id
const deleteService = async (serviceId, req, res) => {
  try {
    const db = getDb();

    // Check if service exists
    const serviceDoc = await db.collection('layanan').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return handleError(res, new Error('Service not found'), 404, req);
    }

    const serviceData = serviceDoc.data();

    // Check if service has associated spaces
    const spacesSnapshot = await db.collection('spaces')
        .where('category', '==', serviceData.name)
        .limit(1)
        .get();

    if (!spacesSnapshot.empty) {
      return handleValidationError(res, [{message: 'Cannot delete service with associated spaces'}], req);
    }

    await db.collection('layanan').doc(serviceId).delete();

    console.log(`✅ Service deleted: ${serviceId} - ${serviceData.name}`);

    handleResponse(res, {message: 'Service deleted successfully'});
  } catch (error) {
    console.error('Error deleting service:', error);
    return handleError(res, error, 500, req);
  }
};

module.exports = {services};
