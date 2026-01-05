const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceCode: {
      type: String,
      required: true,
      unique: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer', // صح كده
      required: true,
    },
    products: [
      {
        productName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        customerReview: { type: String }, // تقييم العميل للمنتج
        rating: { type: Number, min: 1, max: 5 }, // تقييم رقمي
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
