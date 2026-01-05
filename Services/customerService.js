// Services/customerService.js - النسخة النهائية المصححة 100%

const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Customer = require('../Models/customerModel');
const Invoice = require('../Models/invoiceModel');

// Get all customers
exports.getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find({}).lean();
  res.status(200).json({ results: customers.length, data: customers });
});

// Get single customer by custom id field
exports.getCustomerById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const customer = await Customer.findOne({ id: id });
  if (!customer) {
    return next(new ApiError(`No customer for this id ${id}`, 404));
  }
  res.status(200).json({ data: customer });
});

// Create new customer
exports.createCustomer = asyncHandler(async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (!body.id) {
      body.id = `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
    const { id } = req.params;
    const body = { ...req.body };
    delete body._id;
    delete body.id;
    body.lastModified = new Date().toISOString();

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

// Delete customer
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const customer = await Customer.findOneAndDelete({ id: id });
  if (!customer) {
    return next(new ApiError(`No customer for this id ${id}`, 404));
  }
  res.status(204).send();
});

// Export to CSV - مصحح ليعمل مع Excel بشكل مثالي
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
    const phoneText = customer.phone ? `="${customer.phone}"` : ''; // حماية من التحويل العلمي في Excel

    if (!customer.log || customer.log.length === 0) {
      csvRows.push(
        [
          `"${customer.name || ''}"`,
          phoneText,
          `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '') || ''}`,
          customer.governorate || '',
          customer.streetAddress || '',
          '',
          '',
          '0', // سعر 0 بدل فاضي
          '',
          customer.primaryBranchId || '',
        ].join(',')
      );
      continue;
    }

    for (const logEntry of customer.log) {
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
                phoneText,
                `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '') || ''}`,
                customer.governorate || '',
                customer.streetAddress || '',
                logEntry.invoiceId || '',
                `"${prod.productName || ''}"`,
                prod.price || '0',
                new Date(logEntry.date).toLocaleDateString('ar-EG'),
                customer.primaryBranchId || '',
              ].join(',')
            );
          }
          continue;
        }
      }

      // Fallback
      csvRows.push(
        [
          `"${customer.name || ''}"`,
          phoneText,
          `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '') || ''}`,
          customer.governorate || '',
          customer.streetAddress || '',
          logEntry.invoiceId || '',
          `"${logEntry.details || ''}"`,
          logEntry.amount || '0',
          new Date(logEntry.date).toLocaleDateString('ar-EG'),
          customer.primaryBranchId || '',
        ].join(',')
      );
    }
  }

  const csvContent = csvRows.join('\n');
  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.attachment('عملاء_ومشترياتهم.csv');
  res.send('\uFEFF' + csvContent); // BOM للعربي
});

// Import from CSV - النسخة النهائية المضمونة
exports.importCustomersCSV = asyncHandler(async (req, res) => {
  const { data } = req.body;
  const results = {
    createdCustomers: 0,
    updatedCustomers: 0,
    createdInvoices: 0,
    pointsUpdated: 0,
    errors: [],
  };

  for (const row of data) {
    try {
      // تخطي السطور الفارغة تمامًا
      if (!row['اسم العميل'] && !row['رقم الهاتف']) continue;

      // تنظيف رقم الهاتف من أي تحويل علمي أو روابط
      let phoneRaw = row['رقم الهاتف'] || '';
      let phone = phoneRaw.toString().trim();
      phone = phone.replace(/https?:\/\/wa\.me\//g, '').replace(/[^0-9]/g, '');

      const customerData = {
        name: (row['اسم العميل'] || '').trim() || 'عميل بدون اسم',
        phone: phone || '',
        governorate: (row['المحافظة'] || '').trim(),
        streetAddress: (row['العنوان'] || '').trim(),
        primaryBranchId: (row['كود الفرع'] || '').trim(),
      };

      // البحث عن العميل بالتليفون أولاً
      let customer = phone
        ? await Customer.findOne({ phone: customerData.phone })
        : null;

      // لو مش موجود، ابحث بالاسم + تليفون
      if (!customer) {
        customer = await Customer.findOne({
          name: customerData.name,
          phone: customerData.phone || { $exists: true },
        });
      }

      const isNew = !customer;
      if (isNew) {
        customer = new Customer(customerData);
        customer.id = `CUST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        results.createdCustomers++;
      } else {
        Object.assign(customer, customerData);
        results.updatedCustomers++;
      }

      // قراءة السعر من أي عمود ممكن
      const priceStr =
        row['سعر المنتج'] || row['المبلغ الإجمالي'] || row['المجموع'] || '0';
      const totalAmount = parseFloat(priceStr) || 0;

      if (totalAmount > 0 || row['رقم الفاتورة']) {
        const invoiceCode =
          (row['رقم الفاتورة'] || '').trim() ||
          `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // إنشاء فاتورة لو مش موجودة وفي مبلغ
        if (totalAmount > 0) {
          const existing = await Invoice.findOne({ invoiceCode });
          if (!existing) {
            await Invoice.create({
              invoiceCode,
              customer: customer._id,
              totalPrice: totalAmount,
              products: [
                {
                  productName: row['اسم المنتج'] || 'مشتريات من CSV',
                  price: totalAmount,
                  quantity: 1,
                },
              ],
            });
            results.createdInvoices++;
          }
        }

        // إضافة log لو مش موجود
        customer.log = customer.log || [];
        if (!customer.log.some((e) => e.invoiceId === invoiceCode)) {
          customer.log.push({
            invoiceId: invoiceCode,
            date: row['التاريخ'] || new Date().toISOString().split('T')[0],
            amount: totalAmount,
            details: row['اسم المنتج'] || 'مشتريات من CSV',
            pointsChange:
              totalAmount > 0 ? Math.floor(totalAmount / 2000) * 50 : 0,
            status: 'تم التسليم',
          });
        }

        // تحديث النقاط والإجماليات
        if (totalAmount > 0) {
          const earned = Math.floor(totalAmount / 2000) * 50;
          customer.totalPurchases =
            (customer.totalPurchases || 0) + totalAmount;
          customer.purchaseCount = (customer.purchaseCount || 0) + 1;
          customer.points = (customer.points || 0) + earned;
          customer.totalPointsEarned =
            (customer.totalPointsEarned || 0) + earned;
          customer.lastPurchaseDate = new Date();

          if (customer.totalPurchases >= 10000)
            customer.classification = 'ذهبي';
          else if (customer.totalPurchases >= 5000)
            customer.classification = 'فضي';
          else if (customer.totalPurchases >= 2000)
            customer.classification = 'برونزي';
          else customer.classification = 'غير محدد';

          results.pointsUpdated++;
        }
      }

      await customer.save();
    } catch (err) {
      results.errors.push({ row, error: err.message || 'خطأ غير معروف' });
    }
  }

  res.status(200).json({
    success: true,
    message: `تم الاستيراد بنجاح: ${results.createdCustomers} عميل جديد، ${results.updatedCustomers} محدث، ${results.createdInvoices} فاتورة، ${results.pointsUpdated} تحديث نقاط`,
    results,
  });
});
