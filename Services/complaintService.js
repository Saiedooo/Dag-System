const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const {
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintChannel,
} = require('../Models/complaintModel');

// ========== SERVICE FUNCTIONS ==========

const createComplaintService = async (data) => {
  // Create new complaint instance and save to MongoDB
  const complaint = new Complaint(data);
  // Save to MongoDB - this ensures data is persisted permanently
  await complaint.save();
  console.log('✅ Complaint saved to MongoDB:', {
    _id: complaint._id,
    complaintId: complaint.complaintId,
  });
  return complaint;
};

const getAllComplaintsService = async () => {
  return await Complaint.find();
};

const getComplaintByIdService = async (id) => {
  const complaint = await Complaint.findById(id);
  return complaint;
};

const updateComplaintService = async (id, data) => {
  const complaint = await Complaint.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  // Ensure the update is saved to MongoDB
  if (complaint) {
    await complaint.save();
    console.log('✅ Complaint updated and saved to MongoDB:', complaint._id);
  }
  return complaint;
};

const deleteComplaintService = async (id) => {
  const complaint = await Complaint.findByIdAndDelete(id);
  return complaint;
};

// ========== CONTROLLER ==========

// CREATE - بدون asyncHandler (الحل النهائي)
exports.createComplaint = async (req, res) => {
  try {
    const data = { ...req.body };

    console.log('=== CREATE COMPLAINT REQUEST ===');
    console.log('Received data:', {
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      hasComplaintText: !!data.complaintText,
      complaintTextLength: data.complaintText?.length || 0,
      type: data.type,
      status: data.status,
      priority: data.priority,
    });

    // Validate required fields
    if (
      !data.customerName ||
      !data.customerEmail ||
      !data.customerPhone ||
      !data.complaintText
    ) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
      });
    }

    // Ensure complaintText is not empty
    if (
      typeof data.complaintText === 'string' &&
      data.complaintText.trim() === ''
    ) {
      console.log('Validation failed: complaintText is empty');
      return res.status(400).json({
        status: 'error',
        message: 'complaintText cannot be empty',
      });
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

    // Clean up data - remove undefined fields
    const cleanData = {};
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        cleanData[key] = data[key];
      }
    });

    console.log('Creating complaint with clean data...');
    console.log('Clean data keys:', Object.keys(cleanData));

    // Create and save complaint to MongoDB
    const complaint = await createComplaintService(cleanData);

    console.log('✅ Complaint created and saved successfully:', {
      _id: complaint._id,
      complaintId: complaint.complaintId,
      customerName: complaint.customerName,
      customerId: complaint.customerId,
    });

    // Verify the complaint was saved by fetching it again from MongoDB
    const verifyComplaint = await Complaint.findById(complaint._id);
    if (!verifyComplaint) {
      console.error('❌ WARNING: Complaint was not saved to database!');
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save complaint to database',
      });
    }
    console.log(
      '✅ Verified: Complaint is saved in MongoDB and can be retrieved'
    );

    res.status(201).json({
      status: 'success',
      data: complaint,
    });
  } catch (error) {
    console.error('❌ Error creating complaint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error creating complaint',
    });
  }
};

// GET ALL - بدون asyncHandler
exports.getAllComplaints = async (req, res) => {
  try {
    console.log('=== FETCHING ALL COMPLAINTS FROM MONGODB ===');

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB is not connected!');
      return res.status(500).json({
        status: 'error',
        message: 'Database connection is not ready',
      });
    }

    const complaints = await getAllComplaintsService();
    console.log(`✅ Fetched ${complaints.length} complaints from MongoDB`);

    if (complaints.length > 0) {
      console.log('Sample complaint:', {
        _id: complaints[0]._id,
        complaintId: complaints[0].complaintId,
        customerName: complaints[0].customerName,
      });
    }

    res.status(200).json({
      status: 'success',
      results: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error('❌ Error fetching complaints:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching complaints',
    });
  }
};

// GET ONE - بدون asyncHandler
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid complaint ID format',
      });
    }

    const complaint = await getComplaintByIdService(id);
    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: complaint,
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching complaint',
    });
  }
};

// UPDATE - بدون asyncHandler
exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid complaint ID format',
      });
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
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value',
      });
    }

    if (data.priority && !allowedPriority.includes(data.priority)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid priority value',
      });
    }

    if (data.channel && !allowedChannel.includes(data.channel)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid channel value',
      });
    }

    // Update lastModified
    data.lastModified = new Date().toISOString();

    const complaint = await updateComplaintService(id, data);
    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: complaint,
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating complaint',
    });
  }
};

// DELETE - بدون asyncHandler
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid complaint ID format',
      });
    }

    const complaint = await deleteComplaintService(id);
    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found',
      });
    }

    res.status(204).json({
      status: 'success',
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error deleting complaint',
    });
  }
};
