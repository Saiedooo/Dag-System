const asyncHandler = require('express-async-handler');
const DailyFeedbackTask = require('../Models/dailyFeedbackTaskModel');
const Customer = require('../Models/customerModel');

// إنشاء مهمة تقييم يومية جديدة (للمتابعة)
exports.createFeedbackTask = asyncHandler(async (req, res, next) => {
  const { customerId, invoiceId, invoiceDate } = req.body;

  if (!customerId || !invoiceId) {
    return res.status(400).json({ message: 'بيانات ناقصة' });
  }

  const customer = await Customer.findOne({ id: customerId });
  if (!customer) {
    return res.status(400).json({ message: 'العميل غير موجود' });
  }

  const task = await DailyFeedbackTask.findOneAndUpdate(
    { invoiceId },
    {
      customerId,
      customerName: customer.name,
      invoiceId,
      invoiceDate: invoiceDate || new Date(),
      status: 'Pending',
      branchId: customer.primaryBranchId || null,
    },
    { upsert: true, new: true }
  );

  res.status(201).json({ data: task });
});

exports.getAllFeedbackTasks = asyncHandler(async (req, res) => {
  const tasks = await DailyFeedbackTask.find({})
    .sort({ invoiceDate: -1 }) // الأحدث أولاً
    .lean();

  res.status(200).json({
    results: tasks.length,
    data: tasks,
  });
});

exports.deleteFeedbackTask = asyncHandler(async (req, res, next) => {
  const { invoiceId } = req.params;

  const task = await DailyFeedbackTask.findOneAndDelete({ invoiceId });

  if (!task) {
    return next(new ApiError(`لا توجد مهمة بهذا الكود: ${invoiceId}`, 404));
  }

  res.status(204).send();
});
