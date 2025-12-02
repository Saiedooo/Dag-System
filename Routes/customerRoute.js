const express = require('express');

const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../Services/customerService');

const authService = require('../Services/authServices');

const router = express.Router();

// router.use(authService.protect);
// router.use(authService.allowedTo('admin', 'manager'));

router.route('/').get(getAllCustomers).post(createCustomer);

router
  .route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;


