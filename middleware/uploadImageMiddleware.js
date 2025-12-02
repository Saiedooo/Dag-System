const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { put } = require('@vercel/blob');
const ApiError = require('../utils/apiError');

// Configure multer for memory storage
const multerStorage = multer.memoryStorage();

// Helper function to get blob token
const getBlobToken = () => {
  // Try to get token from environment variables first
  const envToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (envToken) return envToken;

  // Fallback token for development (only if env token is not available)
  if (process.env.NODE_ENV === 'development') {
    return 'vercel_blob_rw_Svluq1Z91NHBLkYR_lpPD3Had7F1qQONQNZ90XtmCWuiWAn';
  }

  throw new Error('Blob token not configured');
};

// Helper function to upload to blob storage
const uploadToBlob = async (filename, buffer) => {
  try {
    const token = getBlobToken();
    const { url } = await put(filename, buffer, {
      access: 'public',
      token: token,
    });
    return url;
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new Error(`Failed to upload to blob storage: ${error.message}`);
  }
};

// Configure multer filter
const multerFilter = (req, file, cb) => {
  try {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new ApiError('Not an image! Please upload only images.', 400), false);
    }
  } catch (error) {
    console.error('Multer filter error:', error);
    cb(new ApiError('Error processing file type', 400), false);
  }
};

// Configure upload
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload single image
exports.uploadSingleImage = (fieldName) => upload.single(fieldName);

// Process image after upload
exports.processImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

    const processedBuffer = await sharp(req.file.buffer)
      .resize(800, 800, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload to Vercel Blob
    const token = getBlobToken();
    const { url } = await put(filename, processedBuffer, {
      access: 'public',
      token: token,
    });

    // Set the URL in the request body using the original field name
    req.body[req.file.fieldname] = url;

    next();
  } catch (error) {
    console.error('Image processing error:', error);
    next(new ApiError(`Error processing image: ${error.message}`, 400));
  }
};

// ----- User images (existing behavior) -----
exports.uploadUserImages = upload.fields([
  { name: 'personalPhoto', maxCount: 1 },
  { name: 'idPhoto', maxCount: 1 },
  { name: 'businessCardPhoto', maxCount: 1 },
]);

exports.processAndUpload = async (req, res, next) => {
  try {
    if (!req.files) return next();

    const processPromises = Object.keys(req.files).map(async (fieldName) => {
      const file = req.files[fieldName][0];

      const timestamp = Date.now();
      const uniqueId = uuidv4();
      const filename = `user-${uniqueId}-${timestamp}-${fieldName}.jpeg`;

      const processedBuffer = await sharp(file.buffer)
        .resize(800, 800, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toBuffer();

      const token = getBlobToken();
      const { url } = await put(filename, processedBuffer, {
        access: 'public',
        token,
      });

      req.body[fieldName] = url;
    });

    await Promise.all(processPromises);
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    next(new ApiError(`Error processing images: ${error.message}`, 400));
  }
};

// ----- Complaint attachments as base64 -----
// Upload up to 5 files from field "attachments" and convert them to base64 strings
exports.uploadComplaintImages = upload.array('attachments', 5);

exports.processComplaintImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    const attachments = await Promise.all(
      req.files.map(async (file) => {
        const buffer = await sharp(file.buffer)
          .jpeg({ quality: 80 })
          .toBuffer();

        // Correct template string for data URL
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
      })
    );

    // Merge with existing attachments if any
    if (Array.isArray(req.body.attachments)) {
      req.body.attachments = [...req.body.attachments, ...attachments];
    } else {
      req.body.attachments = attachments;
    }

    next();
  } catch (err) {
    next(err);
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
