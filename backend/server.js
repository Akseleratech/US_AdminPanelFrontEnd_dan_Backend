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
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/spaces', require('./routes/spaces'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/services', require('./routes/services'));
app.use('/api/database', require('./routes/database'));

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