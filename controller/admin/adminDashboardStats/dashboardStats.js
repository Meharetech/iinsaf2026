const User = require("../../../models/userModel/userModel"); // adjust path if needed
const freeAdModel = require('../../../models/adminModels/freeAds/freeAdsSchema');
const FreeAdProof = require("../../../models/adminModels/freeAds/freeAdProofSchema");
const ryvUser = require("../../../models/userModel/RaiseYourVoiceModel/raiseYourVoiceUsers")


// Controller function
const dashboardStats = async (req, res) => {
  try {
    // Count only verified users by role
    const advertiserCount = await User.countDocuments({ role: "Advertiser", isVerified: true });
    const reporterCount = await User.countDocuments({ role: "Reporter", isVerified: true });
    const influencerCount = await User.countDocuments({ role: "Influencer", isVerified: true });

    // Send response
    res.status(200).json({
      success: true,
      message: "Verified user role statistics fetched successfully",
      data: {
        advertisers: advertiserCount,
        reporters: reporterCount,
        influencers: influencerCount,
        totalUsers: advertiserCount + reporterCount + influencerCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
};






const ryvUserStats = async (req, res) => {
  try {
    // Count all users
    const totalUsers = await ryvUser.countDocuments();

    res.status(200).json({
      success: true,
      message: "Raise Your Voice user statistics fetched successfully",
      data: {
        totalUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching Raise Your Voice user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching Raise Your Voice user statistics",
      error: error.message,
    });
  }
};



const getFreeAdsStats = async (req, res) => {
  try {
    const ads = await freeAdModel.find();

    let pendingCount = 0;
    let acceptedCount = 0;
    let runningCount = 0;
    let completedCount = 0;

    for (let ad of ads) {
      const totalRequired = ad.requiredReportersCount || 0;
      const acceptedReporters = ad.acceptedReporters || [];

      // ✅ Fetch proofs for this ad
      const proofs = await FreeAdProof.find({ adId: ad._id });
      const hasSubmittedProofs = proofs.some((p) => p.status === "submitted");

      // 🟥 Pending Ads → status approved only
      if (ad.status === "approved") {
        pendingCount++;
        continue;
      }

      // 🟧 Accepted Ads → reporters accepted but no proofs yet
      const hasAccepted = acceptedReporters.some((r) => r.postStatus === "accepted");
      if (hasAccepted && proofs.length === 0 && ad.status !== "completed") {
        acceptedCount++;
        continue;
      }

      // 🟦 Running Ads → proofs uploaded & status = submitted
      if (hasSubmittedProofs && ad.status !== "completed") {
        runningCount++;
        continue;
      }

      // 🟩 Completed Ads → only ads with status completed
      if (ad.status === "completed") {
        completedCount++;
        continue;
      }
    }

    res.status(200).json({
      success: true,
      message: "Free ads statistics fetched successfully",
      data: {
        pending: pendingCount,
        accepted: acceptedCount,
        running: runningCount,
        completed: completedCount,
        total: pendingCount + acceptedCount + runningCount + completedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching free ads stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};





module.exports = { dashboardStats,ryvUserStats, getFreeAdsStats};
