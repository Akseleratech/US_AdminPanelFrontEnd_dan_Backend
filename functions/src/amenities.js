const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString,
  generateId 
} = require("./utils/helpers");

// Main amenities function
const amenities = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      if (method === 'GET') {
        if (pathParts.length === 0) {
          return await getAllAmenities(req, res);
        } else if (pathParts.length === 1) {
          return await getAmenityById(pathParts[0], req, res);
        }
      } else if (method === 'POST' && pathParts.length === 0) {
        return await createAmenity(req, res);
      } else if (method === 'PUT' && pathParts.length === 1) {
        return await updateAmenity(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        return await deleteAmenity(pathParts[0], req, res);
      }

      handleResponse(res, { message: 'Amenity route not found' }, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /amenities
const getAllAmenities = async (req, res) => {
  try {
    const db = getDb();
    const { search, status, limit } = req.query;
    let amenitiesRef = db.collection('amenities');

    if (status === 'active') {
      amenitiesRef = amenitiesRef.where('isActive', '==', true);
    }

    amenitiesRef = amenitiesRef.orderBy('name');
    
    const snapshot = await amenitiesRef.get();
    let amenities = [];

    snapshot.forEach(doc => {
      amenities.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (search) {
      const searchLower = search.toLowerCase();
      amenities = amenities.filter(amenity =>
        amenity.name?.toLowerCase().includes(searchLower) ||
        amenity.description?.toLowerCase().includes(searchLower)
      );
    }

    if (limit) {
      amenities = amenities.slice(0, parseInt(limit));
    }

    handleResponse(res, { amenities, total: amenities.length });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /amenities/:id
const getAmenityById = async (amenityId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('amenities').doc(amenityId).get();
    
    if (!doc.exists) {
      return handleResponse(res, { message: 'Amenity not found' }, 404);
    }

    handleResponse(res, { id: doc.id, ...doc.data() });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /amenities
const createAmenity = async (req, res) => {
  try {
    const db = getDb();
    const { name, description, icon } = req.body;

    validateRequired(req.body, ['name']);

    const amenityData = {
      name: sanitizeString(name),
      description: sanitizeString(description || ''),
      icon: sanitizeString(icon || ''),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('amenities').add(amenityData);

    handleResponse(res, { id: docRef.id, ...amenityData }, 201);
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /amenities/:id
const updateAmenity = async (amenityId, req, res) => {
  try {
    const db = getDb();
    
    const amenityDoc = await db.collection('amenities').doc(amenityId).get();
    if (!amenityDoc.exists) {
      return handleResponse(res, { message: 'Amenity not found' }, 404);
    }

    const updateData = { ...req.body };
    delete updateData.id;
    updateData.updatedAt = new Date();

    if (updateData.name) updateData.name = sanitizeString(updateData.name);
    if (updateData.description) updateData.description = sanitizeString(updateData.description);

    await db.collection('amenities').doc(amenityId).update(updateData);

    const updatedDoc = await db.collection('amenities').doc(amenityId).get();
    handleResponse(res, { id: amenityId, ...updatedDoc.data() });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /amenities/:id
const deleteAmenity = async (amenityId, req, res) => {
  try {
    const db = getDb();
    
    const amenityDoc = await db.collection('amenities').doc(amenityId).get();
    if (!amenityDoc.exists) {
      return handleResponse(res, { message: 'Amenity not found' }, 404);
    }

    await db.collection('amenities').doc(amenityId).delete();
    handleResponse(res, { message: 'Amenity deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { amenities }; 