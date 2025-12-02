const express = require('express');
const {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} = require('../Services/complaintService');

const router = express.Router();

// router.use(authService.protect);
// router.use(authService.allowedTo('admin', 'manager'));

router.route('/').get(getAllComplaints).post(createComplaint);

router
  .route('/:id')
  .get(getComplaintById)
  .put(updateComplaint)
  .delete(deleteComplaint);

module.exports = router;
