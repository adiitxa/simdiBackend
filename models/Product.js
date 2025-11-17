// product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0 },
  rate: { type: Number, required: true },

  // NEW FIELD → Default 3% commission
  commissionPercent: { type: Number, default: 3 },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
