const express = require('express');

const {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} = require('../Services/complaintService');

const {
  uploadSingleImage,
  processAndUpload,
  uploadUserImages,
} = require('../middleware/uploadImageMiddleware');

const authService = require('../Services/authServices');

const router = express.Router();

// router.use(authService.protect);

// Admin
// router.use(authService.allowedTo('admin', 'manager'));

router
  .route('/')
  .get(getAllComplaints)
  .post(uploadUserImages, processAndUpload, createComplaint);
router
  .route('/:id')
  .get(getComplaintById)
  .put(uploadUserImages, processAndUpload, updateComplaint)
  .delete(deleteComplaint);

module.exports = router;
