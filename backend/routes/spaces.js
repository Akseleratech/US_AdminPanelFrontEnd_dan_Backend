const express = require('express');
const router = express.Router();
let { spaces } = require('../data/mockData');

// GET /api/spaces
router.get('/', (req, res) => {
  try {
    const { search, type, location, status, limit } = req.query;
    let filteredSpaces = [...spaces];

    // Filter by search term
    if (search) {
      filteredSpaces = filteredSpaces.filter(space =>
        space.name.toLowerCase().includes(search.toLowerCase()) ||
        space.type.toLowerCase().includes(search.toLowerCase()) ||
        space.location.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by type
    if (type) {
      filteredSpaces = filteredSpaces.filter(space =>
        space.type.toLowerCase() === type.toLowerCase()
      );
    }

    // Filter by location
    if (location) {
      filteredSpaces = filteredSpaces.filter(space =>
        space.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Filter by status
    if (status) {
      filteredSpaces = filteredSpaces.filter(space =>
        space.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply limit
    if (limit) {
      filteredSpaces = filteredSpaces.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: filteredSpaces,
      total: filteredSpaces.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spaces',
      error: error.message
    });
  }
});

// GET /api/spaces/:id
router.get('/:id', (req, res) => {
  try {
    const space = spaces.find(s => s.id === parseInt(req.params.id));
    
    if (!space) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    res.json({
      success: true,
      data: space
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch space',
      error: error.message
    });
  }
});

// POST /api/spaces
router.post('/', (req, res) => {
  try {
    const { name, type, location, capacity, price, status = 'available' } = req.body;

    // Validation
    if (!name || !type || !location || !capacity || !price) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const newSpace = {
      id: Math.max(...spaces.map(s => s.id)) + 1,
      name,
      type,
      location,
      capacity: parseInt(capacity),
      price: parseInt(price),
      status
    };

    spaces.push(newSpace);

    res.status(201).json({
      success: true,
      data: newSpace,
      message: 'Space created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create space',
      error: error.message
    });
  }
});

// PUT /api/spaces/:id
router.put('/:id', (req, res) => {
  try {
    const spaceIndex = spaces.findIndex(s => s.id === parseInt(req.params.id));
    
    if (spaceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    spaces[spaceIndex] = {
      ...spaces[spaceIndex],
      ...req.body,
      id: parseInt(req.params.id) // Ensure ID doesn't change
    };

    res.json({
      success: true,
      data: spaces[spaceIndex],
      message: 'Space updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update space',
      error: error.message
    });
  }
});

// DELETE /api/spaces/:id
router.delete('/:id', (req, res) => {
  try {
    const spaceIndex = spaces.findIndex(s => s.id === parseInt(req.params.id));
    
    if (spaceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Space not found'
      });
    }

    spaces.splice(spaceIndex, 1);

    res.json({
      success: true,
      message: 'Space deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete space',
      error: error.message
    });
  }
});

module.exports = router; 