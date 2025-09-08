const freeAdModel = require("../../../models/adminModels/freeAds/freeAdsSchema");
const User = require("../../../models/userModel/userModel");

const getFreeAds = async (req, res) => {
  try {
    const reporterId = req.user._id;

    // Step 1: Fetch reporter info
    const reporter = await User.findById(reporterId);
    if (!reporter) {
      return res.status(404).json({
        success: false,
        message: "Reporter not found",
      });
    }

    // Step 2: Check verification
    if (!reporter.verifiedReporter) {
      return res.status(403).json({
        success: false,
        message: "You are not a verified reporter. Please apply for your ID card first.",
      });
    }

    const { state: reporterState, city: reporterCity } = req.user;

    // Step 3: Fetch all approved free ads
    const allFreeAds = await freeAdModel.find({ status: "approved" });

    // Step 4: Filter ads
    const filteredFreeAds = allFreeAds.filter(ad => {
      // ✅ Skip if reporter already accepted this ad
      const alreadyAccepted = ad.acceptedReporters?.some(
        r => r.reporterId.toString() === reporterId.toString()
      );
      if (alreadyAccepted) return false;

      // ✅ Show if ad is for all states
      if (ad.allState === true) return true;

      // ✅ Show if reporter is specifically selected
      if (
        Array.isArray(ad.selectedReporters) &&
        ad.selectedReporters.some(id => id.toString() === reporterId.toString())
      ) {
        return true;
      }

      // ✅ Show if location (state/city) matches
      if (
        (Array.isArray(ad.state) && ad.state.includes(reporterState)) ||
        (Array.isArray(ad.city) && ad.city.includes(reporterCity))
      ) {
        return true;
      }

      return false;
    });

    res.status(200).json({
      success: true,
      message: "Filtered free ads fetched successfully",
      data: filteredFreeAds,
    });

  } catch (error) {
    console.error("Error fetching filtered free ads for reporter:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching free ads",
    });
  }
};

module.exports = getFreeAds;
