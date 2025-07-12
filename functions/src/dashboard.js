const {onRequest} = require('firebase-functions/v2/https');
const cors = require('./utils/corsConfig');
const {getDb, handleResponse, handleError} = require('./utils/helpers');

// Main dashboard function that handles all dashboard routes
const dashboard = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const {method, url} = req;
      const path = url.split('?')[0];

      // Route handling
      if (method === 'GET') {
        if (path.endsWith('/stats')) {
          return await getDashboardStats(req, res);
        } else if (path.endsWith('/recent-orders')) {
          return await getRecentOrders(req, res);
        } else if (path.endsWith('/quick-stats')) {
          return await getQuickStats(req, res);
        }
      }

      // 404 for unknown routes
      handleResponse(res, {message: 'Dashboard route not found'}, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const db = getDb();

    // Get real-time stats from Firebase collections
    const [citiesSnapshot, layananSnapshot, spacesSnapshot, ordersSnapshot] = await Promise.all([
      db.collection('cities').get(),
      db.collection('layanan').get(),
      db.collection('spaces').get(),
      db.collection('orders').get(),
    ]);

    // Calculate stats
    const totalCities = citiesSnapshot.size;
    const activeCities = citiesSnapshot.docs.filter((doc) => doc.data().isActive).length;

    const totalServices = layananSnapshot.size;
    const publishedServices = layananSnapshot.docs.filter((doc) => doc.data().status === 'published').length;

    const totalSpaces = spacesSnapshot.size;
    const activeSpaces = spacesSnapshot.docs.filter((doc) => doc.data().isActive).length;

    const _totalOrders = ordersSnapshot.size;
    const pendingOrders = ordersSnapshot.docs.filter((doc) => doc.data().status === 'pending').length;
    const confirmedOrders = ordersSnapshot.docs.filter((doc) => doc.data().status === 'confirmed').length;
    const activeOrders = ordersSnapshot.docs.filter((doc) => doc.data().status === 'active').length;
    const completedOrders = ordersSnapshot.docs.filter((doc) => doc.data().status === 'completed').length;
    const cancelledOrders = ordersSnapshot.docs.filter((doc) => doc.data().status === 'cancelled').length;

    // Calculate revenue from completed orders
    let totalRevenue = 0;
    ordersSnapshot.docs.forEach((doc) => {
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
        totalOrders: _totalOrders,
        pendingOrders,
        confirmedOrders,
        activeOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
      },
      performance: {
        occupancyRate: activeSpaces > 0 ? Math.round(((activeOrders + completedOrders) / totalSpaces) * 100) : 0,
        completionRate: _totalOrders > 0 ? Math.round((completedOrders / _totalOrders) * 100) : 0,
        averageOrderValue: completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0,
      },
      growth: {
        newCitiesThisMonth: 0, // Would need createdAt filtering for real calculation
        newServicesThisMonth: 0,
        newSpacesThisMonth: 0,
        newOrdersThisMonth: 0,
      },
    };

    handleResponse(res, dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    handleError(res, error);
  }
};

// GET /dashboard/recent-orders
const getRecentOrders = async (req, res) => {
  try {
    const db = getDb();
    const limit = parseInt(req.query.limit) || 5;

    // Get recent orders from Firebase
    const ordersSnapshot = await db.collection('orders')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

    const recentOrders = [];
    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Ensure date fields are serialized as ISO strings (same as in orders.js)
      const startDate = data.startDate && data.startDate.toDate ? data.startDate.toDate().toISOString() : data.startDate;
      const endDate = data.endDate && data.endDate.toDate ? data.endDate.toDate().toISOString() : data.endDate;
      const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
      
      recentOrders.push({
        id: doc.id,
        ...data,
        startDate,
        endDate,
        createdAt,
      });
    });

    handleResponse(res, recentOrders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);

    // Fallback: if orders collection doesn't exist or has no data, return empty array
    handleResponse(res, []);
  }
};

// GET /dashboard/quick-stats
const getQuickStats = async (req, res) => {
  try {
    const db = getDb();

    // Get real-time quick stats
    const [spacesSnapshot, ordersSnapshot, citiesSnapshot] = await Promise.all([
      db.collection('spaces').get(),
      db.collection('orders').get(),
      db.collection('cities').get(),
    ]);

    const totalSpaces = spacesSnapshot.size;
    const activeSpaces = spacesSnapshot.docs.filter((doc) => doc.data().isActive).length;
    const _totalOrders = ordersSnapshot.size;
    const completedOrders = ordersSnapshot.docs.filter((doc) => doc.data().status === 'completed').length;
    const activeCities = citiesSnapshot.docs.filter((doc) => doc.data().isActive).length;

    // Calculate total revenue
    let totalRevenue = 0;
    ordersSnapshot.docs.forEach((doc) => {
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
      activeLocations: activeCities.toString(),
    };

    handleResponse(res, quickStats);
  } catch (error) {
    console.error('Error fetching quick stats:', error);

    // Fallback with default values
    const quickStats = {
      occupancyRate: '0%',
      averageBookingValue: 'Rp 0',
      customerSatisfaction: '4.8/5',
      activeLocations: '0',
    };

    handleResponse(res, quickStats);
  }
};

module.exports = {dashboard};
