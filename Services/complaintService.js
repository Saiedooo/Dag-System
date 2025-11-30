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

exports.deleteComplaint = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const document = await complaintModel.findByIdAndDelete(id);

  if (!document) {
    return next(new ApiError(`No document for this id ${id}`, 404));
  }

  // Trigger "remove" event when update document
  document.remove();
  res.status(204).send();
});

exports.updateComplaint = asyncHandler(async (req, res, next) => {
  // Handle customer field - support both 'customer' and 'customerId'
  // Accept string IDs (like "CUST-0001") or MongoDB ObjectIds
  if (req.body.customer) {
    // If customer is provided, use it as customerId
    // Convert to string if it's an ObjectId or object
    if (typeof req.body.customer === 'object' && req.body.customer._id) {
      req.body.customerId = String(req.body.customer._id);
    } else if (
      typeof req.body.customer === 'object' &&
      req.body.customer.toString
    ) {
      req.body.customerId = req.body.customer.toString();
    } else {
      req.body.customerId = String(req.body.customer);
    }
    delete req.body.customer;
  }

  // Ensure customerId is a string (handle ObjectId if needed)
  if (req.body.customerId && typeof req.body.customerId === 'object') {
    req.body.customerId = String(req.body.customerId);
  }

  // Trim and validate status if provided
  if (req.body.status) {
    req.body.status = req.body.status.trim();
    const validStatuses = Object.values(complaintModel.ComplaintStatus);
    if (!validStatuses.includes(req.body.status)) {
      // If status is not valid, remove it to keep existing value
      delete req.body.status;
    }
  }

  // Remove any fields that don't exist in the schema to prevent validation errors
  const allowedFields = [
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
  ];

  const filteredBody = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  const document = await complaintModel.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  // Trigger "save" event when update document
  document.save();
  res.status(200).json({ data: document });
});

exports.createComplaint = asyncHandler(async (req, res, next) => {
  try {
    // Create a clean copy of the body to avoid mutating the original
    const body = JSON.parse(JSON.stringify(req.body)); // Deep clone to avoid any reference issues

    // Handle customer field - support both 'customer' and 'customerId'
    // Accept string IDs (like "CUST-0001") or MongoDB ObjectIds
    if (body.customer !== undefined && body.customer !== null) {
      // If customer is provided, use it as customerId
      // Convert to string if it's an ObjectId or object
      if (typeof body.customer === 'object') {
        if (body.customer._id) {
          body.customerId = String(body.customer._id);
        } else if (
          body.customer.toString &&
          typeof body.customer.toString === 'function'
        ) {
          body.customerId = body.customer.toString();
        } else {
          body.customerId = String(body.customer);
        }
      } else {
        body.customerId = String(body.customer);
      }
      // Explicitly remove customer field
      delete body.customer;
    }

    // Ensure customerId is a string (handle ObjectId if needed)
    if (body.customerId !== undefined && body.customerId !== null) {
      if (typeof body.customerId === 'object') {
        body.customerId = String(body.customerId);
      } else {
        body.customerId = String(body.customerId);
      }
    }

    // Trim and validate status
    if (body.status) {
      body.status = String(body.status).trim();
      const validStatuses = Object.values(complaintModel.ComplaintStatus);
      if (!validStatuses.includes(body.status)) {
        // If status is not valid, set to default
        body.status = complaintModel.ComplaintStatus.Open;
      }
    } else {
      // Set default status if not provided
      body.status = complaintModel.ComplaintStatus.Open;
    }

    // Remove any fields that don't exist in the schema to prevent validation errors
    const allowedFields = [
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
    ];

    const filteredBody = {};
    Object.keys(body).forEach((key) => {
      // Explicitly exclude 'customer' field and only include allowed fields
      if (key !== 'customer' && allowedFields.includes(key)) {
        filteredBody[key] = body[key];
      }
    });

    // Final safety check - remove customer if it somehow still exists
    delete filteredBody.customer;

    // Use new Document() approach for more control
    const newDoc = new complaintModel(filteredBody);
    await newDoc.save();

    res.status(201).json({ data: newDoc });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return next(
        new ApiError(`Complaint validation failed: ${errors.join(', ')}`, 400)
      );
    }
    // Handle CastError (ObjectId casting errors)
    if (error.name === 'CastError') {
      return next(new ApiError(`Invalid data format: ${error.message}`, 400));
    }
    // Handle other errors
    return next(new ApiError(error.message || 'Error creating complaint', 500));
  }
});

exports.getComplaintById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  // 1) Build query
  let query = complaintModel.findById(id);

  // 2) Execute query
  const document = await query;

  if (!document) {
    return next(new ApiError(`No document for this id ${id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.getAllComplaints = asyncHandler(async (req, res) => {
  let filter = {};

  // Build query
  const documents = await complaintModel.find(filter);
  const documentsCounts = documents.length;
  //Still   Paginate
  // Execute query

  res.status(200).json({ results: documentsCounts, data: documents });
});
