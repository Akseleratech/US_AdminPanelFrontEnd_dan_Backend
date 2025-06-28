// Load environment variables
require('dotenv').config();

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const { search, status, limit, category, type } = req.query;
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
    spacesSnapshot.forEach(doc => {
      spacesData.push(doc.data());
    });

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Count spaces using this service (enhanced matching)
      const serviceSpaces = spacesData.filter(space => {
        // Direct category match with service name (most common)
        if (space.category === data.name) return true;
        
        // Alternative matches for backwards compatibility
        if (space.category === data.serviceId || space.serviceId === data.serviceId) return true;
        
        // Case-insensitive match
        if (space.category && data.name && 
            space.category.toLowerCase() === data.name.toLowerCase()) return true;
            
        return false;
      });
      
      const activeSpaces = serviceSpaces.filter(space => space.isActive === true);
      
      services.push({
        id: doc.id,
        ...data,
        // Add frontend-compatible fields
        description: data.description?.short || data.description?.long || 'No description available',
        price: data.metrics?.averageLifetimeValue || 0,
        // Add space count
        spaceCount: {
          total: serviceSpaces.length,
          active: activeSpaces.length
        }
      });
    });

    // Apply client-side filtering for search
    if (search) {
      const searchLower = search.toLowerCase();
      services = services.filter(service =>
        service.name.toLowerCase().includes(searchLower) ||
        service.slug.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    if (limit) {
      services = services.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: services,
      total: services.length
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

// GET /api/services/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('layanan').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const data = doc.data();
    
    // Get spaces using this service
    const spacesSnapshot = await db.collection('spaces').get();
    const serviceSpaces = [];
    const activeSpaces = [];
    
    spacesSnapshot.forEach(spaceDoc => {
      const spaceData = spaceDoc.data();
      
      // Enhanced matching logic (same as in getAll)
      let isMatch = false;
      
      // Direct category match with service name (most common)
      if (spaceData.category === data.name) isMatch = true;
      
      // Alternative matches for backwards compatibility
      if (spaceData.category === data.serviceId || spaceData.serviceId === data.serviceId) isMatch = true;
      
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
    
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...data,
        // Add frontend-compatible fields
        description: data.description?.short || data.description?.long || 'No description available',
        price: data.metrics?.averageLifetimeValue || 0,
        // Add space count
        spaceCount: {
          total: serviceSpaces.length,
          active: activeSpaces.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
});

// POST /api/services
router.post('/', async (req, res) => {
  try {
    console.log('Backend: Received create request body:', req.body);
    
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
      lastModifiedBy
    } = req.body;

    // Validation
    if (!name) {
      console.log('Backend: Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check for duplicate name (case-insensitive)
    const existingServicesSnapshot = await db.collection('layanan').get();
    const duplicateService = existingServicesSnapshot.docs.find(doc => {
      const existingData = doc.data();
      return existingData.name && 
             existingData.name.toLowerCase().trim() === name.toLowerCase().trim();
    });

    if (duplicateService) {
      console.log('Backend: Validation failed - duplicate service name');
      return res.status(400).json({
        success: false,
        message: `Layanan dengan nama "${name}" sudah ada. Silakan gunakan nama yang berbeda.`
      });
    }

    const newServiceData = {
      serviceId: serviceId || `SVC${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || {
        short: `${name} service`,
        long: `Professional ${name} service for your business needs`,
        shortEn: `${name} service`,
        longEn: `Professional ${name} service for your business needs`
      },
      metrics: metrics || {
        totalSubscribers: 0,
        activeSubscribers: 0,
        monthlySignups: 0,
        churnRate: 0,
        averageLifetimeValue: 0,
        customerSatisfactionScore: 0,
        netPromoterScore: 0
      },
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: createdBy || 'api',
      lastModifiedBy: lastModifiedBy || 'api',
      publishedAt: status === 'published' ? new Date() : null,
      archivedAt: null
    };

    console.log('Backend: Prepared service data:', newServiceData);
    
    await db.collection('layanan').doc(newServiceData.serviceId).set(newServiceData);
    
    console.log('Backend: Service created successfully');

    res.status(201).json({
      success: true,
      data: {
        id: newServiceData.serviceId,
        ...newServiceData,
        // Add frontend-compatible fields
        description: newServiceData.description.short,
        price: newServiceData.metrics.averageLifetimeValue
      },
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
});

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
  try {
    const serviceRef = db.collection('layanan').doc(req.params.id);
    const doc = await serviceRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check for duplicate name if name is being updated (case-insensitive)
    if (req.body.name) {
      const existingServicesSnapshot = await db.collection('layanan').get();
      const duplicateService = existingServicesSnapshot.docs.find(docSnap => {
        const existingData = docSnap.data();
        return docSnap.id !== req.params.id && // Exclude current service
               existingData.name && 
               existingData.name.toLowerCase().trim() === req.body.name.toLowerCase().trim();
      });

      if (duplicateService) {
        console.log('Backend: Validation failed - duplicate service name');
        return res.status(400).json({
          success: false,
          message: `Layanan dengan nama "${req.body.name}" sudah ada. Silakan gunakan nama yang berbeda.`
        });
      }
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      lastModifiedBy: 'api'
    };

    // Handle status changes
    if (req.body.status === 'published' && doc.data().status !== 'published') {
      updateData.publishedAt = new Date();
    } else if (req.body.status === 'archived' && doc.data().status !== 'archived') {
      updateData.archivedAt = new Date();
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await serviceRef.update(updateData);

    // Get updated document
    const updatedDoc = await serviceRef.get();
    const data = updatedDoc.data();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...data,
        // Add frontend-compatible fields
        description: data.description?.short || data.description?.long || 'No description available',
        price: data.metrics?.averageLifetimeValue || 0
      },
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    const serviceRef = db.collection('layanan').doc(req.params.id);
    const doc = await serviceRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await serviceRef.delete();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
});

module.exports = router; 