
const Wallet = require("../../models/Wallet/walletSchema");
const WithdrawalRequest = require("../../models/WithdrawalRequest/withdrawalRequest");
const admins = require("../../models/adminModels/adminRegistration/adminSchema"); // Assuming super admin stored in User model
const sendEmail = require("../../utils/sendEmail");
const notifyOnWhatsapp = require("../../utils/notifyOnWhatsapp");
const Templates = require("../../utils/whatsappTemplates");



const reporterWithdrawal = async (req, res) => {
  const reporterId = req.user._id;
  const { amount, bankDetails } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ status: "invalid_amount", message: "Invalid withdrawal amount" });
  }

  try {
    const wallet = await Wallet.findOne({ userId: reporterId, userType: "Reporter" });

    if (!wallet) {
      return res.status(404).json({ status: "wallet_not_found", message: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        status: "insufficient_balance",
        message: "Withdrawal amount exceeds available wallet balance"
      });
    }

    // Deduct from wallet immediately
    wallet.balance -= amount;
    wallet.transactions.push({
      type: "debit",
      amount,
      description: "Withdrawal requested",
      status: "pending"
    });
    await wallet.save();

    // Save the withdrawal request
    const withdrawal = new WithdrawalRequest({
      reporterId,
      amount,
      bankDetails
    });

    await withdrawal.save();


    // ✅ Find all super admins
    const superAdmins = await admins.find({ role: "SuperAdmin" });

    // ✅ Send email notification to each super admin
    for (const admin of superAdmins) {
      await sendEmail(
        admin.email,
        "New Withdrawal Request",
        `
        <h2>New Withdrawal Request Submitted</h2>
        <p><strong>Reporter ID:</strong> ${reporterId}</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
        <p><strong>Bank Details:</strong> ${JSON.stringify(bankDetails)}</p>
        <p>Please review and process this request from the admin dashboard.</p>
        `
      );

      // 📱 WhatsApp notification
  if (admin.mobileNumber) {
    await notifyOnWhatsapp(
      admin.mobileNumber,
      Templates.NOTIFY_TO_ADMIN_WHEN_GET_NEW_WITHDRAWAL_REQUEST, // ✅ AiSensy template
      [
        admin.name,      // {{1}} -> admin name
        reporterId,      // {{2}} -> reporter ID
        String(amount),          // {{3}} -> withdrawal amount
        JSON.stringify(bankDetails) // {{4}} -> bank details
      ]
    );
  }
    }

    res.status(200).json({
      success: true,
      status: "request_submitted",
      message: "Withdrawal request submitted successfully"
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ status: "server_error", message: "Internal server error" });
  }
};

module.exports = reporterWithdrawal;
