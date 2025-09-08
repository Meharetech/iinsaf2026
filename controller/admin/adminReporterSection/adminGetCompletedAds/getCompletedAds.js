const reporterAdProof = require("../../../../models/reporterAdProof/reporterAdProof");
const Wallet = require("../../../../models/Wallet/walletSchema");
const Adpost = require("../../../../models/advertismentPost/advertisementPost");
const sendEmail = require("../../../../utils/sendEmail");
const User = require("../../../../models/userModel/userModel");
const notifyOnWhatsapp = require("../../../../utils/notifyOnWhatsapp");
const Templates = require("../../../../utils/whatsappTemplates");

const getCompletedAds = async (req, res) => {
  try {
    const completedAds = await reporterAdProof.find({
      proofs: {
        $elemMatch: {
          status: "completed",
          task: "pending",
        },
      },
    });

    // Filter only relevant proofs in each document
    const filteredAds = completedAds.map((ad) => {
      const matchingProofs = ad.proofs.filter(
        (proof) => proof.status === "completed" && proof.task === "pending"
      );

      return {
        ...ad._doc, // spread original ad data
        proofs: matchingProofs, // overwrite proofs with filtered
      };
    });

    res.status(200).json({
      success: true,
      message: "Filtered completed ads fetched successfully",
      data: filteredAds,
    });
  } catch (error) {
    console.error("Error in getCompletedAds:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching completed ads",
    });
  }
};

const adminApproveAdsProof = async (req, res) => {
  const { adId, reporterId } = req.body;

  try {
    // 1. Update the proof (task + status)
    const updated = await reporterAdProof.findOneAndUpdate(
      { adId, "proofs.reporterId": reporterId },
      {
        $set: {
          "proofs.$[elem].task": "completed",
          "proofs.$[elem].status": "completed",
        },
      },
      {
        new: true,
        arrayFilters: [{ "elem.reporterId": reporterId }],
      }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Proof not found for this ad and reporter" });
    }

    // 2. Count how many proofs are fully completed
    const completedProofsCount = updated.proofs.filter(
      (proof) => proof.status === "completed" && proof.task === "completed"
    ).length;

    // 3. If all required reporters have completed, mark ad as completed
    let adCompleted = false;
    if (completedProofsCount >= updated.requiredReporter) {
      updated.runningAdStatus = "completed";
      await updated.save();

      // 👉 Also update Adpost document
      await Adpost.findOneAndUpdate(
        { _id: adId, status: "running" },
        { $set: { status: "completed" } }
      );

      adCompleted = true;
    }

    // 4. Get the current reporter's proof
    const proof = updated.proofs.find(
      (p) => p.reporterId.toString() === reporterId
    );
    const paymentAmount = updated.finalReporterPrice;

    if (!paymentAmount || paymentAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid or missing payment amount" });
    }

    // 5. Wallet logic
    let wallet = await Wallet.findOne({
      userId: reporterId,
      userType: "Reporter",
    });
    if (!wallet) {
      wallet = new Wallet({
        userId: reporterId,
        userType: "Reporter",
        balance: 0,
      });
    }

    wallet.balance += paymentAmount;
    wallet.transactions.push({
      type: "credit",
      amount: paymentAmount,
      description: `Payment for ad work: ${adId}`,
    });

    await wallet.save();

    //  1. Notify reporter
    const reporter = await User.findById(reporterId);
    console.log("that is my reporter that upload the proof",reporter);
    if (reporter) {
      await sendEmail(
        reporter.email,
        "Proof Approved",
        `Hi ${reporter.name},\n\nYour proof for Ad ID: ${adId} has been approved. 
        You have received ₹${paymentAmount} in your wallet.\n\nRegards,\nAdmin`
      );

      // 📱 WhatsApp notification
      if (reporter.mobile) {
        await notifyOnWhatsapp(
          reporter.mobile,
          Templates.ADMIN_APPROVE_PROOF_UPLOADED_NOTIFY_TO_REPORTER, // "admin_approve_proof_uploaded_notify_to_reporter"
          [
            reporter.name, // {{1}} -> reporter name
            adId, // {{2}} -> ad ID
            String(paymentAmount),     // {{3}} -> credited amount (must be string ✅)
          ]
        );
      }
    }

    //  2. Notify advertiser if ad is completed
    if (adCompleted) {
      const ad = await Adpost.findById(adId).populate("owner");
      if (ad && ad.owner) {
        await sendEmail(
          ad.owner.email,
          "Ad Completed",
          `Hi ${ad.owner.name},\n\nYour advertisement (Ad ID: ${adId}) has been successfully completed.\n\nRegards,\nAdmin`
        );

        // 📱 WhatsApp notification
        if (ad.owner.mobile) {
          await notifyOnWhatsapp(
            ad.owner.mobile,
            Templates.NOTIFY_TO_ADVERTISER_AFTER_AD_COMPLETED, // "notify_to_advertiser_after_ad_completed"
            [
              ad.owner.name, // {{1}} -> advertiser name
              adId, // {{2}} -> ad ID
            ]
          );
        }
      }
    }

    // 6. Respond
    res.json({
      success: true,
      message: "Task approved and payment credited to reporter wallet",
      updatedProof: proof,
      walletBalance: wallet.balance,
      runningAdStatus: updated.runningAdStatus,
    });
  } catch (err) {
    console.error("Admin approval error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

async function adminRejectAdsProof(req, res) {
  const { adId, reporterId, rejectNote } = req.body;

  try {
    const updated = await reporterAdProof.findOneAndUpdate(
      {
        adId,
        "proofs.reporterId": reporterId,
      },
      {
        $set: {
          "proofs.$.task": "pending",
          "proofs.$.status": "running",
          "proofs.$.rejectNote": rejectNote || "", // ✅ Save note
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Ad or proof not found" });
    }

    // Get reporter details (for email)
    const reporter = await User.findById(reporterId);
    if (reporter) {
      await sendEmail(
        reporter.email,
        "Your Proof Has Been Rejected ❌",
        `Hello ${
          reporter.name
        },\n\nYour proof for Ad ID: ${adId} has been rejected by the Admin.\nReason: ${
          rejectNote || "No reason provided"
        }.\n\nPlease resubmit the proof.\n\nRegards,\nTeam`
      );

      // 📱 WhatsApp notification
      if (reporter.mobile) {
        await notifyOnWhatsapp(
          reporter.mobile,
          Templates.ADMIN_REJECT_PROOF_UPLOADED_NOTIFY_TO_REPORTER, // "admin_reject_proof_uploaded_notify_to_reporter"
          [
            reporter.name, // {{1}} -> reporter name
            adId, // {{2}} -> ad ID
            rejectNote || "No reason provided", // {{3}} -> rejection reason
          ]
        );
      }
    }

    res.json({ message: "Task rejected with note", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

const getFinalCompletedAds = async (req, res) => {
  try {
    // Step 1: Find documents where at least one proof is completed for both status and task
    const completedAds = await reporterAdProof.find({
      proofs: {
        $elemMatch: {
          status: "completed",
          task: "completed",
        },
      },
    });

    // Step 2: For each matching ad, filter only the proofs with both status and task completed
    const filteredAds = completedAds.map((ad) => {
      const matchingProofs = ad.proofs.filter(
        (proof) => proof.status === "completed" && proof.task === "completed"
      );

      return {
        ...ad._doc, // keep original ad fields
        proofs: matchingProofs, // replace with only completed proofs
      };
    });

    res.status(200).json({
      success: true,
      message: "Completed ads fetched successfully",
      data: filteredAds,
    });
  } catch (error) {
    console.error("Error in getCompletedAds:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching completed ads",
    });
  }
};

module.exports = {
  getCompletedAds,
  adminApproveAdsProof,
  adminRejectAdsProof,
  getFinalCompletedAds,
};
