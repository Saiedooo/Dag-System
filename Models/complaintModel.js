const mongoose = require('mongoose');

/**
 * Complaint enums (Arabic values kept as primary).
 * We allow both Arabic enum values and their English keys (e.g. "Phone") for robustness.
 */
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

const normalizeEnum = (value, enumObj) => {
  if (value == null) return value;
  // if already one of the Arabic values, return it
  const values = Object.values(enumObj);
  if (values.includes(value)) return value;
  // if value equals an English key, map to Arabic
  if (enumObj[value]) return enumObj[value];
  // try case-insensitive match to English key
  const key = Object.keys(enumObj).find(
    (k) => k.toLowerCase() === String(value).toLowerCase()
  );
  if (key) return enumObj[key];
  // not recognized — return original (will fail enum validation)
  return value;
};

// sub-schema for log entries
const complaintLogEntrySchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    date: { type: String, required: true },
    action: { type: String, required: true },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, unique: true, index: true },
    customerId: { type: String, required: false },
    customerName: { type: String, required: false },
    customerEmail: { type: String, required: false },
    customerPhone: { type: String, required: false },

    // Accept either complaintText or description on create; description is required
    complaintText: { type: String },
    description: { type: String, required: true },

    dateOpened: { type: String, required: false },
    channel: {
      type: String,
      enum: [
        ...Object.values(ComplaintChannel),
        ...Object.keys(ComplaintChannel),
      ],
      default: ComplaintChannel.Phone,
      set: (v) => normalizeEnum(v, ComplaintChannel),
    },
    type: { type: String, required: true }, // complaint type (string from system settings)
    priority: {
      type: String,
      enum: [
        ...Object.values(ComplaintPriority),
        ...Object.keys(ComplaintPriority),
      ],
      default: ComplaintPriority.Normal,
      set: (v) => normalizeEnum(v, ComplaintPriority),
    },
    status: {
      type: String,
      enum: [
        ...Object.values(ComplaintStatus),
        ...Object.keys(ComplaintStatus),
      ],
      default: ComplaintStatus.Open,
      set: (v) => normalizeEnum(v, ComplaintStatus),
    },

    assignedTo: { type: String, default: null },
    resolutionNotes: { type: String, default: '' },
    dateClosed: { type: String, default: null },

    log: { type: [complaintLogEntrySchema], default: [] },

    productId: { type: String, default: null },
    productColor: { type: String, default: null },
    productSize: { type: String, default: null },
    attachments: { type: [String], default: [] },

    lastModified: { type: String },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Pre-validate: normalize incoming `customer` (object or id), map complaintText -> description
complaintSchema.pre('validate', function (next) {
  try {
    // Normalize `customer` -> `customerId` / `customerName`
    if (this.customer !== undefined) {
      if (!this.customerId && this.customer) {
        if (typeof this.customer === 'object') {
          // prefer common id fields
          const id =
            this.customer.id ?? this.customer._id ?? this.customer.customerId;
          const name = this.customer.name ?? this.customer.customerName;
          if (id) this.customerId = String(id);
          if (name && !this.customerName) this.customerName = String(name);
        } else {
          this.customerId = String(this.customer);
        }
      }
      // remove accidental customer payload to keep schema clean
      this.customer = undefined;
    }

    // Map complaintText -> description where appropriate
    if ((!this.description || this.description === '') && this.complaintText) {
      this.description = this.complaintText;
    }

    // Ensure description exists (schema also requires it; this message improves clarity)
    if (!this.description || String(this.description).trim() === '') {
      const err = new mongoose.Error.ValidationError(this);
      err.addError(
        'description',
        new mongoose.Error.ValidatorError({
          message: 'description is required',
        })
      );
      return next(err);
    }

    // Normalize enums (setters run on save; ensure we explicitly normalize here too)
    if (this.channel)
      this.channel = normalizeEnum(this.channel, ComplaintChannel);
    if (this.priority)
      this.priority = normalizeEnum(this.priority, ComplaintPriority);
    if (this.status) this.status = normalizeEnum(this.status, ComplaintStatus);

    return next();
  } catch (e) {
    return next(e);
  }
});

// Pre-save: set complaintId if missing (use timestamp+random to avoid race)
complaintSchema.pre('save', async function () {
  if (!this.complaintId) {
    // timestamp + short random suffix
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.complaintId = `COMP-${Date.now()}-${suffix}`;
  }
  this.lastModified = new Date().toISOString();
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = {
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintChannel,
};
