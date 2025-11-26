const express = require('express');

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  uploadUserImage,
} = require('../Services/userService');

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

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;
