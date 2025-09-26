/*jshint esversion: 8 */
const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const dotenv = require('dotenv');
const pino = require('pino');

// Load environment variables
dotenv.config();

// Create Pino logger instance
const logger = pino();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

// Create Express router
const router = express.Router();

// /register endpoint
router.post(
  '/register',
  [
    body('firstName', 'First name is required').notEmpty(),
    body('lastName', 'Last name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password } = req.body;

    try {
      // Connect to database
      const db = await connectToDatabase();

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        logger.warn(`User already exists: ${email}`);
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Hash password
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      // Create new user object
      const newUser = { firstName, lastName, email, password: hashedPassword };

      // Insert user into DB and get the insertedId
      const result = await db.collection('users').insertOne(newUser);
      logger.info(`User registered: ${email}`);

      // Generate JWT token using the insertedId from MongoDB
      const payload = { user: { id: result.insertedId } };
      const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      // Send response
      res.status(201).json({ authtoken, email });
    } catch (err) {
      logger.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;

