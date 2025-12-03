const mongoose = require('mongoose');

// Order Status Enum
const OrderStatus = {
  Processing: 'قيد التجهيز',
  Shipped: 'تم الشحن',
  Delivered: 'تم التسليم',
  Cancelled: 'ملغي',
};

// Customer Types
const CustomerType = {
  Normal: 'عادي',
  Corporate: 'شركة',
};

// Customer Classification
const CustomerClassification = {
  Bronze: 'برونزي',
  Silver: 'فضي',
  Gold: 'ذهبي',
  Platinum: 'بلاتيني',
};

// Discovery Channel
const DiscoveryChannel = {
  Facebook: 'فيسبوك',
  WhatsApp: 'واتساب',
  Instagram: 'انستاجرام',
  TikTok: 'تيكتوك',
  NearHome: 'قريب من البيت',
  Friends: 'من الأصدقاء',
  Other: 'أخرى',
};

const customerLogEntrySchema = new mongoose.Schema(
  {
    invoiceId: String,
    date: String,
    details: String,
    status: {
      type: String,
      enum: Object.values(OrderStatus),
    },
    feedback: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    pointsChange: Number,
    amount: Number,
  },
  { _id: false }
);

const customerImpressionSchema = new mongoose.Schema(
  {
    id: String,
    date: String,
    recordedByUserId: String,
    recordedByUserName: String,
    productQualityRating: Number,
    productQualityNotes: String,
    branchExperienceRating: Number,
    branchExperienceNotes: String,
    discoveryChannel: {
      type: String,
      enum: Object.values(DiscoveryChannel),
    },
    isFirstVisit: Boolean,
    relatedInvoiceIds: [String],
    branchId: String,
    visitTime: String,
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: String,
    joinDate: String,
    type: {
      type: String,
      enum: Object.values(CustomerType),
    },
    governorate: String,
    streetAddress: String,
    classification: {
      type: String,
      enum: Object.values(CustomerClassification),
    },
    points: {
      type: Number,
      default: 0,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    lastPurchaseDate: {
      type: String,
      default: null,
    },
    hasBadReputation: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ['Facebook', 'Website', 'Store'],
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
    },
    totalPointsUsed: {
      type: Number,
      default: 0,
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },
    log: {
      type: [customerLogEntrySchema],
      default: [],
    },
    impressions: {
      type: [customerImpressionSchema],
      default: [],
    },
    primaryBranchId: String,
    lastModified: String,
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Auto-update lastModified
customerSchema.pre('save', async function () {
  this.lastModified = new Date().toISOString();
});

module.exports = mongoose.model('Customer', customerSchema);
module.exports.CustomerType = CustomerType;
module.exports.CustomerClassification = CustomerClassification;
module.exports.OrderStatus = OrderStatus;
module.exports.DiscoveryChannel = DiscoveryChannel;
