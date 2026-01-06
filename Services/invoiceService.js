const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Invoice = require('../Models/invoiceModel');
const Customer = require('../Models/customerModel'); // <--- أضف ده: استورد Customer model

// @desc Get all invoices
// @route GET /api/v1/invoices
// @access Private
exports.getAllInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({});

  // نضيف بيانات العميل يدويًا
  const populated = await Promise.all(
    invoices.map(async (inv) => {
      const customer = await Customer.findOne({ id: inv.customer });
      return {
        ...inv.toObject(),
        customerName: customer?.name || 'غير معروف',
        customerPhone: customer?.phone || '',
      };
    })
  );

  res.status(200).json({
    results: populated.length,
    data: populated,
  });
});

// @desc Get single invoice by id
// @route GET /api/v1/invoices/:id
// @access Private
exports.getInvoiceById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id).populate('customer', 'name phone');
  if (!invoice) {
    return next(new ApiError(`No invoice found for this id ${id}`, 404));
  }
  res.status(200).json({ data: invoice });
});

// @desc Create new invoice
// @route POST /api/v1/invoices
// @access Private
exports.createInvoice = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (!body.invoiceCode) {
      body.invoiceCode = `INV-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;
    }

    // التحقق من وجود العميل بالـ custom id فقط
    if (!body.customer) {
      return next(new ApiError('معرف العميل (customer) مطلوب', 400));
    }

    const customer = await Customer.findOne({ id: body.customer });
    if (!customer) {
      return next(
        new ApiError(`لا يوجد عميل بهذا المعرف: ${body.customer}`, 400)
      );
    }

    // نحفظ الـ custom id مباشرة (مش _id)
    body.customer = customer.id; // String

    body.totalPrice = Number(body.totalPrice) || 0;

    if (!body.products || body.products.length === 0) {
      body.products = [
        {
          productName: 'متابعة تقييم يومي',
          price: body.totalPrice,
          quantity: 1,
        },
      ];
    }

    const invoice = await Invoice.create(body);

    // بعد الإنشاء، نضيف مهمة تقييم تلقائيًا
    await DailyFeedbackTask.findOneAndUpdate(
      { invoiceId: invoice.invoiceCode },
      {
        customerId: customer.id,
        customerName: customer.name,
        invoiceId: invoice.invoiceCode,
        invoiceDate: body.invoiceDate || new Date(),
        status: 'Pending',
        branchId: customer.primaryBranchId || null,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ data: invoice });
  } catch (error) {
    // باقي الـ error handling زي ما هو
  }
});

// @desc Update invoice
// @route PUT /api/v1/invoices/:id
// @access Private
exports.updateInvoice = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };
    delete body._id;

    // لو customer موجود في التحديث، نبحث عنه كمان
    if (body.customer) {
      const customer = await Customer.findOne({ id: body.customer });
      if (!customer) {
        return next(new ApiError('معرف العميل غير موجود', 400));
      }
      body.customer = customer._id;
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

// @desc Delete invoice
// @route DELETE /api/v1/invoices/:id
// @access Private
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
