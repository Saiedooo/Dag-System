const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Customer = require('../Models/customerModel');

// Get all customers
exports.getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({}).lean();
  res.status(200).json({ results: customers.length, data: customers });
});

// Get single customer by custom id field (not MongoDB _id)
exports.getCustomerById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  // Search by custom 'id' field, not MongoDB '_id'
  const customer = await Customer.findOne({ id: id });
  if (!customer) {
    return next(new ApiError(`No customer for this id ${id}`, 404));
  }
  res.status(200).json({ data: customer });
});

// Create new customer
exports.createCustomer = asyncHandler(async (req, res, next) => {
  try {
    // يدعم JSON و FormData لأن multer يملأ req.body أيضاً
    const body = { ...req.body };

    if (!body.id || !body.name || !body.phone) {
      return next(new ApiError('id, name and phone are required', 400));
    }

    // Set default values if not provided (matching frontend behavior)
    const customerData = {
      id: body.id,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      joinDate: body.joinDate || new Date().toISOString(),
      type: body.type || null,
      governorate: body.governorate || null,
      streetAddress: body.streetAddress || null,
      classification: body.classification || null,
      points: body.points !== undefined ? body.points : 0,
      totalPurchases: body.totalPurchases !== undefined ? body.totalPurchases : 0,
      lastPurchaseDate: body.lastPurchaseDate || null,
      hasBadReputation: body.hasBadReputation !== undefined ? body.hasBadReputation : false,
      source: body.source || null,
      totalPointsEarned: body.totalPointsEarned !== undefined ? body.totalPointsEarned : 0,
      totalPointsUsed: body.totalPointsUsed !== undefined ? body.totalPointsUsed : 0,
      purchaseCount: body.purchaseCount !== undefined ? body.purchaseCount : 0,
      log: body.log || [],
      impressions: body.impressions || [],
      primaryBranchId: body.primaryBranchId || null,
      lastModified: new Date().toISOString(),
    };

    const customer = await Customer.create(customerData);
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

// Update customer by custom id field
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    delete body._id;
    delete body.id; // Prevent changing the id field

    // pre('save') لا يعمل مع findOneAndUpdate، لذلك نحدث lastModified هنا
    body.lastModified = new Date().toISOString();

    // Search by custom 'id' field, not MongoDB '_id'
    const customer = await Customer.findOneAndUpdate({ id: id }, body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return next(
        new ApiError(`No customer for this id ${id}`, 404)
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

// Delete customer by custom id field
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    // Search by custom 'id' field, not MongoDB '_id'
    const customer = await Customer.findOneAndDelete({ id: id });
    if (!customer) {
      return next(new ApiError(`No customer for this id ${id}`, 404));
    }
    res.status(204).send();
  } catch (error) {
    return next(new ApiError(error.message || 'Error deleting customer', 500));
  }
});
