const express = require('express');
const ensureDbConnection = require('../middleware/dbConnectionMiddleware');

const {
  getAllDailyInquiries,
  getDailyInquiryById,
  createDailyInquiry,
  updateDailyInquiry,
  deleteDailyInquiry,
} = require('../Services/dailyInquiryService');

const authService = require('../Services/authServices');

const router = express.Router();

// Ensure database connection before handling daily inquiry requests
router.use(ensureDbConnection);

// router.use(authService.protect);
// router.use(authService.allowedTo('admin', 'manager'));

router.route('/').get(getAllDailyInquiries).post(createDailyInquiry);

router
  .route('/:id')
  .get(getDailyInquiryById)
  .put(updateDailyInquiry)
  .delete(deleteDailyInquiry);

module.exports = router;


