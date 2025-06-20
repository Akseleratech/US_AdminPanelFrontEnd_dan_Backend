// Load environment variables
require('dotenv').config();

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    // Get real-time stats from Firebase collections
    const [citiesSnapshot, layananSnapshot, spacesSnapshot, ordersSnapshot] = await Promise.all([
      db.collection('cities').get(),
      db.collection('layanan').get(),
      db.collection('spaces').get(),
      db.collection('orders').get()
    ]);

    // Calculate stats
    const totalCities = citiesSnapshot.size;
    const activeCities = citiesSnapshot.docs.filter(doc => doc.data().isActive).length;
    
    const totalServices = layananSnapshot.size;
    const publishedServices = layananSnapshot.docs.filter(doc => doc.data().status === 'published').length;
    
    const totalSpaces = spacesSnapshot.size;
    const activeSpaces = spacesSnapshot.docs.filter(doc => doc.data().isActive).length;
    
    const totalOrders = ordersSnapshot.size;
    const pendingOrders = ordersSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const completedOrders = ordersSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
    
    // Calculate revenue from completed orders
    let totalRevenue = 0;
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      if (order.status === 'completed' && order.amount) {
        totalRevenue += order.amount;
      }
    });

    const dashboardStats = {
      overview: {
        totalCities,
        activeCities,
        totalServices,
        publishedServices,
        totalSpaces,
        activeSpaces,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue
      },
      performance: {
        occupancyRate: activeSpaces > 0 ? Math.round((completedOrders / totalSpaces) * 100) : 0,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        averageOrderValue: completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0
      },
      growth: {
        newCitiesThisMonth: 0, // Would need createdAt filtering for real calculation
        newServicesThisMonth: 0,
        newSpacesThisMonth: 0,
        newOrdersThisMonth: 0
      }
    };

    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

// GET /api/dashboard/recent-orders
router.get('/recent-orders', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    // Get recent orders from Firebase
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const recentOrders = [];
    ordersSnapshot.forEach(doc => {
      recentOrders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: recentOrders
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    
    // Fallback: if orders collection doesn't exist or has no data, return empty array
    res.json({
      success: true,
      data: []
    });
  }
});

// GET /api/dashboard/quick-stats
router.get('/quick-stats', async (req, res) => {
  try {
    // Get real-time quick stats
    const [spacesSnapshot, ordersSnapshot, citiesSnapshot] = await Promise.all([
      db.collection('spaces').get(),
      db.collection('orders').get(),
      db.collection('cities').get()
    ]);

    const totalSpaces = spacesSnapshot.size;
    const activeSpaces = spacesSnapshot.docs.filter(doc => doc.data().isActive).length;
    const totalOrders = ordersSnapshot.size;
    const completedOrders = ordersSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
    const activeCities = citiesSnapshot.docs.filter(doc => doc.data().isActive).length;

    // Calculate total revenue
    let totalRevenue = 0;
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      if (order.status === 'completed' && order.amount) {
        totalRevenue += order.amount;
      }
    });

    const occupancyRate = activeSpaces > 0 ? Math.round((completedOrders / totalSpaces) * 100) : 0;
    const averageBookingValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;
    
    const quickStats = {
      occupancyRate: `${occupancyRate}%`,
      averageBookingValue: `Rp ${averageBookingValue.toLocaleString('id-ID')}`,
      customerSatisfaction: '4.8/5', // This could be calculated from reviews/ratings if available
      activeLocations: activeCities.toString()
    };
    
    res.json({
      success: true,
      data: quickStats
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    
    // Fallback with default values
    const quickStats = {
      occupancyRate: '0%',
      averageBookingValue: 'Rp 0',
      customerSatisfaction: '4.8/5',
      activeLocations: '0'
    };
    
    res.json({
      success: true,
      data: quickStats
    });
  }
});

module.exports = router; 