const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Invoice = require('../Models/invoiceModel');
const mongoose = require('mongoose'); // <--- أضف السطر ده في الأول

// @desc Create new invoice
// @route POST /api/v1/invoices
// @access Private
exports.createInvoice = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };

    // إنشاء invoiceCode تلقائي
    if (!body.invoiceCode) {
      body.invoiceCode = `INV-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;
    }

    // تحويل customer string إلى ObjectId
    if (body.customer && typeof body.customer === 'string') {
      try {
        body.customer = new mongoose.Types.ObjectId(body.customer);
      } catch (error) {
        return next(new ApiError('معرف العميل غير صحيح', 400));
      }
    }

    if (!body.customer) {
      return next(new ApiError('معرف العميل (customer) مطلوب', 400));
    }

    // totalPrice: نقبل 0 أو أي رقم موجب
    body.totalPrice = Number(body.totalPrice) || 0;

    // لو products مش موجود، نعمل افتراضي
    if (
      !body.products ||
      !Array.isArray(body.products) ||
      body.products.length === 0
    ) {
      body.products = [
        {
          productName: 'شراء متنوع (متابعة تقييم يومي)',
          price: body.totalPrice,
          quantity: 1,
        },
      ];
    }

    const invoice = await Invoice.create(body);
    const populatedInvoice = await Invoice.findById(invoice._id).populate(
      'customer',
      'name phone id'
    );

    res.status(201).json({ data: populatedInvoice });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError('كود الفاتورة مكرر', 400));
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      const messages = Object.values(error.errors || {})
        .map((e) => e.message)
        .join(', ');
      return next(
        new ApiError(`خطأ في البيانات: ${messages || error.message}`, 400)
      );
    }
    return next(new ApiError(error.message || 'فشل في إنشاء الفاتورة', 500));
  }
});

// باقي الدوال زي ما هي...
exports.getAllInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({}).populate('customer', 'name phone');
  res.status(200).json({ results: invoices.length, data: invoices });
});

exports.getInvoiceById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id).populate('customer', 'name phone');
  if (!invoice)
    return next(new ApiError(`No invoice found for this id ${id}`, 404));
  res.status(200).json({ data: invoice });
});

exports.updateInvoice = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };
    delete body._id;

    // نفس التحويل للـ customer في الـ update
    if (body.customer && typeof body.customer === 'string') {
      body.customer = new mongoose.Types.ObjectId(body.customer);
    }

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
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      const messages = Object.values(error.errors || {})
        .map((e) => e.message)
        .join(', ');
      return next(
        new ApiError(`خطأ في البيانات: ${messages || error.message}`, 400)
      );
    }
    return next(new ApiError(error.message || 'Error updating invoice', 500));
  }
});

exports.deleteInvoice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const invoice = await Invoice.findByIdAndDelete(id);
  if (!invoice)
    return next(new ApiError(`No invoice found for this id ${id}`, 404));
  res.status(204).send();
});
