const express = require('express');
const router = express.Router();
let { recentOrders } = require('../data/mockData');

// GET /api/orders
router.get('/', (req, res) => {
  try {
    const { search, status, limit } = req.query;
    let filteredOrders = [...recentOrders];

    // Filter by search term
    if (search) {
      filteredOrders = filteredOrders.filter(order =>
        order.customer.toLowerCase().includes(search.toLowerCase()) ||
        order.service.toLowerCase().includes(search.toLowerCase()) ||
        order.location.toLowerCase().includes(search.toLowerCase()) ||
        order.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (status) {
      filteredOrders = filteredOrders.filter(order =>
        order.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply limit
    if (limit) {
      filteredOrders = filteredOrders.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: filteredOrders,
      total: filteredOrders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  try {
    const order = recentOrders.find(o => o.id === req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// PUT /api/orders/:id
router.put('/:id', (req, res) => {
  try {
    const orderIndex = recentOrders.findIndex(o => o.id === req.params.id);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    recentOrders[orderIndex] = {
      ...recentOrders[orderIndex],
      ...req.body
    };

    res.json({
      success: true,
      data: recentOrders[orderIndex],
      message: 'Order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', (req, res) => {
  try {
    const orderIndex = recentOrders.findIndex(o => o.id === req.params.id);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    recentOrders.splice(orderIndex, 1);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
});

module.exports = router; 