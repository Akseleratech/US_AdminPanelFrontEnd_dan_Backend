const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString,
  generateSequentialId 
} = require("./utils/helpers");

// Main buildings function
const buildings = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      if (method === 'GET') {
        if (pathParts.length === 0) {
          return await getAllBuildings(req, res);
        } else if (pathParts.length === 1) {
          return await getBuildingById(pathParts[0], req, res);
        }
      } else if (method === 'POST' && pathParts.length === 0) {
        return await createBuilding(req, res);
      } else if (method === 'PUT' && pathParts.length === 1) {
        return await updateBuilding(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        return await deleteBuilding(pathParts[0], req, res);
      }

      handleResponse(res, { message: 'Building route not found' }, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /buildings
const getAllBuildings = async (req, res) => {
  try {
    const db = getDb();
    const { search, city, status, limit } = req.query;
    let buildingsRef = db.collection('buildings');

    if (city) {
      buildingsRef = buildingsRef.where('location.city', '==', city);
    }

    if (status === 'active') {
      buildingsRef = buildingsRef.where('isActive', '==', true);
    } else if (status === 'inactive') {
      buildingsRef = buildingsRef.where('isActive', '==', false);
    }

    buildingsRef = buildingsRef.orderBy('createdAt', 'desc');
    
    const snapshot = await buildingsRef.get();
    let buildings = [];

    snapshot.forEach(doc => {
      buildings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (search) {
      const searchLower = search.toLowerCase();
      buildings = buildings.filter(building =>
        building.name?.toLowerCase().includes(searchLower) ||
        building.location?.address?.toLowerCase().includes(searchLower)
      );
    }

    if (limit) {
      buildings = buildings.slice(0, parseInt(limit));
    }

    handleResponse(res, { buildings, total: buildings.length });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /buildings/:id
const getBuildingById = async (buildingId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('buildings').doc(buildingId).get();
    
    if (!doc.exists) {
      return handleResponse(res, { message: 'Building not found' }, 404);
    }

    handleResponse(res, { id: doc.id, ...doc.data() });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /buildings
const createBuilding = async (req, res) => {
  try {
    const db = getDb();
    const { name, location, description } = req.body;

    validateRequired(req.body, ['name', 'location']);

    const buildingId = await generateSequentialId('buildings', 'BLD', 3);

    const buildingData = {
      buildingId,
      name: sanitizeString(name),
      description: sanitizeString(description || ''),
      location: {
        address: sanitizeString(location.address || ''),
        city: sanitizeString(location.city || ''),
        province: sanitizeString(location.province || ''),
        country: sanitizeString(location.country || 'Indonesia'),
        coordinates: location.coordinates || null
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('buildings').add(buildingData);

    handleResponse(res, { id: docRef.id, ...buildingData }, 201);
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /buildings/:id
const updateBuilding = async (buildingId, req, res) => {
  try {
    const db = getDb();
    
    const buildingDoc = await db.collection('buildings').doc(buildingId).get();
    if (!buildingDoc.exists) {
      return handleResponse(res, { message: 'Building not found' }, 404);
    }

    const updateData = { ...req.body };
    delete updateData.id;
    updateData.updatedAt = new Date();

    if (updateData.name) updateData.name = sanitizeString(updateData.name);
    if (updateData.description) updateData.description = sanitizeString(updateData.description);

    await db.collection('buildings').doc(buildingId).update(updateData);

    const updatedDoc = await db.collection('buildings').doc(buildingId).get();
    handleResponse(res, { id: buildingId, ...updatedDoc.data() });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /buildings/:id
const deleteBuilding = async (buildingId, req, res) => {
  try {
    const db = getDb();
    
    const buildingDoc = await db.collection('buildings').doc(buildingId).get();
    if (!buildingDoc.exists) {
      return handleResponse(res, { message: 'Building not found' }, 404);
    }

    await db.collection('buildings').doc(buildingId).delete();
    handleResponse(res, { message: 'Building deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { buildings }; 