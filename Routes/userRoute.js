const express = require('express');
const ensureDbConnection = require('../middleware/dbConnectionMiddleware');

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

// Ensure database connection before handling user requests
router.use(ensureDbConnection);

// router.use(authService.protect);

// Admin
// router.use(authService.allowedTo('admin', 'manager'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;
