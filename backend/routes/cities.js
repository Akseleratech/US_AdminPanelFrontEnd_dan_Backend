const express = require('express');
const router = express.Router();
let { cities } = require('../data/mockData');

// GET /api/cities
router.get('/', (req, res) => {
  try {
    const { search, status, limit } = req.query;
    let filteredCities = [...cities];

    // Filter by search term
    if (search) {
      filteredCities = filteredCities.filter(city =>
        city.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (status) {
      filteredCities = filteredCities.filter(city =>
        city.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply limit
    if (limit) {
      filteredCities = filteredCities.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: filteredCities,
      total: filteredCities.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// GET /api/cities/:id
router.get('/:id', (req, res) => {
  try {
    const city = cities.find(c => c.id === parseInt(req.params.id));
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    res.json({
      success: true,
      data: city
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city',
      error: error.message
    });
  }
});

// POST /api/cities
router.post('/', (req, res) => {
  try {
    const { name, status = 'active' } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    const newCity = {
      id: Math.max(...cities.map(c => c.id)) + 1,
      name,
      locations: 0,
      totalSpaces: 0,
      status
    };

    cities.push(newCity);

    res.status(201).json({
      success: true,
      data: newCity,
      message: 'City created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create city',
      error: error.message
    });
  }
});

// PUT /api/cities/:id
router.put('/:id', (req, res) => {
  try {
    const cityIndex = cities.findIndex(c => c.id === parseInt(req.params.id));
    
    if (cityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    cities[cityIndex] = {
      ...cities[cityIndex],
      ...req.body,
      id: parseInt(req.params.id) // Ensure ID doesn't change
    };

    res.json({
      success: true,
      data: cities[cityIndex],
      message: 'City updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update city',
      error: error.message
    });
  }
});

// DELETE /api/cities/:id
router.delete('/:id', (req, res) => {
  try {
    const cityIndex = cities.findIndex(c => c.id === parseInt(req.params.id));
    
    if (cityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    cities.splice(cityIndex, 1);

    res.json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete city',
      error: error.message
    });
  }
});

module.exports = router; 