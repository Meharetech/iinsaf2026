const RaiseYourVoice = require("../../../models/raiseYourVoicePost/ryvPostSchema");
const RaiseYourVoiceProof = require("../../../models/raiseYourVoicePost/raiseYourVoiceProofSubmit");
const mongoose = require("mongoose");
const sendEmail = require("../../../utils/sendEmail");
const notifyOnWhatsapp = require("../../../utils/notifyOnWhatsapp")
const Templates = require("../../../utils/whatsappTemplates")


const getUnderReviewRyvAds = async (req, res) => {
  try {
    const ads = await RaiseYourVoice.find({ status: "under review" }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, count: ads.length, data: ads });
  } catch (error) {
    console.error("Error fetching under review ads:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const approveRyvAd = async (req, res) => {
  try {
    const { adId } = req.params;

    const updatedAd = await RaiseYourVoice.findOneAndUpdate(
      { _id: adId, status: "under review" },
      {
        $set: {
          status: "approved",
          rejectionNote: "",
          approvedAt: new Date(),
        },
        expireAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      }, // 5 days later auto delete this post
      { new: true }
    );

    if (!updatedAd) {
      return res
        .status(404)
        .json({ success: false, message: "Ad not found or already reviewed" });
    }

    // 🔹 Send notification to post creator
    await sendEmail({
      to: updatedAd.email,
      subject: "Your Raise Your Voice Post Has Been Approved ✅",
      text: `Hello ${updatedAd.name},\n\nYour Raise Your Voice post has been approved successfully.\n\nDescription: ${updatedAd.description}\n\nThank you for raising your voice!`,
    });

    // 📱 WhatsApp notification to post creator
    if (updatedAd.phoneNo) {
      await notifyOnWhatsapp(
        updatedAd.phoneNo,
        Templates.NOTIFY_TO_USER_AFTER_APPROVE_RYV_AD, // 👈 WhatsApp template name
        [
          updatedAd.name, // {{1}} -> User name
          updatedAd.description, // {{2}} -> Post description
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Ad approved successfully",
      data: updatedAd,
    });
  } catch (error) {
    console.error("Error approving ad:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const rejectRyvAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const { rejectionNote } = req.body;

    const updatedAd = await RaiseYourVoice.findOneAndUpdate(
      { _id: adId, status: "under review" },
      { $set: { status: "rejected", rejectionNote: rejectionNote || "" } },
      { new: true }
    );

    if (!updatedAd) {
      return res
        .status(404)
        .json({ success: false, message: "Ad not found or already reviewed" });
    }

    // 📧 Email notification to post creator
    await sendEmail({
      to: updatedAd.email,
      subject: "Your Raise Your Voice Post Has Been Rejected ❌",
      text: `Hello ${
        updatedAd.name
      },\n\nUnfortunately, your Raise Your Voice post has been rejected.\n\nReason: ${
        updatedAd.rejectionNote || "No reason provided."
      }\n\nDescription: ${
        updatedAd.description
      }\n\nYou can create another one post.\n\nThank you for understanding.`,
    });

    // 📱 WhatsApp notification to post creator
    if (updatedAd.phoneNo) {
      await notifyOnWhatsapp(
        updatedAd.phoneNo,
        Templates.NOTIFY_TO_USER_AFTER_REJECTED_RYV_AD, // 👈 WhatsApp template name
        [
          updatedAd.name, // {{1}} -> User name
          updatedAd.rejectionNote || "No reason provided.", // {{2}} -> Rejection reason
          updatedAd.description, // {{3}} -> Post description
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Ad rejected successfully",
      data: updatedAd,
    });
  } catch (error) {
    console.error("Error rejecting ad:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getApprovedRyvAds = async (req, res) => {
  try {
    const ads = await RaiseYourVoice.find({ status: "approved" }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, count: ads.length, data: ads });
  } catch (error) {
    console.error("Error fetching approved ads:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getRunningRyvAds = async (req, res) => {
  try {
    const runningProofs = await RaiseYourVoiceProof.find({
      status: "running",
      proof: true,
    });
    res.status(200).json({
      success: true,
      count: runningProofs.length,
      data: runningProofs,
    });
  } catch (error) {
    console.error("Error fetching running ads:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Admin accepts the proof
const adminAcceptTheProof = async (req, res) => {
  try {
    const { adId, reporterId } = req.params;

    console.log(
      "Admin is accepting proof for Ad ID:",
      adId,
      "and Reporter ID:",
      reporterId
    );

    // validate IDs first
    if (
      !mongoose.Types.ObjectId.isValid(adId) ||
      !mongoose.Types.ObjectId.isValid(reporterId)
    ) {
      // console.log("❌ Invalid ObjectId(s)");
      return res
        .status(400)
        .json({ success: false, message: "Invalid adId or reporterId" });
    }

    // const proof = await RaiseYourVoiceProof.findOne({
    //   adId: new mongoose.Types.ObjectId(adId),
    //   reporterId: new mongoose.Types.ObjectId(reporterId),
    // });

    const proof = await RaiseYourVoiceProof.findOne({
      adId: new mongoose.Types.ObjectId(adId),
      reporterId: new mongoose.Types.ObjectId(reporterId),
    }).populate("reporterId", "name email mobile"); // ✅ ensure name/email/mobile available

    // console.log("Query executed. Proof result:", proof);

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: "Proof not found for this reporter and ad",
      });
    }

    if (proof.status !== "running" || proof.proof !== true) {
      // console.log("❌ Proof not in running state or proof flag is false");
      return res.status(400).json({
        success: false,
        message: "Proof is not in running state or not submitted properly",
      });
    }

    proof.status = "completed";
    proof.reviewedAt = new Date();
    await proof.save();

    // console.log("✅ Proof status updated to completed:", proof);

    // 🔹 Notify Reporter
    if (proof.reporterId?.email) {
      await sendEmail({
        to: proof.reporterId.email,
        subject: "Your Proof Has Been Accepted ✅",
        text: `Hello ${proof.reporterId.name},\n\nGood news! Your submitted proof for Ad ID: ${adId} has been accepted by the admin.\n\nThank you for your work!`,
      });
    }

    // 📱 WhatsApp Notification
    if (proof?.reporterId?.mobile) {
      await notifyOnWhatsapp(
        proof.reporterId.mobile,
        Templates.NOTIFY_TO_REPORTER_AFTER_APPROVE_RYV_AD_PROOF, // 👈 Template name
        [
          proof.reporterId.name, // {{1}} -> Reporter name
          adId, // {{2}} -> Ad ID
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Proof accepted successfully",
      data: proof,
    });
  } catch (error) {
    console.error("🔥 Error in adminAcceptTheProof:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while accepting proof" });
  }
};

// ✅ Admin rejects the proof
const adminRejectTheProof = async (req, res) => {
  try {
    let { proofId } = req.params;
    const { rejectionNote } = req.body;

    // Force string in case proofId is accidentally an object
    if (typeof proofId !== "string") {
      proofId = proofId.toString();
    }

    console.log("Rejecting Proof with ID:", proofId);
    console.log("Rejection Note:", rejectionNote);

    const updatedProof = await RaiseYourVoiceProof.findByIdAndUpdate(
      proofId,
      {
        $set: {
          status: "rejected",
          rejectionNote: rejectionNote,
        },
      },
      { new: true }
    );

    if (!updatedProof) {
      return res.status(404).json({
        success: false,
        message: "Proof not found",
      });
    }

    if (updatedProof.reporterId?.email) {
      // 📧 Email Notification
      await sendEmail({
        to: updatedProof.reporterId.email,
        subject: "Your Proof Has Been Rejected ❌",
        text: `Hello ${
          updatedProof.reporterId.name
        },\n\nUnfortunately, your submitted proof for Ad ID: ${
          updatedProof.adId
        } has been rejected.\n\nReason: ${
          rejectionNote || "No reason provided"
        }.\n\nPlease review and try again.`,
      });
    }

    // 📱 WhatsApp Notification
    if (updatedProof.reporterId?.mobile) {
      await notifyOnWhatsapp(
        updatedProof.reporterId.mobile,
        Templates.NOTIFY_TO_REPORTER_AFTER_REJECT_RYV_AD_PROOF, // 👈 WhatsApp template name
        [
          updatedProof.reporterId.name, // {{1}} -> Reporter name
          updatedProof.adId, // {{2}} -> Ad ID
          rejectionNote || "No reason provided", // {{3}} -> Rejection reason
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "Proof rejected successfully",
      proof: updatedProof,
    });
  } catch (error) {
    console.error("Error rejecting proof:", error);
    res.status(500).json({
      success: false,
      message: "Server error while rejecting proof",
      error: error.message,
    });
  }
};

const adminGetRejectedProofs = async (req, res) => {
  try {
    // const { adId } = req.params;

    // 1. Get all proofs of this ad where status = rejected
    const proofs = await RaiseYourVoiceProof.find({
      status: "rejected",
    })
      .populate("reporterId", "name email mobile") // optional: get reporter info
      .sort({ createdAt: -1 });

    if (!proofs || proofs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No rejected proofs found",
      });
    }

    res.status(200).json({
      success: true,
      count: proofs.length,
      data: proofs,
    });
  } catch (error) {
    console.error("Error fetching rejected proofs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching rejected proofs",
    });
  }
};

const getRyvAdsStatsForAdmin = async (req, res) => {
  try {
    // 1. Count directly from RaiseYourVoice (ads collection)
    const adStats = await RaiseYourVoice.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // 2. Count running and completed from RaiseYourVoiceProof
    const proofStats = await RaiseYourVoiceProof.aggregate([
      { $match: { proof: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Initialize stats
    const stats = {
      underReview: 0,
      approved: 0,
      rejected: 0,
      running: 0,
      completed: 0,
    };

    // Fill stats from ads
    adStats.forEach((item) => {
      if (item._id === "under review") stats.underReview = item.count;
      if (item._id === "approved") stats.approved = item.count;
      if (item._id === "rejected") stats.rejected = item.count;
    });

    // Fill stats from proofs
    proofStats.forEach((item) => {
      if (item._id === "running") stats.running = item.count;
      if (item._id === "completed") stats.completed = item.count;
      if (item._id === "rejected") stats.rejected = item.count;
    });

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching RaiseYourVoice stats for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching stats",
    });
  }
};

module.exports = {
  getUnderReviewRyvAds,
  approveRyvAd,
  rejectRyvAd,
  getRunningRyvAds,
  getApprovedRyvAds,
  adminAcceptTheProof,
  adminRejectTheProof,
  adminGetRejectedProofs,
  getRyvAdsStatsForAdmin,
};
