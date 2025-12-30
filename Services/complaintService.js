// const mongoose = require('mongoose');
// const ApiError = require('../utils/apiError');
// const {
//   Complaint,
//   ComplaintStatus,
//   ComplaintPriority,
//   ComplaintChannel,
// } = require('../Models/complaintModel');

// // ========== SERVICE FUNCTIONS ==========

// const createComplaintService = async (data) => {
//   // Create new complaint instance and save to MongoDB
//   const complaint = new Complaint(data);
//   // Save to MongoDB - this ensures data is persisted permanently
//   await complaint.save();
//   console.log('✅ Complaint saved to MongoDB:', {
//     _id: complaint._id,
//     complaintId: complaint.complaintId,
//   });
//   return complaint;
// };

// const getAllComplaintsService = async () => {
//   return await Complaint.find();
// };

// const getComplaintByIdService = async (id) => {
//   const complaint = await Complaint.findById(id);
//   return complaint;
// };

// const updateComplaintService = async (id, data) => {
//   const complaint = await Complaint.findByIdAndUpdate(id, data, {
//     new: true,
//     runValidators: true,
//   });
//   // Ensure the update is saved to MongoDB
//   if (complaint) {
//     await complaint.save();
//     console.log('✅ Complaint updated and saved to MongoDB:', complaint._id);
//   }
//   return complaint;
// };

// const deleteComplaintService = async (id) => {
//   const complaint = await Complaint.findByIdAndDelete(id);
//   return complaint;
// };

// // ========== CONTROLLER ==========

// // CREATE - بدون asyncHandler (الحل النهائي)
// exports.createComplaint = async (req, res) => {
//   try {
//     const data = { ...req.body };

//     console.log('=== CREATE COMPLAINT REQUEST ===');
//     console.log('Received data:', {
//       customerName: data.customerName,
//       customerEmail: data.customerEmail,
//       customerPhone: data.customerPhone,
//       hasComplaintText: !!data.complaintText,
//       complaintTextLength: data.complaintText?.length || 0,
//       type: data.type,
//       status: data.status,
//       priority: data.priority,
//     });

//     // Validate required fields
//     if (
//       !data.customerName ||
//       !data.customerEmail ||
//       !data.customerPhone ||
//       !data.complaintText
//     ) {
//       console.log('Validation failed: Missing required fields');
//       return res.status(400).json({
//         status: 'error',
//         message: 'Missing required fields',
//       });
//     }

//     // Ensure complaintText is not empty
//     if (
//       typeof data.complaintText === 'string' &&
//       data.complaintText.trim() === ''
//     ) {
//       console.log('Validation failed: complaintText is empty');
//       return res.status(400).json({
//         status: 'error',
//         message: 'complaintText cannot be empty',
//       });
//     }

//     // Map complaintText to description for storage
//     if (data.complaintText && !data.description) {
//       data.description = data.complaintText;
//     }

//     // Set dateOpened if not provided
//     if (!data.dateOpened) {
//       data.dateOpened = new Date().toISOString();
//     }

//     // Set lastModified
//     data.lastModified = new Date().toISOString();

//     // Clean up data - remove undefined fields
//     const cleanData = {};
//     Object.keys(data).forEach((key) => {
//       if (data[key] !== undefined) {
//         cleanData[key] = data[key];
//       }
//     });

//     console.log('Creating complaint with clean data...');
//     console.log('Clean data keys:', Object.keys(cleanData));

//     // Create and save complaint to MongoDB
//     const complaint = await createComplaintService(cleanData);

//     console.log('✅ Complaint created and saved successfully:', {
//       _id: complaint._id,
//       complaintId: complaint.complaintId,
//       customerName: complaint.customerName,
//       customerId: complaint.customerId,
//     });

//     // Verify the complaint was saved by fetching it again from MongoDB
//     const verifyComplaint = await Complaint.findById(complaint._id);
//     if (!verifyComplaint) {
//       console.error('❌ WARNING: Complaint was not saved to database!');
//       return res.status(500).json({
//         status: 'error',
//         message: 'Failed to save complaint to database',
//       });
//     }
//     console.log(
//       '✅ Verified: Complaint is saved in MongoDB and can be retrieved'
//     );

//     res.status(201).json({
//       status: 'success',
//       data: complaint,
//     });
//   } catch (error) {
//     console.error('❌ Error creating complaint:', error);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({
//       status: 'error',
//       message: error.message || 'Error creating complaint',
//     });
//   }
// };

// // GET ALL - بدون asyncHandler
// exports.getAllComplaints = async (req, res) => {
//   try {
//     console.log('=== FETCHING ALL COMPLAINTS FROM MONGODB ===');

//     // Check MongoDB connection
//     if (mongoose.connection.readyState !== 1) {
//       console.error('❌ MongoDB is not connected!');
//       return res.status(500).json({
//         status: 'error',
//         message: 'Database connection is not ready',
//         results: 0,
//         data: [], // Always return an array for frontend compatibility
//       });
//     }

//     const complaints = await getAllComplaintsService();

//     // Ensure complaints is always an array
//     const complaintsArray = Array.isArray(complaints) ? complaints : [];

//     console.log(`✅ Fetched ${complaintsArray.length} complaints from MongoDB`);

//     if (complaintsArray.length > 0) {
//       console.log('Sample complaint:', {
//         _id: complaintsArray[0]._id,
//         complaintId: complaintsArray[0].complaintId,
//         customerName: complaintsArray[0].customerName,
//       });
//     }

//     res.status(200).json({
//       status: 'success',
//       results: complaintsArray.length,
//       data: complaintsArray,
//     });
//   } catch (error) {
//     console.error('❌ Error fetching complaints:', error);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({
//       status: 'error',
//       message: error.message || 'Error fetching complaints',
//       results: 0,
//       data: [], // Always return an array for frontend compatibility
//     });
//   }
// };

// // GET ONE - بدون asyncHandler
// exports.getComplaintById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Validate that id is a valid MongoDB ObjectId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid complaint ID format',
//       });
//     }

//     const complaint = await getComplaintByIdService(id);
//     if (!complaint) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Complaint not found',
//       });
//     }

//     res.status(200).json({
//       status: 'success',
//       data: complaint,
//     });
//   } catch (error) {
//     console.error('Error fetching complaint:', error);
//     res.status(500).json({
//       status: 'error',
//       message: error.message || 'Error fetching complaint',
//     });
//   }
// };

// // UPDATE - بدون asyncHandler
// exports.updateComplaint = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Validate that id is a valid MongoDB ObjectId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid complaint ID format',
//       });
//     }

//     const data = { ...req.body };

//     // Map complaintText to description if provided
//     if (data.complaintText !== undefined) {
//       data.description = data.complaintText;
//     }

//     // Validate enum values
//     const allowedStatus = Object.values(ComplaintStatus);
//     const allowedPriority = Object.values(ComplaintPriority);
//     const allowedChannel = Object.values(ComplaintChannel);

//     if (data.status && !allowedStatus.includes(data.status)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid status value',
//       });
//     }

//     if (data.priority && !allowedPriority.includes(data.priority)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid priority value',
//       });
//     }

//     if (data.channel && !allowedChannel.includes(data.channel)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid channel value',
//       });
//     }

//     // Update lastModified
//     data.lastModified = new Date().toISOString();

//     const complaint = await updateComplaintService(id, data);
//     if (!complaint) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Complaint not found',
//       });
//     }

//     res.status(200).json({
//       status: 'success',
//       data: complaint,
//     });
//   } catch (error) {
//     console.error('Error updating complaint:', error);
//     res.status(500).json({
//       status: 'error',
//       message: error.message || 'Error updating complaint',
//     });
//   }
// };

// // DELETE - بدون asyncHandler
// exports.deleteComplaint = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Validate that id is a valid MongoDB ObjectId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Invalid complaint ID format',
//       });
//     }

//     const complaint = await deleteComplaintService(id);
//     if (!complaint) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'Complaint not found',
//       });
//     }

//     res.status(204).json({
//       status: 'success',
//       message: 'Complaint deleted successfully',
//     });
//   } catch (error) {
//     console.error('Error deleting complaint:', error);
//     res.status(500).json({
//       status: 'error',
//       message: error.message || 'Error deleting complaint',
//     });
//   }
// };
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const {
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintChannel,
} = require('../Models/complaintModel');

// ========== HELPER FUNCTION ==========
/**
 * Find complaint by ID (supports both ObjectId and custom complaintId)
 * @param {string} id - Either MongoDB ObjectId or custom complaintId
 * @returns {Promise<Complaint|null>}
 */
const findComplaintById = async (id) => {
  // Check if id is a valid MongoDB ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

  if (isValidObjectId) {
    // If it's a valid ObjectId, search by _id
    return await Complaint.findById(id);
  } else {
    // If it's not a valid ObjectId, search by complaintId field
    return await Complaint.findOne({ complaintId: id });
  }
};

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
  // Use helper function to support both ObjectId and complaintId
  return await findComplaintById(id);
};

const updateComplaintService = async (id, data) => {
  // Use helper function to find complaint
  const complaint = await findComplaintById(id);

  if (!complaint) {
    return null;
  }

  // Handle version conflict (optimistic locking)
  if (data.version && complaint.version !== data.version) {
    throw new Error('Version conflict. Please refresh and try again.');
  }

  // Update the complaint fields
  Object.keys(data).forEach((key) => {
    if (
      key !== 'version' &&
      key !== '_id' &&
      key !== 'complaintId' &&
      data[key] !== undefined
    ) {
      complaint[key] = data[key];
    }
  });

  // Increment version
  complaint.version = (complaint.version || 1) + 1;
  complaint.lastModified = new Date().toISOString();

  // Save the updated complaint
  await complaint.save();
  console.log('✅ Complaint updated and saved to MongoDB:', {
    _id: complaint._id,
    complaintId: complaint.complaintId,
  });

  return complaint;
};

const deleteComplaintService = async (id) => {
  // Use helper function to find complaint
  const complaint = await findComplaintById(id);

  if (!complaint) {
    return null;
  }

  // Delete using _id (MongoDB's primary key)
  await Complaint.findByIdAndDelete(complaint._id);
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
        results: 0,
        data: [], // Always return an array for frontend compatibility
      });
    }

    const complaints = await getAllComplaintsService();

    // Ensure complaints is always an array
    const complaintsArray = Array.isArray(complaints) ? complaints : [];

    console.log(`✅ Fetched ${complaintsArray.length} complaints from MongoDB`);

    if (complaintsArray.length > 0) {
      console.log('Sample complaint:', {
        _id: complaintsArray[0]._id,
        complaintId: complaintsArray[0].complaintId,
        customerName: complaintsArray[0].customerName,
      });
    }

    res.status(200).json({
      status: 'success',
      results: complaintsArray.length,
      data: complaintsArray,
    });
  } catch (error) {
    console.error('❌ Error fetching complaints:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching complaints',
      results: 0,
      data: [], // Always return an array for frontend compatibility
    });
  }
};

// GET ONE - بدون asyncHandler - FIXED ✅
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== GET COMPLAINT BY ID ===');
    console.log('Requested ID:', id);
    console.log('Is valid ObjectId?', mongoose.Types.ObjectId.isValid(id));

    // Use helper function to support both ObjectId and complaintId
    const complaint = await getComplaintByIdService(id);

    if (!complaint) {
      console.log('❌ Complaint not found with ID:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found',
      });
    }

    console.log('✅ Complaint found:', {
      _id: complaint._id,
      complaintId: complaint.complaintId,
    });

    res.status(200).json({
      status: 'success',
      data: complaint,
    });
  } catch (error) {
    console.error('❌ Error fetching complaint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching complaint',
    });
  }
};

// UPDATE - بدون asyncHandler - FIXED ✅
exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    console.log('=== UPDATE COMPLAINT ===');
    console.log('Requested ID:', id);
    console.log('Update data keys:', Object.keys(data));
    console.log('Is valid ObjectId?', mongoose.Types.ObjectId.isValid(id));

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

    // Use helper function to find and update complaint
    const complaint = await updateComplaintService(id, data);

    if (!complaint) {
      console.log('❌ Complaint not found with ID:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found',
      });
    }

    console.log('✅ Complaint updated successfully:', {
      _id: complaint._id,
      complaintId: complaint.complaintId,
    });

    res.status(200).json({
      status: 'success',
      data: complaint,
    });
  } catch (error) {
    console.error('❌ Error updating complaint:', error);
    console.error('Error stack:', error.stack);

    // Handle version conflict
    if (error.message.includes('Version conflict')) {
      return res.status(409).json({
        status: 'error',
        message: error.message,
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating complaint',
    });
  }
};

// DELETE - بدون asyncHandler - FIXED ✅
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== DELETE COMPLAINT ===');
    console.log('Requested ID:', id);
    console.log('Is valid ObjectId?', mongoose.Types.ObjectId.isValid(id));

    // Use helper function to find and delete complaint
    const complaint = await deleteComplaintService(id);

    if (!complaint) {
      console.log('❌ Complaint not found with ID:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found',
      });
    }

    console.log('✅ Complaint deleted successfully:', {
      _id: complaint._id,
      complaintId: complaint.complaintId,
    });

    res.status(204).json({
      status: 'success',
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting complaint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error deleting complaint',
    });
  }
};
