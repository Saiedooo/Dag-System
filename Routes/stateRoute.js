const express = require('express');
const asyncHandler = require('express-async-handler');
const Customer = require('../Models/customerModel');

const router = express.Router();

let appState = {};

// GET /api/data
// Returns aggregated state needed by the frontend (currently: customers list)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const customers = await Customer.find().lean();

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
      console.log(`[GET /api/data] Found ${customers.length} customers in DB`);
      console.log(
        `[GET /api/data] Returning ${formattedCustomers.length} formatted customers`
      );
      if (formattedCustomers.length > 0) {
        console.log(`[GET /api/data] Sample customer:`, {
          id: formattedCustomers[0].id,
          name: formattedCustomers[0].name,
          phone: formattedCustomers[0].phone,
        });
      }

      // Return data with customers array
      const response = {
        ...appState,
        customers: formattedCustomers,
      };

      console.log(`[GET /api/data] Response structure:`, {
        hasCustomers: !!response.customers,
        customersCount: response.customers?.length || 0,
      });

      res.json(response);
    } catch (error) {
      console.error('[GET /api/data] Error:', error);
      // Return empty array on error instead of crashing
      res.json({
        ...appState,
        customers: [],
      });
    }
  })
);

// Optional: keep a way to update extra global state pieces from the frontend
router.post('/', (req, res) => {
  appState = req.body;
  res.json({ message: 'State updated' });
});

module.exports = router;
