const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Customer = require('../Models/customerModel');

// Get all customers
exports.getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({});
  res.status(200).json({ results: customers.length, data: customers });
});

// Get single customer by Mongo _id
exports.getCustomerById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const customer = await Customer.findById(id);
  if (!customer) {
    return next(new ApiError(`No customer for this id ${id}`, 404));
  }
  res.status(200).json({ data: customer });
});

// Create new customer
exports.createCustomer = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };

    // Basic validation
    if (!body.id || !body.name || !body.phone) {
      return next(new ApiError('id, name and phone are required', 400));
    }

    const customer = await Customer.create(body);
    res.status(201).json({ data: customer });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.id) {
      return next(new ApiError('Customer id already exists', 400));
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return next(
        new ApiError(`Customer validation failed: ${messages.join(', ')}`, 400)
      );
    }
    return next(new ApiError(error.message || 'Error creating customer', 500));
  }
});

// Update customer
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };
    delete body._id;

    const customer = await Customer.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return next(
        new ApiError(`No customer for this id ${req.params.id}`, 404)
      );
    }

    res.status(200).json({ data: customer });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return next(
        new ApiError(`Customer validation failed: ${messages.join(', ')}`, 400)
      );
    }
    return next(new ApiError(error.message || 'Error updating customer', 500));
  }
});

// Delete customer
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return next(new ApiError(`No customer for this id ${id}`, 404));
    }
    res.status(204).send();
  } catch (error) {
    return next(new ApiError(error.message || 'Error deleting customer', 500));
  }
});


