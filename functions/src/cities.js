const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString,
  parseQueryParams,
  generateSequentialId 
} = require("./utils/helpers");
const { uploadImageFromBase64, deleteImage } = require("./services/imageService");

// Main cities function that handles all city routes
const cities = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      // Route handling
      if (method === 'GET') {
        if (pathParts.length === 0) {
          // GET /cities
          return await getAllCities(req, res);
        } else if (pathParts.length === 1) {
          // GET /cities/:id
          return await getCityById(pathParts[0], req, res);
        }
      } else if (method === 'POST') {
        if (pathParts.length === 0) {
          // POST /cities
          return await createCity(req, res);
        } else if (pathParts.length === 2 && pathParts[1] === 'upload-image') {
          // POST /cities/:id/upload-image
          return await uploadCityImage(pathParts[0], req, res);
        }
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /cities/:id
        return await updateCity(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /cities/:id
        return await deleteCity(pathParts[0], req, res);
      }

      // 404 for unknown routes
      handleResponse(res, { message: 'City route not found' }, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /cities
const getAllCities = async (req, res) => {
  try {
    const db = getDb();
    const { search, status, limit, featured } = req.query;
    let citiesRef = db.collection('cities');

    // Build query
    if (status === 'active') {
      citiesRef = citiesRef.where('isActive', '==', true);
    } else if (status === 'inactive') {
      citiesRef = citiesRef.where('isActive', '==', false);
    }

    // Order by creation date
    citiesRef = citiesRef.orderBy('createdAt', 'desc');

    // Execute query
    const snapshot = await citiesRef.get();
    let cities = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const cityData = {
        id: doc.id,
        name: data.name,
        province: data.province,
        cityId: data.cityId,
        country: data.country,
        postalCodes: data.postalCodes,
        timezone: data.timezone,
        utcOffset: data.utcOffset,
        statistics: data.statistics,
        search: data.search,
        thumbnail: data.thumbnail || null,
        isActive: data.isActive,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        // Frontend-compatible fields
        locations: data.statistics?.totalSpaces || 0,
        totalSpaces: data.statistics?.totalSpaces || 0,
        status: data.isActive ? 'active' : 'inactive'
      };
      
      cities.push(cityData);
    });

    // Apply client-side filtering for search
    if (search) {
      const searchLower = search.toLowerCase();
      cities = cities.filter(city =>
        city.name.toLowerCase().includes(searchLower) ||
        city.province?.toLowerCase().includes(searchLower) ||
        city.search?.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower)) ||
        city.search?.aliases?.some(alias => alias.toLowerCase().includes(searchLower))
      );
    }

    // Apply limit
    if (limit) {
      cities = cities.slice(0, parseInt(limit));
    }

    handleResponse(res, {
      cities,
      total: cities.length
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    handleError(res, error);
  }
};

// GET /cities/:id
const getCityById = async (cityId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('cities').doc(cityId).get();
    
    if (!doc.exists) {
      return handleResponse(res, { message: 'City not found' }, 404);
    }

    const data = doc.data();
    const cityData = {
      id: doc.id,
      name: data.name,
      province: data.province,
      cityId: data.cityId,
      country: data.country,
      postalCodes: data.postalCodes,
      timezone: data.timezone,
      utcOffset: data.utcOffset,
      statistics: data.statistics,
      search: data.search,
      thumbnail: data.thumbnail || null,
      isActive: data.isActive,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Frontend-compatible fields
      locations: data.statistics?.totalSpaces || 0,
      totalSpaces: data.statistics?.totalSpaces || 0,
      status: data.isActive ? 'active' : 'inactive'
    };

    handleResponse(res, cityData);
  } catch (error) {
    console.error('Error fetching city:', error);
    handleError(res, error);
  }
};

// POST /cities
const createCity = async (req, res) => {
  try {
    const db = getDb();
    const { name, province, country = 'Indonesia', postalCodes, timezone, utcOffset, createdBy } = req.body;

    // Validation
    validateRequired(req.body, ['name', 'province']);

    // Generate city ID
    const cityId = await generateSequentialId('cities', 'CTY', 3);

    // Create search keywords
    const searchKeywords = [
      name.toLowerCase(),
      province.toLowerCase(),
      ...(name.split(' ').map(word => word.toLowerCase())),
      ...(province.split(' ').map(word => word.toLowerCase()))
    ];

    const cityData = {
      cityId,
      name: sanitizeString(name),
      province: sanitizeString(province),
      country: sanitizeString(country),
      postalCodes: postalCodes || [],
      timezone: timezone || 'Asia/Jakarta',
      utcOffset: utcOffset || '+07:00',
      statistics: {
        totalSpaces: 0,
        activeSpaces: 0,
        totalOrders: 0,
        totalRevenue: 0
      },
      search: {
        keywords: searchKeywords,
        aliases: []
      },
      thumbnail: null,
      isActive: true,
      createdBy: createdBy || 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('cities').add(cityData);

    handleResponse(res, {
      id: docRef.id,
      ...cityData
    }, 201);
  } catch (error) {
    console.error('Error creating city:', error);
    handleError(res, error);
  }
};

// PUT /cities/:id
const updateCity = async (cityId, req, res) => {
  try {
    const db = getDb();
    const updateData = { ...req.body };
    delete updateData.id; // Remove id from update data
    
    // Check if city exists
    const cityDoc = await db.collection('cities').doc(cityId).get();
    if (!cityDoc.exists) {
      return handleResponse(res, { message: 'City not found' }, 404);
    }

    // Sanitize strings
    if (updateData.name) updateData.name = sanitizeString(updateData.name);
    if (updateData.province) updateData.province = sanitizeString(updateData.province);
    if (updateData.country) updateData.country = sanitizeString(updateData.country);

    // Update search keywords if name or province changed
    if (updateData.name || updateData.province) {
      const existingData = cityDoc.data();
      const name = updateData.name || existingData.name;
      const province = updateData.province || existingData.province;
      
      updateData.search = {
        keywords: [
          name.toLowerCase(),
          province.toLowerCase(),
          ...(name.split(' ').map(word => word.toLowerCase())),
          ...(province.split(' ').map(word => word.toLowerCase()))
        ],
        aliases: existingData.search?.aliases || []
      };
    }

    updateData.updatedAt = new Date();

    await db.collection('cities').doc(cityId).update(updateData);

    // Get updated document
    const updatedDoc = await db.collection('cities').doc(cityId).get();
    const data = updatedDoc.data();

    handleResponse(res, {
      id: cityId,
      ...data
    });
  } catch (error) {
    console.error('Error updating city:', error);
    handleError(res, error);
  }
};

// DELETE /cities/:id
const deleteCity = async (cityId, req, res) => {
  try {
    const db = getDb();
    
    // Check if city exists
    const cityDoc = await db.collection('cities').doc(cityId).get();
    if (!cityDoc.exists) {
      return handleResponse(res, { message: 'City not found' }, 404);
    }

    // Check if city has associated spaces
    const spacesSnapshot = await db.collection('spaces')
      .where('location.city', '==', cityDoc.data().name)
      .limit(1)
      .get();

    if (!spacesSnapshot.empty) {
      return handleResponse(res, { 
        message: 'Cannot delete city with associated spaces' 
      }, 400);
    }

    // Delete thumbnail if exists
    const cityData = cityDoc.data();
    if (cityData.thumbnail) {
      await deleteImage(cityData.thumbnail);
    }

    await db.collection('cities').doc(cityId).delete();

    handleResponse(res, { message: 'City deleted successfully' });
  } catch (error) {
    console.error('Error deleting city:', error);
    handleError(res, error);
  }
};

// POST /cities/:id/upload-image
const uploadCityImage = async (cityId, req, res) => {
  try {
    const db = getDb();
    const { imageData, fileName } = req.body;

    if (!imageData) {
      return handleResponse(res, { message: 'No image data provided' }, 400);
    }

    // Check if city exists
    const cityDoc = await db.collection('cities').doc(cityId).get();
    if (!cityDoc.exists) {
      return handleResponse(res, { message: 'City not found' }, 404);
    }

    const cityData = cityDoc.data();

    // Delete existing thumbnail if any
    if (cityData.thumbnail) {
      await deleteImage(cityData.thumbnail);
    }

    // Upload new image
    const uploadResult = await uploadImageFromBase64(
      imageData, 
      fileName || `city_${cityId}`, 
      'cities'
    );

    // Update city document with new thumbnail URL
    await db.collection('cities').doc(cityId).update({
      thumbnail: uploadResult.url,
      updatedAt: new Date()
    });

    console.log(`✅ Successfully updated city ${cityId} with thumbnail: ${uploadResult.url}`);

    handleResponse(res, {
      thumbnail: uploadResult.url,
      filename: uploadResult.filename
    });
  } catch (error) {
    console.error('Error uploading city image:', error);
    handleError(res, error);
  }
};

module.exports = { cities }; 