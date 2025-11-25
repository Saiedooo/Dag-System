const express = require('express');

const {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,

  uploadUserImage,
  resizeImage,
} = require('../Services/complaintService');

const authService = require('../Services/authServices');

const router = express.Router();

// router.use(authService.protect);

// Admin
// router.use(authService.allowedTo('admin', 'manager'));

router
  .route('/')
  .get(getAllComplaints)
  .post(uploadUserImage, resizeImage, createComplaint);
router
  .route('/:id')
  .get(getComplaintById)
  .put(uploadUserImage, resizeImage, updateComplaint)
  .delete(deleteComplaint);

module.exports = router;
