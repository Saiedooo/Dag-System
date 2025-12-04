const express = require('express');
const {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} = require('../Services/complaintService');

const router = express.Router();

// تأكد إن الـ routes مش بتستخدم asyncHandler
// كل الـ controllers هتتعامل مع الـ errors بنفسها

router.route('/').get(getAllComplaints).post(createComplaint);

router
  .route('/:id')
  .get(getComplaintById)
  .put(updateComplaint)
  .delete(deleteComplaint);

module.exports = router;
