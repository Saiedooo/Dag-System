const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const complaintModel = require('../Models/complaintModel');

// GET all complaints
exports.getAllComplaints = asyncHandler(async (req, res, next) => {
  const documents = await complaintModel.find({});
  res.status(200).json({ results: documents.length, data: documents });
});

// GET complaint by ID
exports.getComplaintById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const document = await complaintModel.findById(id);
  if (!document) throw new ApiError(`No document for this id ${id}`, 404);
  res.status(200).json({ data: document });
});

// CREATE complaint
exports.createComplaint = asyncHandler(async (req, res, next) => {
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

  const newDoc = new complaintModel(filteredBody);
  await newDoc.save();
  res.status(201).json({ data: newDoc });
});

// UPDATE complaint
exports.updateComplaint = asyncHandler(async (req, res, next) => {
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

  // Validate status if exists
  if (body.status) {
    body.status = String(body.status).trim();
    const validStatuses = Object.values(complaintModel.ComplaintStatus);
    if (!validStatuses.includes(body.status)) delete body.status;
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
    throw new ApiError(`No document for this id ${req.params.id}`, 404);
  res.status(200).json({ data: document });
});

// DELETE complaint
exports.deleteComplaint = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const document = await complaintModel.findByIdAndDelete(id);
  if (!document) throw new ApiError(`No document for this id ${id}`, 404);
  res.status(204).send();
});
