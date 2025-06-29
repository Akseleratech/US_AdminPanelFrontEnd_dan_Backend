const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin with emulator support
if (!admin.apps.length) {
  // Check if we're running in emulator environment
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true" || 
                    process.env.NODE_ENV === "development";
  
  const config = {
    projectId: process.env.GCLOUD_PROJECT || "demo-unionspace-crm"
  };

  if (isEmulator) {
    console.log('🚀 Firebase Functions running in EMULATOR mode');
    
    // For emulator, don't need service account credentials
    // The emulator will handle authentication automatically
    config.storageBucket = `${config.projectId}.appspot.com`;
    
    // Set emulator host for storage (this helps the admin SDK connect to emulator)
    if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
      console.log(`📦 Storage Emulator Host: ${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`);
    } else {
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";
      console.log('📦 Set Storage Emulator Host: 127.0.0.1:9199');
    }
  } else {
    console.log('🌐 Firebase Functions running in PRODUCTION mode');
    // Production config will use default service account from environment
  }

  admin.initializeApp(config);
}

// Set global options
setGlobalOptions({
  region: "asia-southeast1", // Singapore region for better latency in Indonesia
  memory: "512MiB",
  timeoutSeconds: 60,
});

// Import all function modules
const citiesFunctions = require("./src/cities");
const servicesFunctions = require("./src/services");
const spacesFunctions = require("./src/spaces");
const buildingsFunctions = require("./src/buildings");
const ordersFunctions = require("./src/orders");
const dashboardFunctions = require("./src/dashboard");
const databaseFunctions = require("./src/database");
const amenitiesFunctions = require("./src/amenities");

// Export all functions
exports.cities = citiesFunctions.cities;
exports.services = servicesFunctions.services;
exports.spaces = spacesFunctions.spaces;
exports.buildings = buildingsFunctions.buildings;
exports.orders = ordersFunctions.orders;
exports.dashboard = dashboardFunctions.dashboard;
exports.database = databaseFunctions.database;
exports.amenities = amenitiesFunctions.amenities;

// Health check endpoint
exports.health = onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      status: "ok",
      message: "UnionSpace CRM API is running",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      environment: process.env.FUNCTIONS_EMULATOR === "true" ? "emulator" : "production"
    });
  });
}); 