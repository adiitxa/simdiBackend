// bill.js
const mongoose = require('mongoose');

const BillItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },

  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },

  dealerName: { type: String, default: 'N/A' },

  // NEW FIELDS for calculations & audit
  itemAmount: { type: Number, required: true },        // qty * rate
  commissionPercent: { type: Number, required: true }, // commission % used
  commissionAmount: { type: Number, required: true },  // itemAmount * commission%
  lineTotal: { type: Number, required: true }          // itemAmount + commissionAmount

}, { _id: false });

const BillSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  billDate: { type: Date, required: true, default: Date.now },

  items: { type: [BillItemSchema], required: true },

  totalAmount: { type: Number, required: true },
  totalCommission: { type: Number, default: 0 },

  discountPercent: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('Bill', BillSchema);
