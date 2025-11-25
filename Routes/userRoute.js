const express = require('express');

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  uploadUserImage,
  resizeImage,
} = require('../Services/userService');

const authService = require('../Services/authServices');

const router = express.Router();

// router.use(authService.protect);

// Admin
// router.use(authService.allowedTo('admin', 'manager'));

router
  .route('/')
  .get(getAllUsers)
  .post(uploadUserImage, resizeImage, createUser);
router
  .route('/:id')
  .get(getUserById)
  .put(uploadUserImage, resizeImage, updateUser)
  .delete(deleteUser);

module.exports = router;
