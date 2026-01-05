// routes/dailyFeedbackRoutes.js
const express = require('express');
const {
  createDailyFeedback,
  getAllDailyFeedbacks,
  getDailyFeedbackById,
  updateDailyFeedback,
  deleteDailyFeedback,
} = require('../Services/dailyFeedbackService');

const router = express.Router();

// إنشاء وجلب الكل
router.route('/').post(createDailyFeedback).get(getAllDailyFeedbacks);

// عمليات على تقييم معين
router
  .route('/:id')
  .get(getDailyFeedbackById)
  .put(updateDailyFeedback)
  .delete(deleteDailyFeedback);

module.exports = router;
