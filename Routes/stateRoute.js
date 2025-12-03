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

    // Merge any additional app state if you still use it on the frontend
    res.json({
      ...appState,
      customers,
    });
  })
);

// Optional: keep a way to update extra global state pieces from the frontend
router.post('/', (req, res) => {
  appState = req.body;
  res.json({ message: 'State updated' });
});

module.exports = router;
