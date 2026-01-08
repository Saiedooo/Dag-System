const express = require('express');
const ensureDbConnection = require('../middleware/dbConnectionMiddleware');

const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  exportCustomersCSV,
  importCustomersCSV,
} = require('../Services/customerService');

const router = express.Router();

// Ensure database connection
router.use(ensureDbConnection);

// مسار تصدير CSV
router.route('/export-csv').get(exportCustomersCSV);

// مسار استيراد CSV
router.route('/import-csv').post(importCustomersCSV);

// مسارات العملاء الأساسية
router.route('/').get(getAllCustomers).post(createCustomer);

router
  .route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer); // ← هذا هو الروت المهم

module.exports = router;
