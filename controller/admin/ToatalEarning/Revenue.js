const paymentHistory = require('../../../models/paymentHistory/paymentHistory');
const User = require('../../../models/userModel/userModel');

const WithdrawalRequest = require("../../../models/WithdrawalRequest/withdrawalRequest");

// Get all-time payment history
const getAllPayments = async (req, res) => {
  try {
    // Fetch all payments (you can filter by user if needed)
    const payments = await paymentHistory.find()
      .populate("user", "name email role") // show advertiser info
      .sort({ createdAt: -1 });

    // Calculate total earnings
    const totalEarnings = payments.reduce((acc, p) => acc + p.amount, 0);

    res.status(200).json({
      success: true,
      message: "All payments fetched successfully",
      data: {
        totalEarnings,
        totalPayments: payments.length,
        payments
      }
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


const adminGetReportersWithdrawlHistory = async (req, res) => {
  try {
    // ✅ Fetch only approved withdrawals
    const withdrawals = await WithdrawalRequest.find({ status: "approved" })
      .populate("reporterId", "name email mobile") // show reporter info
      .sort({ createdAt: -1 });

    // ✅ Calculate total withdrawn amount
    const totalWithdrawn = withdrawals.reduce((acc, w) => acc + w.amount, 0);

    res.status(200).json({
      success: true,
      message: "Approved withdrawal history fetched successfully",
      data: {
        totalWithdrawn,
        totalRequests: withdrawals.length,
        withdrawals
      }
    });
  } catch (error) {
    console.error("Error fetching withdrawal history:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = { getAllPayments ,adminGetReportersWithdrawlHistory};
