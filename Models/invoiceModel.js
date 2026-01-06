const invoiceSchema = new mongoose.Schema(
  {
    invoiceCode: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: String,        // ←←←← String مش ObjectId
      required: true,
    },
    products: [ ... ],     // زي ما هو
    totalPrice: {
      type: Number,
      required: true,
      min: 0,              // عشان يقبل 0
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);