const mongoose = require('mongoose');

const dailyInquirySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    productInquiry: {
      type: String,
      required: true,
    },
    customerGovernorate: {
      type: String,
      required: true,
    },
    lastModified: String,
  },
  {
    timestamps: true,
    strict: true,
  }
);

dailyInquirySchema.pre('save', function (next) {
  this.lastModified = new Date().toISOString();
  next();
});

module.exports = mongoose.model('DailyInquiry', dailyInquirySchema);


