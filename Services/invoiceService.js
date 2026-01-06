const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Invoice = require('../Models/invoiceModel');
const Customer = require('../Models/customerModel'); // استيراد Customer model

// @desc    Get all invoices (مع تحسين الأداء وإضافة اسم ورقم العميل)
// @route   GET /api/v1/invoices
// @access  Private
exports.getAllInvoices = asyncHandler(async (req, res) => {
  // جلب الفواتير مع الحقول الضرورية فقط (بدون populate ثقيل)
  const invoices = await Invoice.find({})
    .select('invoiceCode customer totalPrice products createdAt updatedAt')
    .lean(); // أسرع بكتير من mongoose documents

  // لو مفيش فواتير → رجع مصفوفة فاضية مباشرة
  if (invoices.length === 0) {
    return res.status(200).json({
      results: 0,
      data: [],
    });
  }

  // استخراج كل customer custom ids (اللي محفوظة كـ String في حقل customer)
  const customerIds = [
    ...new Set(invoices.map((inv) => inv.customer).filter(Boolean)),
  ];

  // جلب كل العملاء المطلوبين مرة واحدة (N+1 problem حليناه)
  const customers = await Customer.find({ id: { $in: customerIds } })
    .select('id name phone')
    .lean();

  // تحويلهم إلى map عشان الـ lookup أسرع O(1)
  const customersMap = {};
  customers.forEach((cust) => {
    customersMap[cust.id] = cust;
  });

  // إضافة بيانات العميل لكل فاتورة
  const populatedInvoices = invoices.map((inv) => {
    const customer = customersMap[inv.customer] || null;
    return {
      ...inv,
      customerName: customer?.name || 'غير معروف',
      customerPhone: customer?.phone || '',
    };
  });

  res.status(200).json({
    results: populatedInvoices.length,
    data: populatedInvoices,
  });
});

// @desc    Get single invoice by MongoDB _id
// @route   GET /api/v1/invoices/:id
// @access  Private
exports.getInvoiceById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id)
    .select('invoiceCode customer totalPrice products createdAt updatedAt')
    .lean();

  if (!invoice) {
    return next(new ApiError(`لا توجد فاتورة بهذا المعرف: ${id}`, 404));
  }

  // جلب بيانات العميل لو موجود
  let customerName = 'غير معروف';
  let customerPhone = '';

  if (invoice.customer) {
    const customer = await Customer.findOne({ id: invoice.customer })
      .select('name phone')
      .lean();
    if (customer) {
      customerName = customer.name;
      customerPhone = customer.phone || '';
    }
  }

  res.status(200).json({
    data: {
      ...invoice,
      customerName,
      customerPhone,
    },
  });
});

// @desc    Create new invoice
// @route   POST /api/v1/invoices
// @access  Private
exports.createInvoice = asyncHandler(async (req, res, next) => {
  const body = { ...req.body };

  // توليد كود فاتورة لو مش موجود
  if (!body.invoiceCode) {
    body.invoiceCode = `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  // التحقق من وجود معرف العميل (custom id)
  if (!body.customer) {
    return next(new ApiError('معرف العميل (customer id) مطلوب', 400));
  }

  // البحث عن العميل باستخدام الـ custom id
  const customer = await Customer.findOne({ id: body.customer });
  if (!customer) {
    return next(new ApiError(`العميل غير موجود: ${body.customer}`, 404));
  }

  // نحفظ الـ custom id كـ String (مش MongoDB _id)
  body.customer = customer.id;

  // تحويل السعر إلى رقم
  body.totalPrice = Number(body.totalPrice) || 0;

  // لو مفيش منتجات → نضيف منتج افتراضي
  if (!body.products || body.products.length === 0) {
    body.products = [
      {
        productName: 'شراء عام',
        price: body.totalPrice,
        quantity: 1,
      },
    ];
  }

  const invoice = await Invoice.create(body);

  res.status(201).json({
    data: {
      ...invoice.toObject(),
      customerName: customer.name,
      customerPhone: customer.phone || '',
    },
  });
});

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:id
// @access  Private
exports.updateInvoice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const body = { ...req.body };

  // منع تعديل _id
  delete body._id;
  delete body.invoiceCode; // اختياري: لو مش عايز تسمح بتعديل الكود

  // لو فيه تغيير في العميل
  if (body.customer) {
    const customer = await Customer.findOne({ id: body.customer });
    if (!customer) {
      return next(new ApiError(`العميل غير موجود: ${body.customer}`, 404));
    }
    body.customer = customer.id; // نحفظ الـ custom id
  }

  // تحديث الفاتورة
  const invoice = await Invoice.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).lean();

  if (!invoice) {
    return next(new ApiError(`لا توجد فاتورة بهذا المعرف: ${id}`, 404));
  }

  // إضافة اسم ورقم العميل في الرد
  let customerName = 'غير معروف';
  let customerPhone = '';

  if (invoice.customer) {
    const customer = await Customer.findOne({ id: invoice.customer })
      .select('name phone')
      .lean();
    if (customer) {
      customerName = customer.name;
      customerPhone = customer.phone || '';
    }
  }

  res.status(200).json({
    data: {
      ...invoice,
      customerName,
      customerPhone,
    },
  });
});

// @desc    Delete invoice
// @route   DELETE /api/v1/invoices/:id
// @access  Private
exports.deleteInvoice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const invoice = await Invoice.findByIdAndDelete(id);

  if (!invoice) {
    return next(new ApiError(`لا توجد فاتورة بهذا المعرف: ${id}`, 404));
  }

  res.status(204).send();
});
