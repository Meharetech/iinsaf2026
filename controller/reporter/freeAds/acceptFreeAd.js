const freeAdModel = require("../../../models/adminModels/freeAds/freeAdsSchema");

const acceptFreeAd = async (req, res) => {
  try {
    const reporterId = req.user._id;
    const adId = req.params.adId;

    if (!adId) {
      return res
        .status(400)
        .json({ success: false, message: "Ad ID is required" });
    }

    const ad = await freeAdModel.findById(adId);
    if (!ad) {
      return res
        .status(404)
        .json({ success: false, message: "Free ad not found" });
    }

    // ✅ Check if already accepted
    const alreadyAccepted = ad.acceptedReporters.some(
      (r) => r.reporterId.toString() === reporterId.toString()
    );
    if (alreadyAccepted) {
      return res.status(400).json({
        success: false,
        message: "You have already accepted this free ad",
      });
    }

    // ✅ Add to acceptedReporters
    ad.acceptedReporters.push({
      reporterId,
      postStatus: "accepted",
      acceptedAt: new Date(),
    });

    // ✅ If all selectedReporters have accepted, update ad status to 'running'
    const totalSelected = ad.selectedReporters?.length || 0;
    const totalAccepted = ad.acceptedReporters?.length || 0;

    if (totalSelected > 0 && totalAccepted === totalSelected) {
      ad.status = "running"; // ✅ not "accepted"
    }

    await ad.save();

    return res.status(200).json({
      success: true,
      message: "Free ad accepted successfully",
      data: ad,
    });
  } catch (error) {
    console.error("Error in acceptFreeAd:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while accepting free ad",
    });
  }
};

module.exports = acceptFreeAd;
