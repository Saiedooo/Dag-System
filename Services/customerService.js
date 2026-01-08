const mongoose = require('mongoose');
const Customer = require('../Models/customerModel');

// ========== HELPER FUNCTION ==========
const findCustomerById = async (id) => {
  console.log('🔍 Searching for customer with ID:', id);

  // Check if id is a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    // Search by _id
    return await Customer.findById(id);
  } else {
    // Search by custom id field
    return await Customer.findOne({ id: id });
  }
};

// ========== SERVICE FUNCTIONS ==========

// GET ALL CUSTOMERS
exports.getAllCustomers = async (req, res) => {
  try {
    console.log('=== GET ALL CUSTOMERS ===');

    const customers = await Customer.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customers',
    });
  }
};

// GET CUSTOMER BY ID
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== GET CUSTOMER BY ID ===');
    console.log('Requested ID:', id);

    const customer = await findCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customer',
    });
  }
};

// CREATE CUSTOMER
exports.createCustomer = async (req, res) => {
  try {
    const data = { ...req.body };
    console.log('=== CREATE CUSTOMER ===');

    // Validate required fields
    if (!data.name || !data.phone || !data.governorate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone, governorate',
      });
    }

    // Generate custom ID if not provided
    if (!data.id) {
      const count = await Customer.countDocuments();
      data.id = `CUST-${(count + 1).toString().padStart(4, '0')}`;
    }

    // Set join date
    if (!data.joinDate) {
      data.joinDate = new Date().toISOString();
    }

    const customer = new Customer(data);
    await customer.save();

    console.log('✅ Customer created:', customer.id);

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating customer',
    });
  }
};

// UPDATE CUSTOMER
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    console.log('=== UPDATE CUSTOMER ===');
    console.log('ID to update:', id);
    console.log('Update data:', data);

    const customer = await findCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Update fields
    Object.keys(data).forEach((key) => {
      if (key !== 'id' && key !== '_id' && data[key] !== undefined) {
        customer[key] = data[key];
      }
    });

    customer.lastModified = new Date().toISOString();
    await customer.save();

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating customer',
    });
  }
};

// DELETE CUSTOMER - الدالة المهمة!
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== DELETE CUSTOMER ===');
    console.log('ID to delete:', id);

    // البحث عن العميل
    const customer = await findCustomerById(id);

    if (!customer) {
      console.log('❌ Customer not found');
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    console.log('✅ Customer found:', {
      _id: customer._id,
      id: customer.id,
      name: customer.name,
    });

    // الحذف من قاعدة البيانات
    await Customer.findByIdAndDelete(customer._id);

    console.log('✅ Customer deleted successfully');

    // إرجاع رد ناجح
    res.status(200).json({
      success: true,
      message: 'تم حذف العميل بنجاح',
      data: {
        id: customer.id,
        name: customer.name,
      },
    });
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting customer',
    });
  }
};

// تصدير CSV
exports.exportCustomersCSV = async (req, res) => {
  try {
    const customers = await Customer.find();
    // ... logic to generate CSV
    res.status(200).json({ success: true, data: 'CSV data' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// استيراد CSV
exports.importCustomersCSV = async (req, res) => {
  try {
    const { data } = req.body;
    // ... logic to import CSV
    res.status(200).json({ success: true, message: 'CSV imported' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
