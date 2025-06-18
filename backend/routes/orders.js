const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');
const { optionalAuth } = require('../middleware/auth');

// GET /api/orders
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, status, limit } = req.query;
    
    // Get all orders from Firebase
    let orders = await firebaseService.getCollection('orders');

    // Filter by search term
    if (search) {
      orders = orders.filter(order =>
        order.customer?.toLowerCase().includes(search.toLowerCase()) ||
        order.service?.toLowerCase().includes(search.toLowerCase()) ||
        order.location?.toLowerCase().includes(search.toLowerCase()) ||
        order.id?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (status) {
      orders = orders.filter(order =>
        order.status?.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply limit
    if (limit) {
      orders = orders.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// GET /api/orders/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const order = await firebaseService.getDocument('orders', req.params.id);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    if (error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// PUT /api/orders/:id
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    await firebaseService.updateDocument('orders', req.params.id, req.body);
    const updatedOrder = await firebaseService.getDocument('orders', req.params.id);

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
});

// POST /api/orders
router.post('/', optionalAuth, async (req, res) => {
  try {
    const orderId = await firebaseService.addDocument('orders', req.body);
    const newOrder = await firebaseService.getDocument('orders', orderId);

    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    await firebaseService.deleteDocument('orders', req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
});

module.exports = router; 