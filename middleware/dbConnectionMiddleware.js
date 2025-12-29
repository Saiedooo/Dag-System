const mongoose = require('mongoose');
const dbConnection = require('../config/database');

/**
 * Middleware to ensure database connection is ready before processing requests
 * This is critical for serverless environments like Vercel
 */
const ensureDbConnection = async (req, res, next) => {
  try {
    // Ensure bufferCommands is enabled
    mongoose.set('bufferCommands', true);

    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    // If connecting (state 2), wait a bit and check again
    if (mongoose.connection.readyState === 2) {
      // Wait up to 10 seconds for connection to complete
      let attempts = 0;
      while (mongoose.connection.readyState !== 1 && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (mongoose.connection.readyState === 1) {
        return next();
      }
    }

    // If not connected, try to connect
    await dbConnection();

    // Double-check connection is ready after connecting
    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    // Verify connection is ready
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    // If still not connected, return error
    return res.status(503).json({
      status: 'error',
      message: 'Database connection is not ready. Please try again.',
    });
  } catch (error) {
    console.error('Database connection error in middleware:', error);
    return res.status(503).json({
      status: 'error',
      message: 'Database connection failed. Please try again.',
    });
  }
};

module.exports = ensureDbConnection;
