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
  const document = await complaintModel.findByIdAndUpdate(
    req.params.id,
    req.body,
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

exports.createComplaint = asyncHandler(async (req, res) => {
  const newDoc = await complaintModel.create(req.body);
  res.status(201).json({ data: newDoc });
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
