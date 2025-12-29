const express = require('express');
const fs = require('fs');
const path = require('path');
const ensureDbConnection = require('../middleware/dbConnectionMiddleware');
const Customer = require('../Models/customerModel');
const User = require('../Models/UserModel');

const router = express.Router();

// Ensure database connection before handling state requests
router.use(ensureDbConnection);

// Path to JSON fallback file (optional)
const DB_PATH = path.join(__dirname, '..', 'db.json');

// GET /api/data - جلب كل البيانات من MongoDB
router.get('/', async (req, res) => {
  try {
    console.log('=== FETCHING DATA FROM MONGODB ===');

    // جلب البيانات من MongoDB
    let customers = [];
    let users = [];
    // يمكن إضافة products, branches, etc. إذا كانت موجودة

    try {
      customers = await Customer.find().lean();
      console.log(`✅ Fetched ${customers.length} customers from MongoDB`);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }

    // جرب تجيب باقي البيانات من MongoDB
    try {
      if (User) {
        users = await User.find().lean();
        console.log(`✅ Fetched ${users.length} users from MongoDB`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }

    // جلب البيانات من ملف JSON (إن وجدت) للبيانات اللي مش موجودة في MongoDB
    let fileData = {};
    if (fs.existsSync(DB_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf8');
        if (fileContent) {
          fileData = JSON.parse(fileContent);
        }
      } catch (fileError) {
        console.error('Error reading JSON file:', fileError);
      }
    }

    // Format customers to match frontend expectations
    const formattedCustomers = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      joinDate: customer.joinDate || null,
      type: customer.type || null,
      governorate: customer.governorate || null,
      streetAddress: customer.streetAddress || null,
      classification: customer.classification || null,
      points: customer.points || 0,
      totalPurchases: customer.totalPurchases || 0,
      lastPurchaseDate: customer.lastPurchaseDate || null,
      hasBadReputation: customer.hasBadReputation || false,
      source: customer.source || null,
      totalPointsEarned: customer.totalPointsEarned || 0,
      totalPointsUsed: customer.totalPointsUsed || 0,
      purchaseCount: customer.purchaseCount || 0,
      log: customer.log || [],
      impressions: customer.impressions || [],
      primaryBranchId: customer.primaryBranchId || null,
      lastModified:
        customer.lastModified || customer.updatedAt?.toISOString() || null,
    }));

    // دمج البيانات: استخدم MongoDB أولاً، ثم ملف JSON كـ fallback
    const mergedData = {
      // من MongoDB
      customers:
        formattedCustomers.length > 0
          ? formattedCustomers
          : fileData.customers || [],
      users: users.length > 0 ? users : fileData.users || [],
      products: fileData.products || [],
      branches: fileData.branches || [],

      // من ملف JSON (للبيانات اللي مش موجودة في MongoDB)
      complaints: fileData.complaints || [], // Complaints تأتي من API منفصل
      dailyInquiries: fileData.dailyInquiries || [],
      followUpTasks: fileData.followUpTasks || [],
      dailyFeedbackTasks: fileData.dailyFeedbackTasks || [],
      systemSettings: fileData.systemSettings || {},
      theme: fileData.theme || {},
      activityLog: fileData.activityLog || [],
    };

    console.log('✅ Returning merged data:', {
      customers: mergedData.customers.length,
      users: mergedData.users.length,
      products: mergedData.products?.length || 0,
      branches: mergedData.branches?.length || 0,
    });

    res.status(200).json(mergedData);
  } catch (err) {
    console.error('❌ Error in GET /api/data:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error reading data',
    });
  }
});

// POST /api/data - حفظ البيانات (يمكن حفظها في MongoDB أو ملف JSON)
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    console.log('=== SAVING DATA ===');

    // حفظ العملاء في MongoDB
    if (data.customers && Array.isArray(data.customers)) {
      try {
        for (const customerData of data.customers) {
          // استخدم updateOne مع upsert عشان يحدث أو ينشئ
          await Customer.updateOne(
            { id: customerData.id },
            { $set: customerData },
            { upsert: true }
          );
        }
        console.log(`✅ Saved ${data.customers.length} customers to MongoDB`);
      } catch (error) {
        console.error('Error saving customers to MongoDB:', error);
      }
    }

    // حفظ باقي البيانات في ملف JSON (للبيانات اللي مش موجودة في MongoDB)
    if (fs.existsSync(DB_PATH) || data.customers) {
      try {
        // اقرأ البيانات الحالية
        let existingData = {};
        try {
          if (fs.existsSync(DB_PATH)) {
            const fileContent = fs.readFileSync(DB_PATH, 'utf8');
            if (fileContent) {
              existingData = JSON.parse(fileContent);
            }
          }
        } catch (fileError) {
          // File doesn't exist or is empty, start fresh
        }

        // دمج البيانات الجديدة مع الموجودة
        const mergedData = {
          ...existingData,
          // لا تحفظ customers في JSON لأنها في MongoDB
          users: data.users || existingData.users || [],
          products: data.products || existingData.products || [],
          branches: data.branches || existingData.branches || [],
          complaints: data.complaints || existingData.complaints || [],
          dailyInquiries:
            data.dailyInquiries || existingData.dailyInquiries || [],
          followUpTasks: data.followUpTasks || existingData.followUpTasks || [],
          dailyFeedbackTasks:
            data.dailyFeedbackTasks || existingData.dailyFeedbackTasks || [],
          systemSettings:
            data.systemSettings || existingData.systemSettings || {},
          theme: data.theme || existingData.theme || {},
          activityLog: data.activityLog || existingData.activityLog || [],
        };

        // احفظ في ملف JSON
        fs.writeFileSync(DB_PATH, JSON.stringify(mergedData, null, 2));
        console.log('✅ Saved data to JSON file');
      } catch (fileError) {
        console.error('Error saving to JSON file:', fileError);
      }
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('❌ Error in POST /api/data:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error saving data',
    });
  }
});

module.exports = router;
