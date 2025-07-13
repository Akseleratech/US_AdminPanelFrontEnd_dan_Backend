const {onRequest} = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const busboy = require('busboy');
const os = require('os');
const path = require('path');
const fs = require('fs');
const {
  getDb,
  validateRequired,
  sanitizeString,
  verifyAdminAuth,
} = require('./utils/helpers');
const {
  handleResponse,
  handleError,
  handleValidationError,
  handleAuthError,
} = require('./utils/errorHandler');

// Main amenities function
const amenities = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const {method, url} = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter((part) => part);
      if (pathParts[0] === 'api') pathParts.shift();
      // NEW: Normalize by removing resource segment
      if (pathParts[0] === 'amenities') pathParts.shift();

      if (method === 'GET') {
        if (pathParts.length === 0) {
          return await getAllAmenities(req, res);
        } else if (pathParts.length === 1) {
          return await getAmenityById(pathParts[0], req, res);
        }
      } else if (method === 'POST' && pathParts.length === 0) {
        // POST /amenities - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }
        return await createAmenity(req, res);
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /amenities/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }
        return await updateAmenity(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /amenities/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }
        return await deleteAmenity(pathParts[0], req, res);
      } else if (method === 'PATCH' && pathParts.length === 2 && pathParts[1] === 'toggle') {
        // PATCH /amenities/:id/toggle - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleAuthError(res, 'Admin access required', req);
        }
        return await toggleAmenityStatus(pathParts[0], req, res);
      }

      return handleError(res, new Error('Amenity route not found'), 404, req);
    } catch (error) {
      return handleError(res, error, 500, req);
    }
  });
});

// GET /amenities
const getAllAmenities = async (req, res) => {
  try {
    const db = getDb();
    const {search, status, limit} = req.query;
    let snapshot;
    let amenities = [];

    if (status === 'active') {
      // When we combine an equality filter and a different orderBy field
      // Firestore often requires a composite index. To keep setup simple we
      // fetch filtered docs first and sort them locally.
      snapshot = await db.collection('amenities')
          .where('isActive', '==', true)
          .get();
    } else {
      // No filter – we can safely order directly in Firestore.
      snapshot = await db.collection('amenities')
          .orderBy('name')
          .get();
    }

    // Build amenities array
    snapshot.forEach((doc) => {
      amenities.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Ensure predictable order when we skipped Firestore orderBy
    if (status === 'active') {
      amenities.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      amenities = amenities.filter((amenity) =>
        amenity.name?.toLowerCase().includes(searchLower) ||
        amenity.description?.toLowerCase().includes(searchLower),
      );
    }

    if (limit) {
      amenities = amenities.slice(0, parseInt(limit));
    }

    handleResponse(res, {amenities, total: amenities.length});
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

// GET /amenities/:id
const getAmenityById = async (amenityId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('amenities').doc(amenityId).get();

    if (!doc.exists) {
      return handleError(res, new Error('Amenity not found'), 404, req);
    }

    handleResponse(res, {id: doc.id, ...doc.data()});
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

// POST /amenities
const createAmenity = async (req, res) => {
  const bb = busboy({headers: req.headers});
  const tmpdir = os.tmpdir();
  const fields = {};
  const uploads = {};

  bb.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  bb.on('file', (fieldname, file, info) => {
    const {filename, mimeType} = info;
    const filepath = path.join(tmpdir, filename);
    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);
    uploads[fieldname] = {filepath, mimeType};
  });

  bb.on('finish', async () => {
    try {
      validateRequired(fields, ['name']);

      let iconUrl = '';
      if (uploads.icon) {
        const {filepath, mimeType} = uploads.icon;
        const projectId = process.env.GCLOUD_PROJECT || 'unionspace-w9v242';
        const bucketName = `${projectId}.firebasestorage.app`;
        const bucket = admin.storage().bucket(bucketName);
        const dest = `amenities/${Date.now()}_${path.basename(filepath)}`;
        const [uploadedFile] = await bucket.upload(filepath, {
          destination: dest,
          metadata: {contentType: mimeType},
        });
        await uploadedFile.makePublic();
        iconUrl = uploadedFile.publicUrl();
        fs.unlinkSync(filepath); // Clean up temp file
      }

      const db = getDb();
      const amenityData = {
        name: sanitizeString(fields.name),
        description: sanitizeString(fields.description || ''),
        icon: iconUrl,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await db.collection('amenities').add(amenityData);
      handleResponse(res, {id: docRef.id, ...amenityData}, 201);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Feed data into Busboy depending on availability of rawBody (v1) or stream (v2)
  if (req.rawBody) {
    bb.end(req.rawBody);
  } else {
    req.pipe(bb);
  }
};

// PUT /amenities/:id
const updateAmenity = async (amenityId, req, res) => {
  const bb = busboy({headers: req.headers});
  const tmpdir = os.tmpdir();
  const fields = {};
  const uploads = {};

  bb.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  bb.on('file', (fieldname, file, info) => {
    const {filename, mimeType} = info;
    const filepath = path.join(tmpdir, filename);
    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);
    uploads[fieldname] = {filepath, mimeType};
  });

  bb.on('finish', async () => {
    try {
      const db = getDb();
      const amenityDoc = await db.collection('amenities').doc(amenityId).get();
      if (!amenityDoc.exists) {
        return handleError(res, new Error('Amenity not found'), 404, req);
      }

      let iconUrl = fields.icon || amenityDoc.data().icon; // Keep old icon if not updated
      // If a new file is uploaded, process it
      if (uploads.icon) {
        // Delete the old icon from storage if it exists
        const oldIconUrl = amenityDoc.data().icon;
        if (oldIconUrl) {
          try {
            const projectId = process.env.GCLOUD_PROJECT || 'unionspace-w9v242';
            const bucketName = `${projectId}.firebasestorage.app`;
            const bucket = admin.storage().bucket(bucketName);
            const oldFileName = decodeURIComponent(oldIconUrl.split('/').pop().split('?')[0]);
            await bucket.file(oldFileName).delete();
          } catch (storageError) {
            console.warn(`Could not delete old icon: ${oldIconUrl}`, storageError);
          }
        }

        const {filepath, mimeType} = uploads.icon;
        const projectId = process.env.GCLOUD_PROJECT || 'unionspace-w9v242';
        const bucketName = `${projectId}.firebasestorage.app`;
        const bucket = admin.storage().bucket(bucketName);
        const dest = `amenities/${Date.now()}_${path.basename(filepath)}`;
        const [uploadedFile] = await bucket.upload(filepath, {
          destination: dest,
          metadata: {contentType: mimeType},
        });
        await uploadedFile.makePublic();
        iconUrl = uploadedFile.publicUrl();
        fs.unlinkSync(filepath); // Clean up temp file
      }

      const updateData = {
        updatedAt: new Date(),
      };
      if (fields.name) updateData.name = sanitizeString(fields.name);
      if (fields.description) updateData.description = sanitizeString(fields.description);
      updateData.icon = iconUrl;


      await db.collection('amenities').doc(amenityId).update(updateData);
      const updatedDoc = await db.collection('amenities').doc(amenityId).get();
      handleResponse(res, {id: amenityId, ...updatedDoc.data()});
    } catch (error) {
      handleError(res, error);
    }
  });

  if (req.rawBody) {
    bb.end(req.rawBody);
  } else {
    req.pipe(bb);
  }
};

// DELETE /amenities/:id
const deleteAmenity = async (amenityId, req, res) => {
  try {
    const db = getDb();
    const amenityDoc = await db.collection('amenities').doc(amenityId).get();
    if (!amenityDoc.exists) {
      return handleError(res, new Error('Amenity not found'), 404, req);
    }

    // Check if amenity is being used by any spaces
    const spacesSnapshot = await db.collection('spaces')
        .where('amenities', 'array-contains', amenityId)
        .get();

    if (!spacesSnapshot.empty) {
      return handleValidationError(res, [{ message: 'Cannot delete amenity because it is being used by one or more spaces' }], req);
    }

    // Delete icon from storage
    const iconUrl = amenityDoc.data().icon;
    if (iconUrl) {
      try {
        const projectId = process.env.GCLOUD_PROJECT || 'unionspace-w9v242';
        const bucketName = `${projectId}.firebasestorage.app`;
        const bucket = admin.storage().bucket(bucketName);
        const fileName = decodeURIComponent(iconUrl.split('/').pop().split('?')[0]);
        await bucket.file(fileName).delete();
      } catch (storageError) {
        console.warn(`Could not delete icon for amenity ${amenityId}: ${iconUrl}`, storageError);
      }
    }

    await db.collection('amenities').doc(amenityId).delete();
    handleResponse(res, {message: 'Amenity deleted successfully'});
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

// PATCH /amenities/:id/toggle
const toggleAmenityStatus = async (amenityId, req, res) => {
  try {
    const db = getDb();
    const amenityDoc = await db.collection('amenities').doc(amenityId).get();
    if (!amenityDoc.exists) {
      return handleError(res, new Error('Amenity not found'), 404, req);
    }

    const currentStatus = amenityDoc.data().isActive;
    const updateData = {
      isActive: !currentStatus,
      updatedAt: new Date(),
    };

    await db.collection('amenities').doc(amenityId).update(updateData);
    const updatedDoc = await db.collection('amenities').doc(amenityId).get();
    handleResponse(res, {id: amenityId, ...updatedDoc.data()});
  } catch (error) {
    return handleError(res, error, 500, req);
  }
};

module.exports = {amenities};
