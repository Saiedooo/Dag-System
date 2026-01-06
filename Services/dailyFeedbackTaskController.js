// controllers/dailyFeedbackTaskController.js
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const DailyFeedbackTask = require('../Models/dailyFeedbackTaskModel');
const Customer = require('../Models/customerModel');

// إنشاء أو تحديث مهمة تقييم يومية (upsert)
exports.createFeedbackTask = asyncHandler(async (req, res, next) => {
  const { customerId, invoiceId, invoiceDate } = req.body;

  if (!customerId || !invoiceId) {
    return next(new ApiError('customerId و invoiceId مطلوبين', 400));
  }

  const customer = await Customer.findOne({ id: customerId });
  if (!customer) {
    return next(new ApiError(`لا يوجد عميل بهذا الكود: ${customerId}`, 404));
  }

  const task = await DailyFeedbackTask.findOneAndUpdate(
    { invoiceId }, // البحث بناءً على invoiceId (فريد)
    {
      customerId: customer.id,
      customerName: customer.name,
      invoiceId,
      invoiceDate: invoiceDate || new Date(),
      status: 'Pending',
      branchId: customer.primaryBranchId || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({
    success: true,
    data: task,
  });
});

// جلب كل المهام اليومية
exports.getAllFeedbackTasks = asyncHandler(async (req, res) => {
  const tasks = await DailyFeedbackTask.find({})
    .sort({ invoiceDate: -1 })
    .lean();

  res.status(200).json({
    success: true,
    results: tasks.length,
    data: tasks,
  });
});

// حذف مهمة بناءً على invoiceId
exports.deleteFeedbackTask = asyncHandler(async (req, res, next) => {
  const { invoiceId } = req.params;

  const task = await DailyFeedbackTask.findOneAndDelete({ invoiceId });

  if (!task) {
    return next(
      new ApiError(`لا توجد مهمة تقييم بهذا الفاتورة: ${invoiceId}`, 404)
    );
  }

  res.status(204).json({ success: true });
});
