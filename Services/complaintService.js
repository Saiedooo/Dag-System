const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
// const ApiFeatures = require('../utils/apiFeatures');
const { uploadSingleImage } = require('../middleware/uploadImageMiddleware');
const complaintModel = require('../Models/complaintModel');

// // Upload single image
// exports.uploadUserImage = uploadSingleImage('image');

// // Image processing
// exports.resizeImage = asyncHandler(async (req, res, next) => {
//   const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

//   if (req.file) {
//     await sharp(req.file.buffer)
//       .resize(600, 600)
//       .toFormat('jpeg')
//       .jpeg({ quality: 95 })
//       .toFile(`uploads/users/${filename}`);

//     // Save image into our db
//     req.body.image = filename;
//   }

//   next();
// });

exports.getAllComplaints = async (req, res, next) => {
  try {
    const documents = await complaintModel.find({});
    res.status(200).json({ results: documents.length, data: documents });
  } catch (err) {
    next(new ApiError(err.message || 'Error fetching complaints', 500));
  }
};

exports.getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await complaintModel.findById(id);
    if (!document)
      return next(new ApiError(`No document for this id ${id}`, 404));
    res.status(200).json({ data: document });
  } catch (err) {
    next(new ApiError(err.message || 'Error fetching complaint', 500));
  }
};

exports.createComplaint = async (req, res, next) => {
  try {
    // Use shallow clone to avoid breaking buffers or uploaded files
    const body = { ...req.body };

    // Support both 'customer' and 'customerId'
    if (body.customer !== undefined && body.customer !== null) {
      if (typeof body.customer === 'object' && body.customer._id) {
        body.customerId = String(body.customer._id);
      } else if (typeof body.customer === 'object' && body.customer.toString) {
        body.customerId = body.customer.toString();
      } else {
        body.customerId = String(body.customer);
      }
      delete body.customer;
    }

    if (body.customerId !== undefined && typeof body.customerId === 'object') {
      body.customerId = String(body.customerId);
    }

    // Validate/normalize status
    if (body.status) {
      body.status = String(body.status).trim();
      const validStatuses = Object.values(complaintModel.ComplaintStatus);
      if (!validStatuses.includes(body.status)) {
        body.status = complaintModel.ComplaintStatus.Open;
      }
    } else {
      body.status = complaintModel.ComplaintStatus.Open;
    }

    // Filter allowed fields to prevent extra properties
    const allowedFields = new Set([
      'complaintId',
      'customerId',
      'customerName',
      'dateOpened',
      'channel',
      'type',
      'priority',
      'status',
      'description',
      'assignedTo',
      'resolutionNotes',
      'dateClosed',
      'log',
      'productId',
      'productColor',
      'productSize',
      'attachments',
      'lastModified',
    ]);

    const filteredBody = {};
    Object.keys(body).forEach((k) => {
      if (allowedFields.has(k)) filteredBody[k] = body[k];
    });

    // Create and save (pre save hooks will run)
    const newDoc = new complaintModel(filteredBody);
    await newDoc.save();

    res.status(201).json({ data: newDoc });
  } catch (error) {
    // Mongoose validation / cast errors handling
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return next(
        new ApiError(`Complaint validation failed: ${errors.join(', ')}`, 400)
      );
    }
    if (error.name === 'CastError') {
      return next(new ApiError(`Invalid data format: ${error.message}`, 400));
    }
    next(new ApiError(error.message || 'Error creating complaint', 500));
  }
};

exports.updateComplaint = async (req, res, next) => {
  try {
    // Work on a shallow copy
    const body = { ...req.body };

    // Normalize customer -> customerId
    if (body.customer !== undefined && body.customer !== null) {
      if (typeof body.customer === 'object' && body.customer._id) {
        body.customerId = String(body.customer._id);
      } else if (typeof body.customer === 'object' && body.customer.toString) {
        body.customerId = body.customer.toString();
      } else {
        body.customerId = String(body.customer);
      }
      delete body.customer;
    }
    if (body.customerId !== undefined && typeof body.customerId === 'object') {
      body.customerId = String(body.customerId);
    }

    // Validate status if exists
    if (body.status) {
      body.status = String(body.status).trim();
      const validStatuses = Object.values(complaintModel.ComplaintStatus);
      if (!validStatuses.includes(body.status)) {
        delete body.status;
      }
    }

    // Filter allowed fields
    const allowedFields = new Set([
      'complaintId',
      'customerId',
      'customerName',
      'dateOpened',
      'channel',
      'type',
      'priority',
      'status',
      'description',
      'assignedTo',
      'resolutionNotes',
      'dateClosed',
      'log',
      'productId',
      'productColor',
      'productSize',
      'attachments',
      'lastModified',
    ]);

    const filteredBody = {};
    Object.keys(body).forEach((k) => {
      if (allowedFields.has(k)) filteredBody[k] = body[k];
    });

    const document = await complaintModel.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      { new: true, runValidators: true }
    );

    if (!document)
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );

    // No document.save() here — findByIdAndUpdate already persisted changes
    res.status(200).json({ data: document });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return next(
        new ApiError(`Complaint validation failed: ${errors.join(', ')}`, 400)
      );
    }
    if (error.name === 'CastError') {
      return next(new ApiError(`Invalid data format: ${error.message}`, 400));
    }
    next(new ApiError(error.message || 'Error updating complaint', 500));
  }
};

exports.deleteComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await complaintModel.findByIdAndDelete(id);
    if (!document)
      return next(new ApiError(`No document for this id ${id}`, 404));
    // don't call document.remove() — already deleted
    res.status(204).send();
  } catch (error) {
    next(new ApiError(error.message || 'Error deleting complaint', 500));
  }
};
