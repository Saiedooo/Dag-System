// controllers/dailyFeedbackController.js
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const DailyFeedback = require('../Models/dailyFeedbackModel');
const Customer = require('../Models/customerModel');

// إنشاء تقييم يومي جديد
exports.createDailyFeedback = asyncHandler(async (req, res, next) => {
  const body = { ...req.body };

  // التحقق من وجود العميل بالـ custom id
  if (!body.customer) {
    return next(new ApiError('معرف العميل (customer) مطلوب', 400));
  }

  const customer = await Customer.findOne({ id: body.customer });
  if (!customer) {
    return next(new ApiError(`لا يوجد عميل بهذا الكود: ${body.customer}`, 404));
  }

  // حفظ الـ custom id فقط
  body.customer = customer.id;

  const feedback = await DailyFeedback.create(body);

  // جلب التقييم مع بيانات العميل
  const populatedFeedback = await DailyFeedback.findById(feedback._id).populate(
    {
      path: 'customerData',
      select: 'id name phone classification points totalPurchases governorate',
    }
  );

  res.status(201).json({
    success: true,
    data: populatedFeedback,
  });
});

// جلب كل التقييمات اليومية
exports.getAllDailyFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await DailyFeedback.find({})
    .sort({ createdAt: -1 })
    .populate({
      path: 'customerData',
      select: 'id name phone classification points totalPurchases',
    });

  res.status(200).json({
    results: feedbacks.length,
    data: feedbacks,
  });
});

// جلب تقييم واحد
exports.getDailyFeedbackById = asyncHandler(async (req, res, next) => {
  const feedback = await DailyFeedback.findById(req.params.id).populate({
    path: 'customerData',
    select: 'id name phone classification points',
  });

  if (!feedback) {
    return next(
      new ApiError(`لا يوجد تقييم بهذا المعرف: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ data: feedback });
});

// تحديث تقييم
exports.updateDailyFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await DailyFeedback.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  ).populate({
    path: 'customerData',
    select: 'id name phone',
  });

  if (!feedback) {
    return next(
      new ApiError(`لا يوجد تقييم بهذا المعرف: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ data: feedback });
});

// حذف تقييم
exports.deleteDailyFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await DailyFeedback.findByIdAndDelete(req.params.id);

  if (!feedback) {
    return next(
      new ApiError(`لا يوجد تقييم بهذا المعرف: ${req.params.id}`, 404)
    );
  }

  res.status(204).json({ success: true });
});
