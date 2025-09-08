const FreeAdProof = require("../../../models/adminModels/freeAds/freeAdProofSchema");

const getFreeCompletedAds = async (req, res) => {
  try {
    const reporterId = req.user._id;

    // ✅ Fetch only completed ads for this reporter
    const ads = await FreeAdProof.find({
      reporterId,
      status: "completed"
    }).populate("adId"); // Optional: populate ad details if needed

    if (!ads || ads.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No completed ads found"
      });
    }

    res.status(200).json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error("Error fetching completed ads:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = getFreeCompletedAds;
