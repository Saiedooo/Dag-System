// Models/dailyFeedbackModel.js
const mongoose = require('mongoose');

const dailyFeedbackSchema = new mongoose.Schema(
  {
    customer: {
      type: String, // custom id زي CUST-123456
      required: [true, 'معرف العميل مطلوب'],
    },
    productQualityRating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'تقييم جودة المنتج مطلوب'],
    },
    productQualityNotes: {
      type: String,
      trim: true,
    },
    branchExperienceRating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'تقييم تجربة الفرع مطلوب'],
    },
    branchExperienceNotes: {
      type: String,
      trim: true,
    },
    discoveryChannel: {
      type: String,
      enum: [
        'فيسبوك',
        'واتساب',
        'انستاجرام',
        'تيكتوك',
        'قريب من البيت',
        'من الأصدقاء',
        'أخرى',
      ],
    },
    isFirstVisit: {
      type: Boolean,
      default: false,
    },
    relatedInvoiceIds: [
      {
        type: String, // كود الفاتورة زي INV-... أو WELCOME-...
      },
    ],
    branchId: {
      type: String,
      required: [true, 'كود الفرع مطلوب'],
    },
    visitTime: {
      type: String, // مثال: "الصبح", "الظهر", "بالليل"
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual لجلب بيانات العميل كاملة
dailyFeedbackSchema.virtual('customerData', {
  ref: 'Customer',
  localField: 'customer',
  foreignField: 'id',
  justOne: true,
});

module.exports = mongoose.model('DailyFeedback', dailyFeedbackSchema);
