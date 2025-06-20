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

    snapshot.forEach(doc => {
      const data = doc.data();
      services.push({
        id: doc.id,
        ...data,
        // Add frontend-compatible fields
        description: data.description?.short || data.description?.long || 'No description available',
        price: data.metrics?.averageLifetimeValue || 0 // Use averageLifetimeValue as price or 0
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
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...data,
        // Add frontend-compatible fields
        description: data.description?.short || data.description?.long || 'No description available',
        price: data.metrics?.averageLifetimeValue || 0
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
    const {
      serviceId,
      name,
      slug,
      category,
      type,
      description,
      metrics,
      status = 'draft'
    } = req.body;

    // Validation
    if (!name || !category || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and type are required'
      });
    }

    const newServiceData = {
      serviceId: serviceId || `SVC${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      category,
      type,
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
      createdBy: 'api',
      publishedAt: status === 'published' ? new Date() : null,
      archivedAt: null
    };

    const docRef = await db.collection('layanan').doc(newServiceData.serviceId).set(newServiceData);

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