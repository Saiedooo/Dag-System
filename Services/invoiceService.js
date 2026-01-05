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

    // إنشاء invoiceCode تلقائي لو مش موجود
    if (!body.invoiceCode) {
      body.invoiceCode = `INV-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;
    }

    // التحقق من الحقول الإلزامية مع رسائل أوضح
    if (!body.customer) {
      return next(new ApiError('معرف العميل (customer) مطلوب', 400));
    }
    if (!body.totalPrice || body.totalPrice <= 0) {
      return next(
        new ApiError('إجمالي السعر (totalPrice) مطلوب وأكبر من صفر', 400)
      );
    }

    // لو products مش موجود أو فاضي، نعمل واحد افتراضي
    if (
      !body.products ||
      !Array.isArray(body.products) ||
      body.products.length === 0
    ) {
      body.products = [
        {
          productName: body.productName || 'شراء متنوع (فاتورة أولى)',
          price: body.totalPrice,
          quantity: 1,
        },
      ];
    }

    const invoice = await Invoice.create(body);

    // Populate العميل عشان يرجع اسمه في الـ response
    const populatedInvoice = await Invoice.findById(invoice._id).populate(
      'customer',
      'name phone id'
    );

    res.status(201).json({ data: populatedInvoice });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError('كود الفاتورة مكرر', 400));
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return next(new ApiError(`خطأ في البيانات: ${messages.join(', ')}`, 400));
    }
    return next(new ApiError(error.message || 'فشل في إنشاء الفاتورة', 500));
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
