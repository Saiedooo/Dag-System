const mongoose = require('mongoose');

// Enums (زي ما هما)
const ComplaintStatus = {
  Open: 'مفتوحة',
  InProgress: 'قيد المراجعة',
  PendingCustomer: 'في انتظار رد العميل',
  Resolved: 'تم الحل',
  Escalated: 'مُصعَّدة',
};

const ComplaintPriority = {
  Normal: 'عادية',
  Medium: 'متوسطة',
  Urgent: 'عاجلة',
};

const ComplaintChannel = {
  Facebook: 'فيسبوك',
  WhatsApp: 'واتساب',
  Phone: 'هاتف',
  Email: 'بريد إلكتروني',
  Website: 'الموقع الإلكتروني',
};

const complaintLogEntrySchema = new mongoose.Schema(
  {
    user: String,
    date: String,
    action: String,
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, unique: true },
    customerId: { type: String },
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    complaintText: { type: String },
    dateOpened: { type: String },
    channel: { type: String, enum: Object.values(ComplaintChannel) },
    type: { type: String },
    priority: { type: String, enum: Object.values(ComplaintPriority) },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.Open,
    },
    description: { type: String },
    assignedTo: { type: String },
    resolutionNotes: { type: String, default: '' },
    dateClosed: { type: String, default: null },
    log: { type: [complaintLogEntrySchema], default: [] },
    productId: String,
    productColor: String,
    productSize: String,
    attachments: { type: [String], default: [] },
    lastModified: String,
  },
  {
    timestamps: true,
    strict: true,
  }
);

// 1. pre('validate') - لازم نستخدم next
complaintSchema.pre('validate', function (next) {
  if (this.customer !== undefined) {
    if (!this.customerId && this.customer) {
      this.customerId = String(this.customer);
    }
    delete this.customer;
  }

  if (this.complaintText && !this.description) {
    this.description = this.complaintText;
  }

  next(); // مهم جدًا
});

// 2. pre('save') لتوليد complaintId - لازم نستخدم next
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const count = await this.constructor.countDocuments();
    this.complaintId = `COMP-${Date.now()}-${count + 1}`;
  }
  this.lastModified = new Date().toISOString();
  next(); // مهم جدًا
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = {
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintChannel,
};
