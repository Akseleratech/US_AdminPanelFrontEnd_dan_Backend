const express = require('express');
const router = express.Router();

// GET /api/database/status
router.get('/status', async (req, res) => {
  try {
    const { db } = require('../config/firebase');
    
    const collections = ['cities', 'layanan', 'spaces', 'orders', 'users'];
    const status = {};
    
    for (const collection of collections) {
      try {
        const snapshot = await db.collection(collection).get();
        status[collection] = {
          exists: true,
          hasData: !snapshot.empty,
          documentCount: snapshot.size
        };
      } catch (error) {
        status[collection] = {
          exists: false,
          hasData: false,
          documentCount: 0,
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check database status',
      error: error.message
    });
  }
});

// DELETE /api/database/clear/:collection
router.delete('/clear/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { db } = require('../config/firebase');
    
    // Get all documents in the collection
    const snapshot = await db.collection(collection).get();
    
    // Delete all documents
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      message: `Collection ${collection} cleared successfully`,
      deletedCount: snapshot.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to clear collection ${collection}`,
      error: error.message
    });
  }
});

module.exports = router; 