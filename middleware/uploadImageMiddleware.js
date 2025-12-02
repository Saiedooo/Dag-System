const multer = require('multer');
const sharp = require('sharp');
const ApiError = require('../utils/apiError');

// Configure multer for memory storage
const multerStorage = multer.memoryStorage();

// Only allow image mimetypes
const multerFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new ApiError('Only image files are allowed', 400), false);
  }
};

// Base upload instance (memory + image-only + size limit)
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Upload a single image (used for users, profile, etc.)
exports.uploadSingleImage = (fieldName) => upload.single(fieldName);

// Upload up to 5 complaint attachments from field "attachments"
exports.uploadUserImages = upload.array('attachments', 5);

// Process attachments: resize/compress and convert to base64, then call next()
exports.processAndUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    const attachments = await Promise.all(
      req.files.map(async (file) => {
        const buffer = await sharp(file.buffer)
          .jpeg({ quality: 80 })
          .toBuffer();

        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
      })
    );

    // If there are existing attachments in the body, merge them
    if (Array.isArray(req.body.attachments)) {
      req.body.attachments = [...req.body.attachments, ...attachments];
    } else {
      req.body.attachments = attachments;
    }

    next();
  } catch (error) {
    console.error('Image processing error:', error);
    next(new ApiError(`Error processing images: ${error.message}`, 400));
  }
};

// const multer = require('multer');
// const ApiError = require('../utils/apiError');

// const multerOptions = () => {
//   const multerStorage = multer.memoryStorage();

//   const multerFilter = function (req, file, cb) {
//     if (file.mimetype.startsWith('image')) {
//       cb(null, true);
//     } else {
//       cb(new ApiError('Only Images allowed', 400), false);
//     }
//   };

//   const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

//   return upload;
// };

// exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);

// exports.uploadMixOfImages = (arrayOfFields) =>
//   multerOptions().fields(arrayOfFields);
