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
  const data = req.body;

  if (
    !data.customerName ||
    !data.customerEmail ||
    !data.customerPhone ||
    !data.complaintText
  ) {
    return next(new ApiError('Missing required fields', 400));
  }

  const complaint = await createComplaintService(data);

  res.status(201).json({
    status: 'success',
    data: complaint,
  });
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

  const allowedStatus = Object.values(ComplaintStatus);
  const allowedPriority = Object.values(ComplaintPriority);
  const allowedChannel = Object.values(ComplaintChannel);

  if (req.body.status && !allowedStatus.includes(req.body.status)) {
    return next(new ApiError('Invalid status value', 400));
  }

  if (req.body.priority && !allowedPriority.includes(req.body.priority)) {
    return next(new ApiError('Invalid priority value', 400));
  }

  if (req.body.channel && !allowedChannel.includes(req.body.channel)) {
    return next(new ApiError('Invalid channel value', 400));
  }

  const complaint = await updateComplaintService(id, req.body);

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
