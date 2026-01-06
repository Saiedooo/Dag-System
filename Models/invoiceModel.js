const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceCode: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: String, // <--- هنا التعديل المهم
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
      required: true,
      min: 0,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
