const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
// const ApiFeatures = require('../utils/apiFeatures');
const { uploadSingleImage } = require('../middleware/uploadImageMiddleware');
const userModel = require('../Models/UserModel.js');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Upload single image
exports.uploadUserImage = uploadSingleImage('profileImg');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/users/${filename}`);

    // Save image into our db
  }

  next();
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const document = await userModel.findByIdAndDelete(id);

  if (!document) {
    return next(new ApiError(`No document for this id ${id}`, 404));
  }

  // Trigger "remove" event when update document
  document.remove();
  res.status(204).send();
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const document = await userModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  // Trigger "save" event when update document
  document.save();
  res.status(200).json({ data: document });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  // Ensure mongoose bufferCommands is enabled
  const mongoose = require('mongoose');
  mongoose.set('bufferCommands', true);

  // Double-check connection is ready
  if (mongoose.connection.readyState !== 1) {
    // Wait for connection (up to 5 seconds)
    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (mongoose.connection.readyState !== 1) {
      return next(
        new ApiError('Database connection is not ready. Please try again.', 503)
      );
    }
  }

  const newDoc = await userModel.create(req.body);
  res.status(201).json({ data: newDoc });
});

exports.getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  // 1) Build query
  let query = userModel.findById(id);

  // 2) Execute query
  const document = await query;

  if (!document) {
    return next(new ApiError(`No document for this id ${id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  let filter = {};

  // Build query
  const documents = await userModel.find(filter);
  const documentsCounts = documents.length;
  //Still   Paginate
  // Execute query

  res.status(200).json({ results: documentsCounts, data: documents });
});
