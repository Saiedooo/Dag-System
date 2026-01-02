const express = require('express');
const ensureDbConnection = require('../middleware/dbConnectionMiddleware');

const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  exportCustomersCSV,
  importCustomersCSV, // ← الجديد: أضفنا الدالة هنا
} = require('../Services/customerService');

const authService = require('../Services/authServices');

const router = express.Router();

// Ensure database connection before handling customer requests
router.use(ensureDbConnection);

// حماية جميع مسارات العملاء (اختياري: فعّلها لما تخلّص الاختبار)
// router.use(authService.protect);
// router.use(authService.allowedTo('admin', 'manager'));

// مسار تصدير العملاء إلى CSV
router.route('/export-csv').get(exportCustomersCSV);

// مسار استيراد العملاء من CSV (POST)
router.route('/import-csv').post(importCustomersCSV);

// مسارات العملاء العادية
router.route('/').get(getAllCustomers).post(createCustomer);

router
  .route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
