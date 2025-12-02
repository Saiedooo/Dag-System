const express = require('express');

const {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} = require('../Services/complaintService');

const {
  uploadComplaintImages,
  processComplaintImages,
} = require('../middleware/uploadImageMiddleware');

const authService = require('../Services/authServices');

const router = express.Router();

// router.use(authService.protect);
// router.use(authService.allowedTo('admin', 'manager'));

router
  .route('/')
  .get(getAllComplaints)
  .post(uploadComplaintImages, processComplaintImages, createComplaint);

router
  .route('/:id')
  .get(getComplaintById)
  .put(uploadComplaintImages, processComplaintImages, updateComplaint)
  .delete(deleteComplaint);

module.exports = router;
