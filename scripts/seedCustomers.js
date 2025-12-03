const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('../Models/customerModel');
const {
  OrderStatus,
  CustomerType,
  CustomerClassification,
  DiscoveryChannel,
} = require('../Models/customerModel');

dotenv.config();

// Sample log data for customers
const customer1Log = [
  {
    invoiceId: 'INV-1001',
    date: '2024-05-15T10:00:00Z',
    details: 'منتج أ - أسود - L - 3 قطع',
    status: OrderStatus.Delivered,
    feedback: 5,
    pointsChange: 150,
    amount: 15000,
  },
  {
    invoiceId: 'INV-1002',
    date: '2024-04-20T14:30:00Z',
    details: 'منتج ب - أبيض - M - 2 قطع',
    status: OrderStatus.Delivered,
    feedback: 4,
    pointsChange: 100,
    amount: 10000,
  },
];

const customer1Impressions = [
  {
    id: 'IMP-001',
    date: '2024-05-15T10:00:00Z',
    recordedByUserId: 'user-1',
    recordedByUserName: 'أحمد محمد',
    productQualityRating: 5,
    productQualityNotes: 'جودة ممتازة',
    branchExperienceRating: 5,
    branchExperienceNotes: 'خدمة رائعة',
    discoveryChannel: DiscoveryChannel.Facebook, // Using enum value
    isFirstVisit: false,
    relatedInvoiceIds: ['INV-1001'],
    branchId: 'branch-1',
    visitTime: '10:00',
  },
];

const customer3Log = [
  {
    invoiceId: 'INV-1015',
    date: '2024-04-28T09:00:00Z',
    details: 'منتج ج - أزرق - S - 1 قطعة',
    status: OrderStatus.Delivered,
    feedback: 4,
    pointsChange: 250,
    amount: 2500,
  },
];

const customers = [
  {
    id: 'CUST-0001',
    name: 'شركة النور',
    phone: '0501234567',
    email: 'contact@alnoor.com',
    joinDate: '2023-01-15',
    type: CustomerType.Corporate,
    governorate: 'الرياض',
    streetAddress: 'طريق الملك فهد',
    classification: CustomerClassification.Gold,
    points: 1250,
    totalPointsEarned: 1500,
    totalPointsUsed: 250,
    totalPurchases: 15000,
    purchaseCount: 2,
    lastPurchaseDate: '2024-05-15T10:00:00Z',
    hasBadReputation: false,
    source: 'Website',
    primaryBranchId: 'branch-1',
    log: customer1Log,
    impressions: customer1Impressions,
    lastModified: new Date().toISOString(),
  },
  {
    id: 'CUST-0002',
    name: 'مؤسسة الأمل',
    phone: '0557654321',
    email: 'info@alamal.org',
    joinDate: '2023-03-22',
    type: CustomerType.Corporate,
    governorate: 'جدة',
    streetAddress: undefined,
    classification: CustomerClassification.Silver,
    points: 780,
    totalPointsEarned: 850,
    totalPointsUsed: 70,
    totalPurchases: 8500,
    purchaseCount: 1,
    lastPurchaseDate: '2024-05-10T14:20:00Z',
    hasBadReputation: true,
    source: 'Website',
    primaryBranchId: 'branch-2',
    log: [
      {
        invoiceId: 'INV-1020',
        date: '2024-05-10T14:20:00Z',
        details: 'منتج د - أسود - XL - 5 قطع',
        status: OrderStatus.Cancelled,
        feedback: null,
        pointsChange: 0,
        amount: 8500,
      },
    ],
    impressions: [],
    lastModified: new Date().toISOString(),
  },
  {
    id: 'CUST-0003',
    name: 'محمد عبد الله',
    phone: '0512345678',
    email: 'mohammed.a@email.com',
    joinDate: '2023-05-10',
    type: CustomerType.Normal,
    governorate: 'الدمام',
    streetAddress: 'شارع الأمير محمد',
    classification: CustomerClassification.Bronze,
    points: 320,
    totalPointsEarned: 320,
    totalPointsUsed: 0,
    totalPurchases: 2500,
    purchaseCount: 1,
    lastPurchaseDate: '2024-04-28T09:00:00Z',
    hasBadReputation: false,
    source: 'Facebook',
    primaryBranchId: 'branch-1',
    log: customer3Log,
    impressions: [],
    lastModified: new Date().toISOString(),
  },
  {
    id: 'CUST-0004',
    name: 'سارة إبراهيم',
    phone: '0598765432',
    email: 'sara.i@email.com',
    joinDate: '2023-08-01',
    type: CustomerType.Normal,
    governorate: 'الرياض',
    streetAddress: undefined,
    classification: CustomerClassification.Bronze,
    points: 150,
    totalPointsEarned: 150,
    totalPointsUsed: 0,
    totalPurchases: 1200,
    purchaseCount: 1,
    lastPurchaseDate: '2024-05-20T18:45:00Z',
    hasBadReputation: false,
    source: 'Facebook',
    log: [
      {
        invoiceId: 'INV-1025',
        date: '2024-05-20T18:45:00Z',
        details: 'منتج أ - وردي - M - 1 قطعة',
        status: OrderStatus.Shipped,
        feedback: null,
        pointsChange: 120,
        amount: 1200,
      },
    ],
    impressions: [],
    lastModified: new Date().toISOString(),
  },
];

const seedCustomers = async () => {
  try {
    // Connect to database
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) {
      console.error('Missing DB_URL in environment');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(dbUrl, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log('✅ Database Connected');

    // Clear existing customers (optional - remove if you want to keep existing data)
    // await Customer.deleteMany({});
    // console.log('Cleared existing customers');

    // Check if customers already exist
    const existingCustomers = await Customer.find({
      id: { $in: customers.map((c) => c.id) },
    });

    if (existingCustomers.length > 0) {
      console.log(
        `Found ${existingCustomers.length} existing customers. Updating them...`
      );
      for (const customerData of customers) {
        const existing = existingCustomers.find((c) => c.id === customerData.id);
        if (existing) {
          // Remove undefined fields
          const cleanData = Object.fromEntries(
            Object.entries(customerData).filter(([_, v]) => v !== undefined)
          );
          await Customer.findOneAndUpdate({ id: customerData.id }, cleanData, {
            new: true,
            runValidators: true,
          });
          console.log(`Updated customer: ${customerData.id} - ${customerData.name}`);
        } else {
          // Remove undefined fields before creating
          const cleanData = Object.fromEntries(
            Object.entries(customerData).filter(([_, v]) => v !== undefined)
          );
          await Customer.create(cleanData);
          console.log(`Created customer: ${customerData.id} - ${customerData.name}`);
        }
      }
    } else {
      // Create new customers
      for (const customerData of customers) {
        // Remove undefined fields before creating
        const cleanData = Object.fromEntries(
          Object.entries(customerData).filter(([_, v]) => v !== undefined)
        );
        await Customer.create(cleanData);
        console.log(`Created customer: ${customerData.id} - ${customerData.name}`);
      }
    }

    console.log(`\n✅ Successfully seeded ${customers.length} customers!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding customers:', error);
    process.exit(1);
  }
};

seedCustomers();

