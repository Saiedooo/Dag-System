const multer = require('multer');
const sharp = require('sharp');
const ApiError = require('../utils/apiError');
const { put } = require('@vercel/blob'); // Vercel Blob

// Multer memory storage
const multerStorage = multer.memoryStorage();

// Allow image-only uploads
const multerFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new ApiError('Only image files are allowed', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Upload max 5 images (attachments)
exports.uploadUserImages = upload.array('attachments', 5);

// Process images + upload to Vercel Blob
exports.processAndUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    const attachments = [];

    for (const file of req.files) {
      // Resize/Compress
      const optimized = await sharp(file.buffer)
        .resize(1200) // optional
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload to Vercel Blob
      const blob = await put(
        `complaints/${Date.now()}-${file.originalname}`,
        optimized,
        {
          access: 'public',
          contentType: 'image/jpeg',
        }
      );

      // Save URL only
      attachments.push(blob.url);
    }

    // Merge with existing items
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
