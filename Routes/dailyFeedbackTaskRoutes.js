// routes/dailyFeedbackTaskRoutes.js
const express = require('express');
const router = express.Router();

const {
  createFeedbackTask,
  getAllFeedbackTasks,
  deleteFeedbackTask,
} = require('../Services/dailyFeedbackTaskController');

// const { protect } = require('../middleware/authMiddleware'); // تأكد إنه موجود وشغال

// المسارات الرئيسية والمنظمة
router
  .route('/')
  .post(createFeedbackTask) // إنشاء مهمة جديدة
  .get(getAllFeedbackTasks); // جلب كل المهام اليومية

// مسار إضافي للتوافق مع الـ frontend القديم (اختياري، بس مفيد)
router.route('/feedback-tasks').post(createFeedbackTask);

// حذف مهمة بناءً على invoiceId (مش _id)
router.route('/:invoiceId').delete(deleteFeedbackTask);

module.exports = router;
