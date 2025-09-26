/*jshint esversion: 8 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoLogger = require('./logger');
const pinoHttp = require('pino-http');

const connectToDatabase = require('./models/db');
const { loadData } = require("./util/import-mongo/index");

const app = express();
const port = 3060;

// Middleware
app.use("*", cors());
app.use(express.json());

const logger = require('./logger');
app.use(pinoHttp({ logger }));

// Connect to MongoDB (once)
connectToDatabase()
  .then(() => pinoLogger.info('Connected to DB'))
  .catch((e) => console.error('Failed to connect to DB', e));

// Gift API
const giftRoutes = require('./routes/giftRoutes');
// Search API
const searchRoutes = require('./routes/searchRoutes');
// Auth API
const authRoutes = require('./routes/authRoutes');

app.use('/api/gifts', giftRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes); 


// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

// Test route
app.get("/", (req, res) => {
  res.send("Inside the server");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

