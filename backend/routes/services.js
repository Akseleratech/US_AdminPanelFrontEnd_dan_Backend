const express = require('express');
const router = express.Router();
let { services } = require('../data/mockData');

// GET /api/services
router.get('/', (req, res) => {
  try {
    const { search, status, limit } = req.query;
    let filteredServices = [...services];

    // Filter by search term
    if (search) {
      filteredServices = filteredServices.filter(service =>
        service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (status) {
      filteredServices = filteredServices.filter(service =>
        service.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply limit
    if (limit) {
      filteredServices = filteredServices.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: filteredServices,
      total: filteredServices.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

// GET /api/services/:id
router.get('/:id', (req, res) => {
  try {
    const service = services.find(s => s.id === parseInt(req.params.id));
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
});

// POST /api/services
router.post('/', (req, res) => {
  try {
    const { name, description, price, status = 'active' } = req.body;

    // Validation
    if (!name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and price are required'
      });
    }

    const newService = {
      id: Math.max(...services.map(s => s.id)) + 1,
      name,
      description,
      price: parseInt(price),
      status
    };

    services.push(newService);

    res.status(201).json({
      success: true,
      data: newService,
      message: 'Service created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
});

// PUT /api/services/:id
router.put('/:id', (req, res) => {
  try {
    const serviceIndex = services.findIndex(s => s.id === parseInt(req.params.id));
    
    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    services[serviceIndex] = {
      ...services[serviceIndex],
      ...req.body,
      id: parseInt(req.params.id) // Ensure ID doesn't change
    };

    res.json({
      success: true,
      data: services[serviceIndex],
      message: 'Service updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
});

// DELETE /api/services/:id
router.delete('/:id', (req, res) => {
  try {
    const serviceIndex = services.findIndex(s => s.id === parseInt(req.params.id));
    
    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    services.splice(serviceIndex, 1);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
});

module.exports = router; 