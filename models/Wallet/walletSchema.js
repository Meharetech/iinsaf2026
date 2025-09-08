const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userType: { type: String, enum: ["Advertiser", "Reporter"], required: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String, enum: ["credit", "debit"], required: true },
      amount: Number,
      description: String,
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ["success", "pending", "failed"], default: "success" }
    }
  ]
});

module.exports = mongoose.model("Wallet", walletSchema);
