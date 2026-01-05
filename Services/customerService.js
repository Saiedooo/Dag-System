// Services/customerService.js (النسخة الصحيحة الكاملة بعد التصليح)

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
    delete body.id; // لا يسمح بتغيير الـ id المخصص
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

// Export to CSV
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

      // Fallback
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

// Import from CSV - النسخة المصححة بالكامل
exports.importCustomersCSV = asyncHandler(async (req, res) => {
  const { data } = req.body; // data هو array من الـ rows
  const results = {
    createdCustomers: 0,
    updatedCustomers: 0,
    createdInvoices: 0,
    pointsUpdated: 0,
    errors: [],
  };

  for (const row of data) {
    try {
      // 1. تحضير بيانات العميل الأساسية
      const customerData = {
        name: (row['اسم العميل'] || row['الاسم'] || 'عميل بدون اسم').trim(),
        phone: (
          row['رقم الهاتف'] ||
          row['تليفون'] ||
          row['موبايل'] ||
          ''
        ).trim(),
        governorate: (row['المحافظة'] || '').trim(),
        streetAddress: (row['العنوان'] || '').trim(),
      };

      // 2. البحث عن العميل
      let customer = await Customer.findOne({
        $or: [
          customerData.phone ? { phone: customerData.phone } : null,
          {
            name: customerData.name,
            phone: customerData.phone || { $exists: true },
          },
        ].filter(Boolean),
      });

      const isNewCustomer = !customer;
      if (isNewCustomer) {
        customer = new Customer(customerData);
        customer.id = `CUST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        results.createdCustomers++;
      } else {
        Object.assign(customer, customerData);
        results.updatedCustomers++;
      }

      let addedPurchaseAmount = 0;

      // 3. معالجة الفاتورة إذا وجد مبلغ أو رقم فاتورة
      if (row['رقم الفاتورة'] || row['المبلغ الإجمالي']) {
        const totalAmount = parseFloat(row['المبلغ الإجمالي']) || 0;
        if (totalAmount > 0) {
          addedPurchaseAmount = totalAmount;

          // تحديد كود الفاتورة الصحيح (invoiceCode)
          const invoiceCode = (
            row['رقم الفاتورة'] ||
            `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          ).trim();

          // بيانات الفاتورة الصحيحة حسب الـ schema
          const invoiceData = {
            invoiceCode,
            customer: customer._id,
            totalPrice: totalAmount,
            products: [
              {
                productName: row['اسم المنتج'] || 'مشتريات من استيراد CSV',
                price: totalAmount,
                quantity: 1,
              },
            ],
          };

          // التحقق من وجود الفاتورة مسبقاً (بالـ invoiceCode فقط، لأنه unique)
          const existingInvoice = await Invoice.findOne({ invoiceCode });

          let currentInvoice;
          if (!existingInvoice) {
            currentInvoice = await Invoice.create(invoiceData);
            results.createdInvoices++;
          } else {
            currentInvoice = existingInvoice;
          }

          // === الأهم: إضافة entry في log العميل ===
          customer.log = customer.log || [];
          const logExists = customer.log.some(
            (entry) => entry.invoiceId === invoiceCode
          );
          if (!logExists) {
            customer.log.push({
              invoiceId: invoiceCode,
              date: row['تاريخ الفاتورة']
                ? new Date(row['تاريخ الفاتورة']).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              amount: totalAmount,
              details: row['اسم المنتج'] || 'مشتريات من استيراد CSV',
              pointsChange: Math.floor(totalAmount / 2000) * 50,
              status: 'تم التسليم', // يمكنك تغييره حسب الحاجة
            });
          }
        }
      }

      // 4. تحديث النقاط والإجماليات فقط إذا كان في مشتريات جديدة
      if (addedPurchaseAmount > 0) {
        const earnedPoints = Math.floor(addedPurchaseAmount / 2000) * 50;

        customer.totalPurchases =
          (customer.totalPurchases || 0) + addedPurchaseAmount;
        customer.purchaseCount = (customer.purchaseCount || 0) + 1;
        customer.points = (customer.points || 0) + earnedPoints;
        customer.totalPointsEarned =
          (customer.totalPointsEarned || 0) + earnedPoints;
        customer.lastPurchaseDate = new Date();

        // تحديث التصنيف
        if (customer.totalPurchases >= 10000) {
          customer.classification = 'ذهبي';
        } else if (customer.totalPurchases >= 5000) {
          customer.classification = 'فضي';
        } else if (customer.totalPurchases >= 2000) {
          customer.classification = 'برونزي';
        } else {
          customer.classification = 'غير محدد';
        }

        results.pointsUpdated++;
      }

      await customer.save();
    } catch (err) {
      results.errors.push({
        row,
        error: err.message || 'خطأ غير معروف',
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `تم الاستيراد بنجاح: ${results.createdCustomers} عميل جديد، ${results.createdInvoices} فاتورة جديدة، ${results.pointsUpdated} عميل تم تحديث نقاطه والـ log`,
    results,
  });
});
