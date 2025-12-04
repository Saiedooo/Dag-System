const express = require('express');
const asyncHandler = require('express-async-handler');
const Customer = require('../Models/customerModel');

const router = express.Router();

let appState = {};

// GET /api/data
// Returns aggregated state needed by the frontend from MongoDB
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      console.log('[GET /api/data] Starting to fetch data from MongoDB...');

      // Fetch customers from MongoDB (NOT from JSON file)
      const customers = await Customer.find().lean();
      console.log(
        `[GET /api/data] ✅ Fetched ${customers.length} customers from MongoDB`
      );

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

      // Log for debugging
      console.log(
        `[GET /api/data] ✅ Formatted ${formattedCustomers.length} customers`
      );
      if (formattedCustomers.length > 0) {
        console.log(`[GET /api/data] Sample customer:`, {
          id: formattedCustomers[0].id,
          name: formattedCustomers[0].name,
          phone: formattedCustomers[0].phone,
        });
      }

      // Build response object - customers from MongoDB, other data from appState if needed
      const response = {
        ...appState, // Any other state data (if needed)
        customers: formattedCustomers, // Customers from MongoDB
      };

      console.log(`[GET /api/data] ✅ Response ready:`, {
        hasCustomers: !!response.customers,
        customersCount: response.customers?.length || 0,
        responseKeys: Object.keys(response),
      });

      // Send response
      res.status(200).json(response);
      console.log(`[GET /api/data] ✅ Response sent successfully`);
    } catch (error) {
      console.error('[GET /api/data] ❌ Error fetching from MongoDB:', error);
      console.error('[GET /api/data] Error details:', {
        message: error.message,
        stack: error.stack,
      });

      // Return empty array on error instead of crashing
      const errorResponse = {
        ...appState,
        customers: [],
        error: 'Failed to fetch customers from database',
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
