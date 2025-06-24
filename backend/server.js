const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Initialize Firebase
require('./config/firebase');

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const citiesRoutes = require('./routes/cities');
const servicesRoutes = require('./routes/services');
const spacesRoutes = require('./routes/spaces');
const ordersRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const databaseRoutes = require('./routes/database');
const amenitiesRoutes = require('./routes/amenities');

app.use('/api/cities', citiesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/spaces', spacesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/amenities', amenitiesRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'UnionSpace admin-panel Backend API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 