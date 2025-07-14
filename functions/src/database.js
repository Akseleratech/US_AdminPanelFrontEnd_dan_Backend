const {onRequest} = require('firebase-functions/v2/https');
const cors = require('cors')({origin: true});
const {getDb, verifyAdminAuth, sanitizeString} = require('./utils/helpers');
const {
  handleResponse,
  handleError,
  handleAuthError,
} = require('./utils/errorHandler');
const {applyAdminOperationRateLimit} = require('./utils/applyRateLimit');

// Sanitize and format database query parameters
function sanitizeDatabaseQuery(query) {
  const sanitized = {};

  // Database operations may have these query parameters
  if (query.collection) sanitized.collection = sanitizeString(query.collection);
  if (query.action) sanitized.action = sanitizeString(query.action);
  if (query.force) sanitized.force = query.force === 'true';

  return sanitized;
}

// Main database function
const database = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const {method, url} = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter((part) => part);
      if (pathParts[0] === 'api') pathParts.shift();
      // NEW: strip 'database' segment
      if (pathParts[0] === 'database') pathParts.shift();

      if (method === 'GET') {
        if (pathParts.length === 1 && pathParts[0] === 'collections') {
          return await getCollections(req, res);
        } else if (pathParts.length === 1 && pathParts[0] === 'stats') {
          return await getDatabaseStats(req, res);
        } else if (pathParts.length === 1 && pathParts[0] === 'health') {
          return await getDatabaseHealth(req, res);
        }
      } else if (method === 'POST') {
        // Apply very strict rate limiting for admin operations
        const rateLimitAllowed = await applyAdminOperationRateLimit(req, res);
        if (!rateLimitAllowed) {
          return; // Rate limit exceeded, response already sent
        }

        // Require admin auth for all POST operations (dangerous operations)
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }

        if (pathParts.length === 1 && pathParts[0] === 'cleanup') {
          return await cleanupDatabase(req, res);
        } else if (pathParts.length === 1 && pathParts[0] === 'seed') {
          return await seedDatabase(req, res);
        }
      }

      handleResponse(res, {message: 'Database route not found'}, 404);
    } catch (error) {
      return handleError(res, error, 500, req);
    }
  });
});

// GET /database/collections
const getCollections = async (req, res) => {
  try {
    const db = getDb();

    const collections = [
      'cities', 'layanan', 'spaces', 'buildings',
      'orders', 'amenities', 'counters',
    ];

    const collectionInfo = [];

    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      collectionInfo.push({
        name: collectionName,
        documentCount: snapshot.size,
        lastUpdated: new Date().toISOString(),
      });
    }

    handleResponse(res, {
      collections: collectionInfo,
      totalCollections: collections.length,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /database/stats
const getDatabaseStats = async (req, res) => {
  try {
    const db = getDb();

    const [
      citiesSnapshot,
      servicesSnapshot,
      spacesSnapshot,
      buildingsSnapshot,
      ordersSnapshot,
      amenitiesSnapshot,
    ] = await Promise.all([
      db.collection('cities').get(),
      db.collection('layanan').get(),
      db.collection('spaces').get(),
      db.collection('buildings').get(),
      db.collection('orders').get(),
      db.collection('amenities').get(),
    ]);

    const stats = {
      cities: {
        total: citiesSnapshot.size,
        active: citiesSnapshot.docs.filter((doc) => doc.data().isActive).length,
      },
      services: {
        total: servicesSnapshot.size,
        published: servicesSnapshot.docs.filter((doc) => doc.data().status === 'published').length,
      },
      spaces: {
        total: spacesSnapshot.size,
        active: spacesSnapshot.docs.filter((doc) => doc.data().isActive).length,
      },
      buildings: {
        total: buildingsSnapshot.size,
        active: buildingsSnapshot.docs.filter((doc) => doc.data().isActive).length,
      },
      orders: {
        total: ordersSnapshot.size,
        pending: ordersSnapshot.docs.filter((doc) => doc.data().status === 'pending').length,
        completed: ordersSnapshot.docs.filter((doc) => doc.data().status === 'completed').length,
      },
      amenities: {
        total: amenitiesSnapshot.size,
        active: amenitiesSnapshot.docs.filter((doc) => doc.data().isActive).length,
      },
    };

    handleResponse(res, stats);
  } catch (error) {
    handleError(res, error);
  }
};

// GET /database/health
const getDatabaseHealth = async (req, res) => {
  try {
    const db = getDb();

    // Test basic connectivity
    await db.collection('cities').limit(1).get();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connection: 'ok',
      latency: Date.now() - new Date().getTime() + 'ms',
    };

    handleResponse(res, health);
  } catch (error) {
    handleResponse(res, {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      connection: 'failed',
      error: error.message,
    }, 500);
  }
};

// POST /database/cleanup
const cleanupDatabase = async (req, res) => {
  try {
    const {collection, dryRun = true} = req.body;

    if (!collection) {
      return handleResponse(res, {message: 'Collection name is required'}, 400);
    }

    const db = getDb();
    const snapshot = await db.collection(collection).get();

    let cleanupCount = 0;
    const issues = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Check for common issues
      if (!data.createdAt) {
        issues.push({id: doc.id, issue: 'Missing createdAt'});
        cleanupCount++;
      }

      if (!data.updatedAt) {
        issues.push({id: doc.id, issue: 'Missing updatedAt'});
        cleanupCount++;
      }
    });

    if (!dryRun && cleanupCount > 0) {
      // Perform actual cleanup (implement as needed)
      console.log(`Would cleanup ${cleanupCount} documents in ${collection}`);
    }

    handleResponse(res, {
      collection,
      dryRun,
      totalDocuments: snapshot.size,
      issuesFound: cleanupCount,
      issues: issues.slice(0, 10), // Return first 10 issues
    });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /database/seed
const seedDatabase = async (req, res) => {
  try {
    const {type} = req.body;

    if (type !== 'amenities') {
      return handleResponse(res, {message: 'Only amenities seeding supported'}, 400);
    }

    const db = getDb();

    const defaultAmenities = [
      {name: 'WiFi', category: 'connectivity', icon: 'wifi'},
      {name: 'Coffee', category: 'food', icon: 'coffee'},
      {name: 'Parking', category: 'facility', icon: 'car'},
      {name: 'Meeting Room', category: 'space', icon: 'users'},
      {name: 'Printer', category: 'equipment', icon: 'printer'},
    ];

    let createdCount = 0;

    for (const amenity of defaultAmenities) {
      // Check if amenity already exists
      const existing = await db.collection('amenities')
          .where('name', '==', amenity.name)
          .get();

      if (existing.empty) {
        await db.collection('amenities').add({
          ...amenity,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        createdCount++;
      }
    }

    handleResponse(res, {
      type,
      created: createdCount,
      total: defaultAmenities.length,
      message: `Created ${createdCount} new amenities`,
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {database};
