// routes/dailyFeedbackTaskRoutes.js
const express = require('express');
const router = express.Router();
const {
  createFeedbackTask,
} = require('../controllers/dailyFeedbackTaskController'); // الملف اللي عندك بالفعل

// إنشاء أو تحديث مهمة (upsert)
router.post('/feedback-tasks', createFeedbackTask);

// حذف مهمة بناءً على invoiceId
router.delete(
  '/:invoiceId',
  asyncHandler(async (req, res, next) => {
    const { invoiceId } = req.params;

    const task = await DailyFeedbackTask.findOneAndDelete({ invoiceId });

    if (!task) {
      return next(new ApiError(`لا توجد مهمة بهذا الكود: ${invoiceId}`, 404));
    }

    res.status(204).json({ success: true });
  })
);

// جلب كل المهام (للـ frontend)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tasks = await DailyFeedbackTask.find({}).sort({ invoiceDate: -1 });

    res.status(200).json({
      results: tasks.length,
      data: tasks,
    });
  })
);

module.exports = router;
