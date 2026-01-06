const express = require('express');
const router = express.Router();

const {
  createFeedbackTask,
  getAllFeedbackTasks, // ← جديد
  deleteFeedbackTask,
} = require('../Services/dailyFeedbackTaskController');

const { protect } = require('../middleware/authMiddleware'); // لو عندك حماية

router
  .route('/')
  .post(protect, createFeedbackTask)
  .get(protect, getAllFeedbackTasks); // ← مهم جدًا

router.route('/feedback-tasks').post(createFeedbackTask); // لو عايز تحافظ على القديم
router.route('/:invoiceId').delete(deleteFeedbackTask);
module.exports = router;
