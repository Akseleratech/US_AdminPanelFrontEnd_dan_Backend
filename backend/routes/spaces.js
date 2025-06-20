// Load environment variables
require('dotenv').config();

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/spaces
router.get('/', async (req, res) => {
  try {
    const { search, type, location, status, limit, brand, category, city } = req.query;
    let spacesRef = db.collection('spaces');

    // Build query
    if (status === 'active') {
      spacesRef = spacesRef.where('isActive', '==', true);
    } else if (status === 'inactive') {
      spacesRef = spacesRef.where('isActive', '==', false);
    }

    if (brand) {
      spacesRef = spacesRef.where('brand', '==', brand);
    }

    if (category) {
      spacesRef = spacesRef.where('category', '==', category);
    }

    if (type) {
      spacesRef = spacesRef.where('spaceType', '==', type);
    }

    if (city) {
      spacesRef = spacesRef.where('location.city', '==', city);
    }

    // Execute query
    const snapshot = await spacesRef.get();
    let spaces = [];

    snapshot.forEach(doc => {
      spaces.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Apply client-side filtering for search and location
    if (search) {
      const searchLower = search.toLowerCase();
      spaces = spaces.filter(space =>
        space.name.toLowerCase().includes(searchLower) ||
        space.description.toLowerCase().includes(searchLower) ||
        space.location?.address?.toLowerCase().includes(searchLower) ||
        space.amenities?.some(amenity => amenity.toLowerCase().includes(searchLower))
      );
    }

    if (location && !city) {
      const locationLower = location.toLowerCase();
      spaces = spaces.filter(space =>
        space.location?.city?.toLowerCase().includes(locationLower) ||
        space.location?.address?.toLowerCase().includes(locationLower) ||
        space.location?.province?.toLowerCase().includes(locationLower)
      );
    }

    // Apply limit
    if (limit) {
      spaces = spaces.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: spaces,
      total: spaces.length
    });
  } catch (error) {
    console.error('Error fetching spaces:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spaces',
      error: error.message
    });
  }
});

// GET /api/spaces/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('spaces').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Error fetching space:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch space',
      error: error.message
    });
  }
});

// POST /api/spaces
router.post('/', async (req, res) => {
  try {
    const {
      spaceId,
      name,
      description,
      brand,
      category,
      location,
      capacity,
      amenities,
      spaceType,
      pricing,
      isActive = true,
      operatingHours,
      images,
      thumbnail
    } = req.body;

    // Validation
    if (!name || !brand || !category || !location || !capacity || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Name, brand, category, location, capacity, and pricing are required'
      });
    }

    const newSpaceData = {
      spaceId: spaceId || `space_${Date.now()}`,
      name,
      description: description || `Professional ${category} space`,
      brand,
      category,
      location: {
        address: location.address,
        city: location.city,
        province: location.province,
        postalCode: location.postalCode,
        country: location.country || 'Indonesia',
        coordinates: location.coordinates,
        latitude: location.latitude,
        longitude: location.longitude
      },
      capacity: parseInt(capacity),
      amenities: amenities || [],
      spaceType: spaceType || category,
      pricing: {
        hourly: pricing.hourly || 0,
        daily: pricing.daily || 0,
        monthly: pricing.monthly || 0,
        currency: pricing.currency || 'IDR'
      },
      isActive,
      operatingHours: operatingHours || {
        monday: { open: "08:00", close: "22:00" },
        tuesday: { open: "08:00", close: "22:00" },
        wednesday: { open: "08:00", close: "22:00" },
        thursday: { open: "08:00", close: "22:00" },
        friday: { open: "08:00", close: "22:00" },
        saturday: { open: "09:00", close: "18:00" },
        sunday: { open: "09:00", close: "18:00" }
      },
      images: images || [],
      thumbnail: thumbnail || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'api'
    };

    const docRef = await db.collection('spaces').doc(newSpaceData.spaceId).set(newSpaceData);

    res.status(201).json({
      success: true,
      data: {
        id: newSpaceData.spaceId,
        ...newSpaceData
      },
      message: 'Space created successfully'
    });
  } catch (error) {
    console.error('Error creating space:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create space',
      error: error.message
    });
  }
});

// PUT /api/spaces/:id
router.put('/:id', async (req, res) => {
  try {
    const spaceRef = db.collection('spaces').doc(req.params.id);
    const doc = await spaceRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: 'api'
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await spaceRef.update(updateData);

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
      error: error.message
    });
  }
});

// DELETE /api/spaces/:id
router.delete('/:id', async (req, res) => {
  try {
    const spaceRef = db.collection('spaces').doc(req.params.id);
    const doc = await spaceRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    await spaceRef.delete();

    res.json({
      success: true,
      message: 'Space deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting space:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete space',
      error: error.message
    });
  }
});

module.exports = router; 