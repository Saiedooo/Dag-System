const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');

const {
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintChannel,
} = require('../Models/complaintModel');

// ========== SERVICE FUNCTIONS ==========

// Create Complaint
const createComplaintService = async (data) => {
  return await Complaint.create(data);
};

// Get All Complaints
const getAllComplaintsService = async () => {
  return await Complaint.find();
};

// Get Single Complaint
const getComplaintByIdService = async (id) => {
  const complaint = await Complaint.findById(id);
  return complaint;
};

// Update Complaint
const updateComplaintService = async (id, data) => {
  const complaint = await Complaint.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  return complaint;
};

// Delete Complaint
const deleteComplaintService = async (id) => {
  const complaint = await Complaint.findByIdAndDelete(id);
  return complaint;
};

// ========== CONTROLLER ==========

// CREATE
exports.createComplaint = asyncHandler(async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Validate required fields
    if (
      !data.customerName ||
      !data.customerEmail ||
      !data.customerPhone ||
      !data.complaintText
    ) {
      return next(new ApiError('Missing required fields', 400));
    }

    // Ensure complaintText is not empty
    if (
      typeof data.complaintText === 'string' &&
      data.complaintText.trim() === ''
    ) {
      return next(new ApiError('complaintText cannot be empty', 400));
    }

    // Map complaintText to description for storage
    if (data.complaintText && !data.description) {
      data.description = data.complaintText;
    }

    // Set dateOpened if not provided
    if (!data.dateOpened) {
      data.dateOpened = new Date().toISOString();
    }

    // Set lastModified
    data.lastModified = new Date().toISOString();

    const complaint = await createComplaintService(data);

    res.status(201).json({
      status: 'success',
      data: complaint,
    });
  } catch (error) {
    // If it's already an ApiError, pass it to next
    if (error.isOperational) {
      return next(error);
    }

    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return next(
        new ApiError(`Validation failed: ${messages.join(', ')}`, 400)
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return next(new ApiError(`${field} already exists`, 400));
    }

    // For other errors, log and pass to error handler
    console.error('[createComplaint] Unexpected error:', error);
    return next(new ApiError(error.message || 'Error creating complaint', 500));
  }
});

// GET ALL
exports.getAllComplaints = asyncHandler(async (req, res, next) => {
  const complaints = await getAllComplaintsService();

  res.status(200).json({
    status: 'success',
    results: complaints.length,
    data: complaints,
  });
});

// GET ONE
exports.getComplaintById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate that id is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError('Invalid complaint ID format', 400));
  }

  const complaint = await getComplaintByIdService(id);

  if (!complaint) {
    return next(new ApiError('Complaint not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: complaint,
  });
});

// UPDATE
exports.updateComplaint = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate that id is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError('Invalid complaint ID format', 400));
  }

  const data = { ...req.body };

  // Map complaintText to description if provided
  if (data.complaintText !== undefined) {
    data.description = data.complaintText;
  }

  // Validate enum values
  const allowedStatus = Object.values(ComplaintStatus);
  const allowedPriority = Object.values(ComplaintPriority);
  const allowedChannel = Object.values(ComplaintChannel);

  if (data.status && !allowedStatus.includes(data.status)) {
    return next(new ApiError('Invalid status value', 400));
  }

  if (data.priority && !allowedPriority.includes(data.priority)) {
    return next(new ApiError('Invalid priority value', 400));
  }

  if (data.channel && !allowedChannel.includes(data.channel)) {
    return next(new ApiError('Invalid channel value', 400));
  }

  // Update lastModified
  data.lastModified = new Date().toISOString();

  const complaint = await updateComplaintService(id, data);

  if (!complaint) {
    return next(new ApiError('Complaint not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: complaint,
  });
});

// DELETE
exports.deleteComplaint = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate that id is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError('Invalid complaint ID format', 400));
  }

  const complaint = await deleteComplaintService(id);

  if (!complaint) {
    return next(new ApiError('Complaint not found', 404));
  }

  res.status(204).json({
    status: 'success',
    message: 'Complaint deleted successfully',
  });
});
