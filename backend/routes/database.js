const express = require('express');
const router = express.Router();
const DatabaseStructureCreator = require('../scripts/createDatabaseStructure');
const RefBasedDatabaseSeeder = require('../scripts/seedRefDatabase');

// POST /api/database/create-structure
router.post('/create-structure', async (req, res) => {
  try {
    const creator = new DatabaseStructureCreator();
    const results = await creator.createAllStructures();
    
    res.json({
      success: true,
      message: 'Database structure created successfully',
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create database structure',
      error: error.message
    });
  }
});

// GET /api/database/validate
router.get('/validate', async (req, res) => {
  try {
    const creator = new DatabaseStructureCreator();
    await creator.validateStructure();
    
    res.json({
      success: true,
      message: 'Database structure is valid',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database structure validation failed',
      error: error.message
    });
  }
});

// DELETE /api/database/clear/:collection
router.delete('/clear/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const refSeeder = new RefBasedDatabaseSeeder();
    
    await refSeeder.clearCollection(collection);
    
    res.json({
      success: true,
      message: `Collection ${collection} cleared successfully`,
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

// POST /api/database/seed-ref (Main seeder - uses reference files)
router.post('/seed-ref', async (req, res) => {
  try {
    const { clearFirst = false } = req.body;
    const refSeeder = new RefBasedDatabaseSeeder();
    
    await refSeeder.seedAll({ clearFirst });
    
    res.json({
      success: true,
      message: 'Reference-based database seeded successfully',
      timestamp: new Date().toISOString(),
      collections: ['cities', 'layanan', 'spaces']
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed reference-based database',
      error: error.message
    });
  }
});

// POST /api/database/validate-ref
router.post('/validate-ref', async (req, res) => {
  try {
    const refSeeder = new RefBasedDatabaseSeeder();
    const validation = await refSeeder.validateStructure();
    
    res.json({
      success: true,
      message: 'Reference database structure validated',
      validation: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate reference database structure',
      error: error.message
    });
  }
});

module.exports = router; 