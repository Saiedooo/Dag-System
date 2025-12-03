const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const DailyInquiry = require('../Models/dailyInquiryModel');

// Get all daily inquiries
exports.getAllDailyInquiries = asyncHandler(async (req, res) => {
  const inquiries = await DailyInquiry.find({}).lean();
  res.status(200).json({ results: inquiries.length, data: inquiries });
});

// Get single daily inquiry by Mongo _id
exports.getDailyInquiryById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const inquiry = await DailyInquiry.findById(id);
  if (!inquiry) {
    return next(new ApiError(`No daily inquiry for this id ${id}`, 404));
  }
  res.status(200).json({ data: inquiry });
});

// Create new daily inquiry
exports.createDailyInquiry = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (
      !body.id ||
      !body.userId ||
      !body.userName ||
      !body.date ||
      !body.productInquiry ||
      !body.customerGovernorate
    ) {
      return next(
        new ApiError(
          'id, userId, userName, date, productInquiry and customerGovernorate are required',
          400
        )
      );
    }

    body.lastModified = new Date().toISOString();

    const inquiry = await DailyInquiry.create(body);
    res.status(201).json({ data: inquiry });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.id) {
      return next(new ApiError('DailyInquiry id already exists', 400));
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return next(
        new ApiError(
          `DailyInquiry validation failed: ${messages.join(', ')}`,
          400
        )
      );
    }
    return next(
      new ApiError(error.message || 'Error creating daily inquiry', 500)
    );
  }
});

// Update daily inquiry
exports.updateDailyInquiry = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };
    delete body._id;

    body.lastModified = new Date().toISOString();

    const inquiry = await DailyInquiry.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!inquiry) {
      return next(
        new ApiError(`No daily inquiry for this id ${req.params.id}`, 404)
      );
    }

    res.status(200).json({ data: inquiry });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return next(
        new ApiError(
          `DailyInquiry validation failed: ${messages.join(', ')}`,
          400
        )
      );
    }
    return next(
      new ApiError(error.message || 'Error updating daily inquiry', 500)
    );
  }
});

// Delete daily inquiry
exports.deleteDailyInquiry = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const inquiry = await DailyInquiry.findByIdAndDelete(id);
    if (!inquiry) {
      return next(new ApiError(`No daily inquiry for this id ${id}`, 404));
    }
    res.status(204).send();
  } catch (error) {
    return next(
      new ApiError(error.message || 'Error deleting daily inquiry', 500)
    );
  }
});
