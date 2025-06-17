const express = require('express');
const router = express.Router();
const { dashboardStats, recentOrders } = require('../data/mockData');

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  try {
    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

// GET /api/dashboard/recent-orders
router.get('/recent-orders', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const limitedOrders = recentOrders.slice(0, limit);
    
    res.json({
      success: true,
      data: limitedOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent orders',
      error: error.message
    });
  }
});

// GET /api/dashboard/quick-stats
router.get('/quick-stats', (req, res) => {
  try {
    const quickStats = {
      occupancyRate: '78%',
      averageBookingValue: 'Rp 1,250,000',
      customerSatisfaction: '4.8/5',
      activeLocations: '11'
    };
    
    res.json({
      success: true,
      data: quickStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick stats',
      error: error.message
    });
  }
});

module.exports = router; 