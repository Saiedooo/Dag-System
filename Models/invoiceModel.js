const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceCode: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: String, // custom id مثل CUST-123456
      required: true,
    },
    products: [
      {
        productName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        customerReview: { type: String },
        rating: { type: Number, min: 1, max: 5 },
      },
    ],
    totalPrice: {
      type: Number,
      required: true, // لسه required، بس دلوقتي بنقبل 0 في الـ controller
      min: 0, // أضفنا min: 0 عشان يقبل الصفر رسميًا
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
