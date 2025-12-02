const express = require('express');

const {
  getAllDailyInquiries,
  getDailyInquiryById,
  createDailyInquiry,
  updateDailyInquiry,
  deleteDailyInquiry,
} = require('../Services/dailyInquiryService');

const authService = require('../Services/authServices');

const router = express.Router();

// router.use(authService.protect);
// router.use(authService.allowedTo('admin', 'manager'));

router.route('/').get(getAllDailyInquiries).post(createDailyInquiry);

router
  .route('/:id')
  .get(getDailyInquiryById)
  .put(updateDailyInquiry)
  .delete(deleteDailyInquiry);

module.exports = router;


