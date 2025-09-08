const freeAdModel = require("../../../../models/adminModels/freeAds/freeAdsSchema");
const FreeAdProof = require("../../../../models/adminModels/freeAds/freeAdProofSchema");
const User = require("../../../../models/userModel/userModel")
const sendEmail = require("../../../../utils/sendEmail")
const notifyOnWhatsapp = require("../../../../utils/notifyOnWhatsapp")
const Templates = require("../../../../utils/whatsappTemplates")


const proofAccept = async (req, res) => {
  try {
    const { adId, reporterId } = req.body;

    if (!adId || !reporterId) {
      return res
        .status(400)
        .json({ success: false, message: "adId and reporterId are required" });
    }

    // 1️⃣ Update proof status from "submitted" → "completed"
    const updatedProof = await FreeAdProof.findOneAndUpdate(
      { adId, reporterId, status: "submitted" },
      { status: "completed" },
      { new: true }
    );

    if (!updatedProof) {
      return res.status(404).json({
        success: false,
        message: "Proof not found or already processed",
      });
    }

    // 2️⃣ Update the reporter's postStatus in the ad's acceptedReporters array
    await freeAdModel.updateOne(
      { _id: adId, "acceptedReporters.reporterId": reporterId },
      {
        $set: {
          "acceptedReporters.$.postStatus": "completed",
          "acceptedReporters.$.completedAt": new Date(),
        },
      }
    );

    // 3️⃣ Find the ad to check if all reporters have completed proof
    const ad = await freeAdModel.findById(adId);
    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    const requiredReporters = ad.requiredReportersCount || 0;

    // 4️⃣ Count how many reporters have completed proof
    const completedProofsCount = await FreeAdProof.countDocuments({
      adId,
      status: "completed",
    });

    // 5️⃣ If all required reporters completed proof → change ad status
    if (completedProofsCount >= requiredReporters) {
      ad.status = "completed";
      await ad.save();
    }

    //  Send email + WhatsApp notification to reporter
    const reporter = await User.findById(reporterId);

    if (reporter) {
      // 📧 Email Notification
      if (reporter.email) {
        await sendEmail(
          reporter.email,
          "Proof Accepted",
          `Hello ${reporter.name},\n\nYour submitted proof for the Mandatory ad "${ad.description}" has been accepted by the admin.\n\nThank you for your work!\n\nRegards,\nTeam`
        );
      }

      // 📱 WhatsApp Notification
      if (reporter.mobile) {
        await notifyOnWhatsapp(
          reporter.mobile,
          Templates.NOTIFY_TO_REPORTER_AFTER_ACCEPTED_FREE_AD_PROOF, // ✅ AiSensy template
          [
            reporter.name, // {{1}} -> reporter name
            ad.description, // {{2}} -> ad description
          ]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Proof accepted successfully",
      adStatus: ad.status,
    });
  } catch (error) {
    console.error("Error accepting proof:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const proofReject = async (req, res) => {
  try {
    const { adId, reporterId, rejectNote } = req.body;

    if (!adId || !reporterId || !rejectNote) {
      return res.status(400).json({
        success: false,
        message: "adId, reporterId and rejectNote are required",
      });
    }

    // 1️⃣ Update UploadProof schema (submitted -> accepted)
    const proof = await FreeAdProof.findOneAndUpdate(
      { adId, reporterId, status: "submitted" },
      {
        status: "rejected",
        adminRejectNote: rejectNote,
      },
      { new: true }
    );

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: "No proof found or proof is not in submitted state",
      });
    }

    // 2️⃣ Update freeAdModel acceptedReporters[].postStatus (submitted -> accepted)
    await freeAdModel.updateOne(
      { _id: adId, "acceptedReporters.reporterId": reporterId },
      {
        $set: {
          "acceptedReporters.$.postStatus": "accepted",
          "acceptedReporters.$.adProof": false,
        },
      }
    );

    //  Send email + WhatsApp notification to reporter
    const reporter = await User.findById(reporterId);

    if (reporter) {
      // 📧 Email Notification
      if (reporter.email) {
        await sendEmail(
          reporter.email,
          "Proof Rejected",
          `Hello ${
            reporter.name
          },\n\nYour submitted proof for the Mandatory ad "${
            proof.adId
          }" has been rejected by the admin.\n\nReason: ${
            rejectNote || "Not specified"
          }\n\nPlease review and resubmit your proof.\n\nRegards,\nIINSAF Team`
        );
      }

      // 📱 WhatsApp Notification
      if (reporter.mobile) {
        await notifyOnWhatsapp(
          reporter.mobile,
          Templates.NOTIFY_TO_REPORTER_AFTER_REJECTED_FREE_AD_PROOF, // ✅ AiSensy template
          [
            reporter.name, // {{1}} -> reporter name
            proof.adId, // {{2}} -> ad id
            rejectNote || "Not specified", // {{3}} -> rejection reason
          ]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Proof rejected successfully, status updated to accepted",
      data: proof,
    });
  } catch (error) {
    console.error("Error in proofReject:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { proofAccept, proofReject };
