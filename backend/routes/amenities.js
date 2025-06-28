// Load environment variables
require('dotenv').config();

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/amenities - Get all amenities
router.get('/', async (req, res) => {
  try {
    const { search, status, category, type } = req.query;
    let amenitiesRef = db.collection('amenities');

    // Build query
    if (status === 'active') {
      amenitiesRef = amenitiesRef.where('isActive', '==', true);
    } else if (status === 'inactive') {
      amenitiesRef = amenitiesRef.where('isActive', '==', false);
    }

    if (category) {
      amenitiesRef = amenitiesRef.where('category', '==', category);
    }

    if (type) {
      amenitiesRef = amenitiesRef.where('type', '==', type);
    }

    // Order by name for consistency (only if no other filters to avoid index requirements)
    if (!status && !category && !type) {
      amenitiesRef = amenitiesRef.orderBy('name', 'asc');
    }

    // Execute query
    const snapshot = await amenitiesRef.get();
    let amenities = [];

    snapshot.forEach(doc => {
      amenities.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Apply client-side search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      amenities = amenities.filter(amenity =>
        amenity.name.toLowerCase().includes(searchLower) ||
        amenity.description?.toLowerCase().includes(searchLower) ||
        amenity.category?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: amenities,
      total: amenities.length
    });
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amenities',
      error: error.message
    });
  }
});

// GET /api/amenities/:id - Get single amenity
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('amenities').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
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
    console.error('Error fetching amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amenity',
      error: error.message
    });
  }
});

// POST /api/amenities - Create new amenity
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      type,
      icon,
      isActive = true
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if amenity with same name already exists
    const existingSnapshot = await db.collection('amenities')
      .where('name', '==', name.trim())
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'Amenity with this name already exists'
      });
    }

    const newAmenityData = {
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'general',
      type: type || 'common',
      icon: icon || '',
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'api'
    };

    const docRef = await db.collection('amenities').add(newAmenityData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newAmenityData
      },
      message: 'Amenity created successfully'
    });
  } catch (error) {
    console.error('Error creating amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create amenity',
      error: error.message
    });
  }
});

// PUT /api/amenities/:id - Update amenity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      type,
      icon,
      isActive
    } = req.body;

    // Check if amenity exists
    const doc = await db.collection('amenities').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if another amenity with same name exists (excluding current one)
    const existingSnapshot = await db.collection('amenities')
      .where('name', '==', name.trim())
      .get();

    const duplicateExists = existingSnapshot.docs.some(doc => doc.id !== id);
    if (duplicateExists) {
      return res.status(400).json({
        success: false,
        message: 'Amenity with this name already exists'
      });
    }

    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'general',
      type: type || 'common',
      icon: icon || '',
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date()
    };

    await db.collection('amenities').doc(id).update(updateData);

    res.json({
      success: true,
      data: {
        id,
        ...updateData
      },
      message: 'Amenity updated successfully'
    });
  } catch (error) {
    console.error('Error updating amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update amenity',
      error: error.message
    });
  }
});

// DELETE /api/amenities/:id - Delete amenity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if amenity exists
    const doc = await db.collection('amenities').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    // Check if amenity is being used in any spaces
    const spacesSnapshot = await db.collection('spaces')
      .where('amenities', 'array-contains', doc.data().name)
      .get();

    if (!spacesSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete amenity: it is being used in existing spaces',
        usedInSpaces: spacesSnapshot.size
      });
    }

    await db.collection('amenities').doc(id).delete();

    res.json({
      success: true,
      message: 'Amenity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete amenity',
      error: error.message
    });
  }
});

// PATCH /api/amenities/:id/toggle - Toggle amenity active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if amenity exists
    const doc = await db.collection('amenities').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    const currentData = doc.data();
    const newStatus = !currentData.isActive;

    await db.collection('amenities').doc(id).update({
      isActive: newStatus,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: {
        id,
        ...currentData,
        isActive: newStatus,
        updatedAt: new Date()
      },
      message: `Amenity ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling amenity status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle amenity status',
      error: error.message
    });
  }
});

module.exports = router; 