// Models/dailyFeedbackTaskModel.js
const mongoose = require('mongoose');

const dailyFeedbackTaskSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true }, // CUST-xxx
    customerName: { type: String, required: true },
    invoiceId: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
    branchId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyFeedbackTask', dailyFeedbackTaskSchema);
