const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // الموديريتر اللي أنشأ الشكوى
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
    },
    productName: {
      type: String,
    },
    color: {
      type: String,
    },
    size: {
      type: String,
    },
    howuFoundIt: {
      type: String,
    },
    image: {
      type: String, // مسار الصورة المخزنة
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice', // لو الشكوى متعلقة بفاتورة
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
