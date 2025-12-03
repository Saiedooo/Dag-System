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
      classification: customer.classification || null,
      points: customer.points || 0,
      totalPurchases: customer.totalPurchases || 0,
      lastPurchaseDate: customer.lastPurchaseDate || null,
      totalPointsEarned: customer.totalPointsEarned || 0,
      totalPointsUsed: customer.totalPointsUsed || 0,
      purchaseCount: customer.purchaseCount || 0,
      log: customer.log || [],
      lastModified:
        customer.lastModified || customer.updatedAt?.toISOString() || null,
    }));

    // Return data with customers array
    res.json({
      ...appState,
      customers: formattedCustomers,
    });
  })
);

// Optional: keep a way to update extra global state pieces from the frontend
router.post('/', (req, res) => {
  appState = req.body;
  res.json({ message: 'State updated' });
});

module.exports = router;
