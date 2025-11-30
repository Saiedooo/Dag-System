const mongoose = require('mongoose');

// Complaint Status Enum
const ComplaintStatus = {
  Open: 'مفتوحة',
  InProgress: 'قيد المراجعة',
  PendingCustomer: 'في انتظار رد العميل',
  Resolved: 'تم الحل',
  Escalated: 'مُصعَّدة',
};

// Complaint Priority Enum
const ComplaintPriority = {
  Normal: 'عادية',
  Medium: 'متوسطة',
  Urgent: 'عاجلة',
};

// Complaint Channel Enum
const ComplaintChannel = {
  Facebook: 'فيسبوك',
  WhatsApp: 'واتساب',
  Phone: 'هاتف',
  Email: 'بريد إلكتروني',
  Website: 'الموقع الإلكتروني',
};

// Complaint Log Entry Schema
const complaintLogEntrySchema = new mongoose.Schema(
  {
    user: {
      type: String,
      // required: true,
    },
    date: {
      type: String,
      // required: true,
    },
    action: {
      type: String,
      // required: true,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      // required: true,
    },
    customerId: {
      type: String,
      // required: true,
    },
    customerName: {
      type: String,
      // required: true,
    },
    dateOpened: {
      type: String,
      // required: true,
    },
    channel: {
      type: String,
      enum: Object.values(ComplaintChannel),
      // required: true,
    },
    type: {
      type: String,
      // required: true,
    },
    priority: {
      type: String,
      enum: Object.values(ComplaintPriority),
      // required: true,
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.Open,
      //  required: true,
    },
    description: {
      type: String,
      // required: true,
    },
    assignedTo: {
      type: String,
      //  required: false,
    },
    resolutionNotes: {
      type: String,
      default: '',
      // required: true,
    },
    dateClosed: {
      type: String,
      default: null,
    },
    log: {
      type: [complaintLogEntrySchema],
      default: [],
    },
    productId: {
      type: String,
      //required: false,
    },
    productColor: {
      type: String,
      //required: false,
    },
    productSize: {
      type: String,
      //required: false,
    },
    attachments: {
      type: [String], // Array of base64 strings
      default: [],
    },
    lastModified: {
      type: String,
      //  required: true,
    },
  },
  { timestamps: true }
);

// Generate complaintId before saving if not provided
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    // Generate a unique complaintId (you can customize this logic)
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintId = `COMP-${Date.now()}-${count + 1}`;
  }
  next();
});

// Update lastModified on save
complaintSchema.pre('save', function (next) {
  this.lastModified = new Date().toISOString();
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
module.exports.ComplaintStatus = ComplaintStatus;
module.exports.ComplaintPriority = ComplaintPriority;
module.exports.ComplaintChannel = ComplaintChannel;
