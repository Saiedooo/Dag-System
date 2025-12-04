const express = require('express');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const Customer = require('../Models/customerModel');

const router = express.Router();

let appState = {};

// Path to JSON fallback file (optional)
const DB_PATH = path.join(__dirname, '..', 'db.json');

// GET /api/data
// Returns aggregated state needed by the frontend
// Priority: MongoDB first, then JSON file as fallback
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      console.log('[GET /api/data] Starting to fetch data...');

      let customers = [];
      let customersSource = 'none';

      // Try to fetch customers from MongoDB first
      try {
        const dbCustomers = await Customer.find().lean();
        console.log(
          `[GET /api/data] ✅ Fetched ${dbCustomers.length} customers from MongoDB`
        );
        customers = dbCustomers;
        customersSource = 'mongodb';
      } catch (dbError) {
        console.error(
          '[GET /api/data] ⚠️ Error fetching customers from MongoDB:',
          dbError.message
        );
        console.log('[GET /api/data] Trying fallback: JSON file...');

        // Fallback: Try to read from JSON file
        if (fs.existsSync(DB_PATH)) {
          try {
            const fileContent = fs.readFileSync(DB_PATH, 'utf8');
            if (fileContent) {
              const fileData = JSON.parse(fileContent);
              customers = fileData.customers || [];
              customersSource = 'json';
              console.log(
                `[GET /api/data] ✅ Fetched ${customers.length} customers from JSON file (fallback)`
              );
            }
          } catch (fileError) {
            console.error(
              '[GET /api/data] ⚠️ Error reading JSON file:',
              fileError.message
            );
          }
        } else {
          console.log(
            '[GET /api/data] ⚠️ JSON file not found, using empty array'
          );
        }
      }

      // Format customers to match frontend expectations
      const formattedCustomers = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        joinDate: customer.joinDate || null,
        type: customer.type || null,
        governorate: customer.governorate || null,
        streetAddress: customer.streetAddress || null,
        classification: customer.classification || null,
        points: customer.points || 0,
        totalPurchases: customer.totalPurchases || 0,
        lastPurchaseDate: customer.lastPurchaseDate || null,
        hasBadReputation: customer.hasBadReputation || false,
        source: customer.source || null,
        totalPointsEarned: customer.totalPointsEarned || 0,
        totalPointsUsed: customer.totalPointsUsed || 0,
        purchaseCount: customer.purchaseCount || 0,
        log: customer.log || [],
        impressions: customer.impressions || [],
        primaryBranchId: customer.primaryBranchId || null,
        lastModified:
          customer.lastModified || customer.updatedAt?.toISOString() || null,
      }));

      // Try to get other data from JSON file (if exists)
      let fileData = {};
      if (fs.existsSync(DB_PATH)) {
        try {
          const fileContent = fs.readFileSync(DB_PATH, 'utf8');
          if (fileContent) {
            fileData = JSON.parse(fileContent);
            // Remove customers from fileData since we're using MongoDB/fallback customers
            delete fileData.customers;
          }
        } catch (fileError) {
          console.error(
            '[GET /api/data] ⚠️ Error reading other data from JSON:',
            fileError.message
          );
        }
      }

      // Build response object
      // Priority: MongoDB customers > JSON customers > empty array
      // Merge: Use MongoDB customers if available, otherwise use JSON customers
      const mergedData = {
        ...fileData, // Other data from JSON file (if exists)
        ...appState, // Any other state data (if needed)
        customers:
          formattedCustomers.length > 0
            ? formattedCustomers
            : fileData.customers || [], // Use MongoDB customers first, then JSON fallback
      };

      const response = mergedData;

      console.log(`[GET /api/data] ✅ Response ready:`, {
        customersSource: customersSource,
        hasCustomers: !!response.customers,
        customersCount: response.customers?.length || 0,
        responseKeys: Object.keys(response),
      });

      if (formattedCustomers.length > 0) {
        console.log(`[GET /api/data] Sample customer:`, {
          id: formattedCustomers[0].id,
          name: formattedCustomers[0].name,
          phone: formattedCustomers[0].phone,
        });
      }

      // Send response
      res.status(200).json(response);
      console.log(
        `[GET /api/data] ✅ Response sent successfully (source: ${customersSource})`
      );
    } catch (error) {
      console.error('[GET /api/data] ❌ Unexpected error:', error);
      console.error('[GET /api/data] Error details:', {
        message: error.message,
        stack: error.stack,
      });

      // Return empty array on error instead of crashing
      const errorResponse = {
        ...appState,
        customers: [],
        error: 'Failed to fetch data',
      };
      res.status(500).json(errorResponse);
    }
  })
);

// Optional: keep a way to update extra global state pieces from the frontend
router.post('/', (req, res) => {
  appState = req.body;
  res.json({ message: 'State updated' });
});

module.exports = router;
