const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

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
      version: "2.0.0"
    });
  });
}); 