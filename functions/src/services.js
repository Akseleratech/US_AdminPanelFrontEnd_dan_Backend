const {onRequest} = require('firebase-functions/v2/https');
const cors = require('./utils/corsConfig');
const {
  getDb,
  handleResponse,
  handleError,
  validateRequired,
  sanitizeString,
  generateSequentialId,
  verifyAdminAuth,
} = require('./utils/helpers');

// Main services function that handles all service routes
const services = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const {method, url} = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter((part) => part);

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
          return handleResponse(res, {message: 'Admin access required'}, 403);
        }
        return await createService(req, res);
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /services/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, {message: 'Admin access required'}, 403);
        }
        return await updateService(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /services/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, {message: 'Admin access required'}, 403);
        }
        return await deleteService(pathParts[0], req, res);
      }

      // 404 for unknown routes
      handleResponse(res, {message: 'Service route not found'}, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /services
const getAllServices = async (req, res) => {
  try {
    const db = getDb();
    const {search, status, limit, category, type} = req.query;
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

    // Get all spaces to count usage
    const spacesSnapshot = await db.collection('spaces').get();
    const spacesData = [];
    spacesSnapshot.forEach((doc) => {
      spacesData.push(doc.data());
    });

    snapshot.forEach((doc) => {
      const data = doc.data();

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

      services.push({
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
    handleError(res, error);
  }
};

// GET /services/:id
const getServiceById = async (serviceId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('layanan').doc(serviceId).get();

    if (!doc.exists) {
      return handleResponse(res, {message: 'Service not found'}, 404);
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
    handleError(res, error);
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
      return handleResponse(res, {message: 'Service slug already exists'}, 400);
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
    handleError(res, error);
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
      return handleResponse(res, {message: 'Service not found'}, 404);
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
        return handleResponse(res, {message: 'Service slug already exists'}, 400);
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
    handleError(res, error);
  }
};

// DELETE /services/:id
const deleteService = async (serviceId, req, res) => {
  try {
    const db = getDb();

    // Check if service exists
    const serviceDoc = await db.collection('layanan').doc(serviceId).get();
    if (!serviceDoc.exists) {
      return handleResponse(res, {message: 'Service not found'}, 404);
    }

    const serviceData = serviceDoc.data();

    // Check if service has associated spaces
    const spacesSnapshot = await db.collection('spaces')
        .where('category', '==', serviceData.name)
        .limit(1)
        .get();

    if (!spacesSnapshot.empty) {
      return handleResponse(res, {
        message: 'Cannot delete service with associated spaces',
      }, 400);
    }

    await db.collection('layanan').doc(serviceId).delete();

    console.log(`✅ Service deleted: ${serviceId} - ${serviceData.name}`);

    handleResponse(res, {message: 'Service deleted successfully'});
  } catch (error) {
    console.error('Error deleting service:', error);
    handleError(res, error);
  }
};

module.exports = {services};
