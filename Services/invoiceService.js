const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Invoice = require('../Models/invoiceModel');

// @desc    Get all invoices
// @route   GET /api/v1/invoices
// @access  Private
exports.getAllInvoices = asyncHandler(async (req, res) => {
  // Later you can add filters (date range, customer, etc.)
  const invoices = await Invoice.find({}).populate('customer');

  res.status(200).json({
    results: invoices.length,
    data: invoices,
  });
});

// @desc    Get single invoice by id
// @route   GET /api/v1/invoices/:id
// @access  Private
exports.getInvoiceById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id).populate('customer');

  if (!invoice) {
    return next(new ApiError(`No invoice found for this id ${id}`, 404));
  }

  res.status(200).json({ data: invoice });
});

// @desc    Create new invoice
// @route   POST /api/v1/invoices
// @access  Private
exports.createInvoice = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };

    // Basic validation for required fields
    if (!body.invoiceCode || !body.customer || !body.products || !body.totalPrice) {
      return next(new ApiError('invoiceCode, customer, products and totalPrice are required', 400));
    }

    // Ensure products is an array
    if (!Array.isArray(body.products)) {
      return next(new ApiError('products must be an array', 400));
    }

    const invoice = await Invoice.create(body);

    res.status(201).json({ data: invoice });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.invoiceCode) {
      // Duplicate invoiceCode
      return next(new ApiError('Invoice code already exists', 400));
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return next(
        new ApiError(`Invoice validation failed: ${messages.join(', ')}`, 400)
      );
    }

    return next(new ApiError(error.message || 'Error creating invoice', 500));
  }
});

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:id
// @access  Private
exports.updateInvoice = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };

    // Do not allow changing _id
    delete body._id;

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!invoice) {
      return next(
        new ApiError(`No invoice found for this id ${req.params.id}`, 404)
      );
    }

    res.status(200).json({ data: invoice });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return next(
        new ApiError(`Invoice validation failed: ${messages.join(', ')}`, 400)
      );
    }

    return next(new ApiError(error.message || 'Error updating invoice', 500));
  }
});

// @desc    Delete invoice
// @route   DELETE /api/v1/invoices/:id
// @access  Private
exports.deleteInvoice = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByIdAndDelete(id);

    if (!invoice) {
      return next(new ApiError(`No invoice found for this id ${id}`, 404));
    }

    res.status(204).send();
  } catch (error) {
    return next(new ApiError(error.message || 'Error deleting invoice', 500));
  }
});


