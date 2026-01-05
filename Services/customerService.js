const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Customer = require('../Models/customerModel');
const Invoice = require('../Models/invoiceModel');

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
JavaScriptexports.createCustomer = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (!body.id || !body.name || !body.phone) {
      return next(new ApiError('id, name and phone are required', 400));
    }

    // استخراج بيانات الفاتورة الأولى إن وجدت
    const initialPurchase = body.initialPurchase || null;
    let extraPoints = 0;
    let totalPurchases = 0;

    let initialInvoice = null;

    if (initialPurchase && initialPurchase.amount > 0) {
      totalPurchases = initialPurchase.amount;

      if (initialPurchase.amount > 2000) {
        extraPoints = 50; // 50 نقطة هدية
      }

      // إنشاء فاتورة أولى بسيطة
      const invoiceCode = `INV-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;

      initialInvoice = await Invoice.create({
        invoiceCode,
        customer: null, // هيتملأ بعد إنشاء العميل
        products: [
          {
            productName:
              initialPurchase.description || 'شراء أولي - منتجات متنوعة',
            price: initialPurchase.amount,
            quantity: 1,
          },
        ],
        totalPrice: initialPurchase.amount,
      });
    }

    const customerData = {
      id: body.id,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      joinDate: body.joinDate || new Date().toISOString(),
      type: body.type || 'عادي',
      governorate: body.governorate || null,
      streetAddress: body.streetAddress || null,
      classification: body.classification || 'برونزي',
      points: extraPoints, // النقاط الإضافية
      totalPurchases: totalPurchases,
      lastPurchaseDate: totalPurchases > 0 ? new Date().toISOString() : null,
      hasBadReputation: false,
      source: body.source || 'Store',
      totalPointsEarned: extraPoints,
      totalPointsUsed: 0,
      purchaseCount: totalPurchases > 0 ? 1 : 0,
      log: [],
      impressions: [],
      primaryBranchId: body.primaryBranchId || null,
      lastModified: new Date().toISOString(),
    };

    const customer = await Customer.create(customerData);

    // ربط الفاتورة بالعميل بعد إنشائه
    if (initialInvoice) {
      initialInvoice.customer = customer._id;
      await initialInvoice.save();

      // إضافة إدخال في log العميل
      customer.log.push({
        invoiceId: initialInvoice.invoiceCode,
        date: new Date().toISOString(),
        details: initialPurchase.description || 'شراء أولي',
        amount: initialPurchase.amount,
      });
      await customer.save();
    }

    res.status(201).json({ data: customer });
  } catch (error) {
    // ... باقي الـ error handling زي ما هو
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
      return next(new ApiError(`No customer for this id ${id}`, 404));
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
exports.exportCustomersCSV = asyncHandler(async (req, res) => {
  const customers = await Customer.find({}).lean();

  const csvRows = [];

  csvRows.push(
    [
      'اسم العميل',
      'رقم الهاتف',
      'واتساب',
      'المحافظة',
      'العنوان',
      'رقم الفاتورة',
      'اسم المنتج',
      'سعر المنتج',
      'التاريخ',
      'كود الفرع',
    ].join(',')
  );

  for (const customer of customers) {
    if (!customer.log || customer.log.length === 0) {
      csvRows.push(
        [
          `"${customer.name || ''}"`,
          customer.phone || '',
          `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '') || ''}`,
          customer.governorate || '',
          customer.streetAddress || '',
          '',
          '',
          '',
          '',
          customer.primaryBranchId || '',
        ].join(',')
      );
      continue;
    }

    for (const logEntry of customer.log) {
      let productName = '';
      let productPrice = '';

      if (logEntry.invoiceId) {
        const fullInvoice = await Invoice.findOne({
          invoiceCode: logEntry.invoiceId,
        }).lean();

        if (
          fullInvoice &&
          fullInvoice.products &&
          fullInvoice.products.length > 0
        ) {
          for (const prod of fullInvoice.products) {
            csvRows.push(
              [
                `"${customer.name || ''}"`,
                customer.phone || '',
                `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '') || ''}`,
                customer.governorate || '',
                customer.streetAddress || '',
                logEntry.invoiceId || '',
                `"${prod.productName || ''}"`,
                prod.price || '',
                new Date(logEntry.date).toLocaleDateString('ar-EG'),
                customer.primaryBranchId || '',
              ].join(',')
            );
          }
          continue;
        }
      }

      // fallback
      csvRows.push(
        [
          `"${customer.name || ''}"`,
          customer.phone || '',
          `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '') || ''}`,
          customer.governorate || '',
          customer.streetAddress || '',
          logEntry.invoiceId || '',
          `"${logEntry.details || ''}"`,
          logEntry.amount || '',
          new Date(logEntry.date).toLocaleDateString('ar-EG'),
          customer.primaryBranchId || '',
        ].join(',')
      );
    }
  }

  const csvContent = csvRows.join('\n');

  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.attachment('عملاء_ومشترياتهم.csv');
  res.send('\uFEFF' + csvContent);
});
exports.importCustomersCSV = asyncHandler(async (req, res) => {
  const { data } = req.body;
  const results = {
    createdCustomers: 0,
    updatedCustomers: 0,
    createdInvoices: 0,
    errors: [],
  };

  for (const row of data) {
    try {
      // تحضير بيانات العميل
      const customerData = {
        id: row['كود العميل']?.trim() || null, // ← غير code إلى id
        name: row['اسم العميل']?.trim() || 'عميل بدون اسم',
        phone: row['رقم الهاتف']?.trim() || '',
        governorate: row['المحافظة']?.trim() || '',
        streetAddress: row['العنوان']?.trim() || '',
      };

      // البحث عن العميل (بالـ id أو التليفون أو الاسم + تليفون)
      let customer = await Customer.findOne({
        $or: [
          { id: customerData.id }, // ← id بدل code
          { phone: customerData.phone },
          { name: customerData.name, phone: customerData.phone },
        ].filter(Boolean),
      });

      if (!customer) {
        customer = new Customer(customerData);
        if (!customer.id) {
          customer.id = `CUST-${Date.now()}-${Math.floor(
            Math.random() * 10000
          )}`; // ← id
        }
        results.createdCustomers++;
      } else {
        // تحديث البيانات
        Object.assign(customer, customerData);
        results.updatedCustomers++;
      }

      await customer.save();

      // معالجة الفاتورة إذا موجودة
      if (row['رقم الفاتورة']) {
        const invoiceData = {
          invoiceNumber: row['رقم الفاتورة'].trim(),
          date: row['تاريخ الفاتورة']
            ? new Date(row['تاريخ الفاتورة'])
            : new Date(),
          totalAmount: parseFloat(row['المبلغ الإجمالي']) || 0,
          paidAmount: parseFloat(row['المدفوع']) || 0,
          remainingAmount: parseFloat(row['المتبقي']) || 0,
          customer: customer._id,
        };

        let invoice = await Invoice.findOne({
          invoiceNumber: invoiceData.invoiceNumber,
          customer: customer._id,
        });

        if (!invoice) {
          invoice = new Invoice(invoiceData);
          await invoice.save();
          results.createdInvoices++;
        }
      }
    } catch (err) {
      results.errors.push({
        row,
        error: err.message,
      });
    }
  }

  res.status(200).json({
    success: true,
    results,
  });
});
