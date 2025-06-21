// Load environment variables
require('dotenv').config();

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/cities
router.get('/', async (req, res) => {
  try {
    const { search, status, limit, featured } = req.query;
    let citiesRef = db.collection('cities');

    // Build query
    if (status === 'active') {
      citiesRef = citiesRef.where('isActive', '==', true);
    } else if (status === 'inactive') {
      citiesRef = citiesRef.where('isActive', '==', false);
    }

    if (featured === 'true') {
      citiesRef = citiesRef.where('display.featured', '==', true);
    }

    // Order by display order
    citiesRef = citiesRef.orderBy('display.order', 'asc');

    // Execute query
    const snapshot = await citiesRef.get();
    let cities = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const cityData = {
        id: doc.id,
        name: data.name,
        province: data.province,
        cityId: data.cityId,
        country: data.country,
        location: data.location,
        postalCodes: data.postalCodes,
        timezone: data.timezone,
        utcOffset: data.utcOffset,
        statistics: data.statistics,
        search: data.search,
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // Add frontend-compatible fields
        locations: data.statistics?.totalSpaces || 0, // Frontend expects 'locations' field
        totalSpaces: data.statistics?.totalSpaces || 0,
        status: data.isActive ? 'active' : 'inactive' // Convert boolean to string
      };
      cities.push(cityData);
    });

    // Apply client-side filtering for search (since Firestore has limited text search)
    if (search) {
      const searchLower = search.toLowerCase();
      cities = cities.filter(city =>
        city.name.toLowerCase().includes(searchLower) ||
        city.province?.toLowerCase().includes(searchLower) ||
        city.search?.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower)) ||
        city.search?.aliases?.some(alias => alias.toLowerCase().includes(searchLower))
      );
    }

    // Apply limit
    if (limit) {
      cities = cities.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: cities,
      total: cities.length
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// GET /api/cities/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('cities').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    const data = doc.data();
    res.json({
      success: true,
      data: {
        id: doc.id,
        name: data.name,
        province: data.province,
        cityId: data.cityId,
        country: data.country,
        location: data.location,
        postalCodes: data.postalCodes,
        timezone: data.timezone,
        utcOffset: data.utcOffset,
        statistics: data.statistics,
        search: data.search,
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // Add frontend-compatible fields
        locations: data.statistics?.totalSpaces || 0,
        totalSpaces: data.statistics?.totalSpaces || 0,
        status: data.isActive ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city',
      error: error.message
    });
  }
});

// POST /api/cities
router.post('/', async (req, res) => {
  try {
    const {
      cityId,
      name,
      province,
      country,
      location,
      postalCodes,
      timezone,
      utcOffset,
      search,
      isActive = true
    } = req.body;

    // Validation
    if (!name || !province || !country) {
      return res.status(400).json({
        success: false,
        message: 'City name, province, and country are required'
      });
    }

    const newCityData = {
      cityId: cityId || `CTY${Date.now()}`,
      name,
      province,
      country,
      location,
      postalCodes: postalCodes || [],
      timezone: timezone || 'Asia/Jakarta',
      utcOffset: utcOffset || '+07:00',
      statistics: {
        totalSpaces: 0,
        activeSpaces: 0
      },
      search: search || {
        keywords: [name.toLowerCase()],
        aliases: [],
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: `Co-working Spaces in ${name}`,
        metaDescription: `Find and book workspaces in ${name}`
      },
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'api'
    };

    await db.collection('cities').doc(newCityData.cityId).set(newCityData);

    res.status(201).json({
      success: true,
      data: {
        id: newCityData.cityId,
        ...newCityData,
        // Add frontend-compatible fields
        locations: newCityData.statistics.totalSpaces,
        totalSpaces: newCityData.statistics.totalSpaces,
        status: newCityData.isActive ? 'active' : 'inactive'
      },
      message: 'City created successfully'
    });
  } catch (error) {
    console.error('Error creating city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: error.message
    });
  }
});

// PUT /api/cities/:id
router.put('/:id', async (req, res) => {
  try {
    const cityRef = db.collection('cities').doc(req.params.id);
    const doc = await cityRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
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

    await cityRef.update(updateData);

    // Get updated document
    const updatedDoc = await cityRef.get();
    const data = updatedDoc.data();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        name: data.name,
        province: data.province,
        cityId: data.cityId,
        country: data.country,
        location: data.location,
        postalCodes: data.postalCodes,
        timezone: data.timezone,
        utcOffset: data.utcOffset,
        statistics: data.statistics,
        search: data.search,
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // Add frontend-compatible fields
        locations: data.statistics?.totalSpaces || 0,
        totalSpaces: data.statistics?.totalSpaces || 0,
        status: data.isActive ? 'active' : 'inactive'
      },
      message: 'City updated successfully'
    });
  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update city',
      error: error.message
    });
  }
});

// DELETE /api/cities/:id
router.delete('/:id', async (req, res) => {
  try {
    const cityRef = db.collection('cities').doc(req.params.id);
    const doc = await cityRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    await cityRef.delete();

    res.json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete city',
      error: error.message
    });
  }
});

module.exports = router; 