const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    employeeId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dealer", dealerSchema);
