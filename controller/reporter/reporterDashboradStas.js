const Adpost = require("../../models/advertismentPost/advertisementPost");
const reporterAdProof = require("../../models/reporterAdProof/reporterAdProof");
const User = require("../../models/userModel/userModel");

const getReporterAdCounts = async (req, res) => {
  try {
    const reporterId = req.user._id;

    // 1. Ensure reporter is verified
    const reporter = await User.findById(reporterId);
    if (!reporter || !reporter.verifiedReporter) {
      return res.status(403).json({
        success: false,
        message: "You are not a verified reporter. Please apply for your ID card first.",
      });
    }

    const { state: reporterState, city: reporterCity, pincode: reporterPincode } = reporter;

    // fetch only approved ads
    const allApprovedAds = await Adpost.find({ status: "approved" });

    const filteredPending = allApprovedAds.filter((ad) => {
  // skip if already full
  if (
    typeof ad.requiredReporter === "number" &&
    typeof ad.acceptReporterCount === "number" &&
    ad.acceptReporterCount >= ad.requiredReporter
  ) {
    return false;
  }

  // skip if already accepted/rejected
  const alreadyHandled = ad.acceptRejectReporterList?.some(
    (entry) => entry.reporterId?.toString() === reporterId.toString()
  );
  if (alreadyHandled) return false;

  // Priority 1: Reporter is explicitly selected
  if (Array.isArray(ad.reporterId) && ad.reporterId.includes(String(reporterId))) return true;

  // Priority 2: Admin selected state/city
  if (Array.isArray(ad.adminSelectState) && ad.adminSelectState.includes(reporterState)) return true;
  if (Array.isArray(ad.adminSelectCities) && ad.adminSelectCities.includes(reporterCity)) return true;

  // Priority 3: Send to all reporters
  if (ad.allStates === true) return true;

  // Priority 4: PF targeting
  if (ad.pfState === reporterState) {
    if (Array.isArray(ad.pfCities) && ad.pfCities.length > 0) {
      if (ad.pfCities.includes(reporterCity)) return true;
    } else {
      return true; // state-level PF match
    }
  }

  // Priority 5: Ad-level targeting
  if (ad.adState === reporterState) {
    if (Array.isArray(ad.adCities) && ad.adCities.length > 0) {
      if (ad.adCities.includes(reporterCity)) return true;
    } else {
      return true; // state-level ad match
    }
  }

  return false;
});


    const pendingCount = filteredPending.length;

    console.log("that is the pending ads for this particular reporter",pendingCount)

    // --- Other counts remain same ---

    const acceptedCount = await Adpost.countDocuments({
      acceptRejectReporterList: {
        $elemMatch: {
          reporterId: reporterId,
          accepted: true,
          adProof: false,
        },
      },
    });

    const rejectedCount = await Adpost.countDocuments({
      acceptRejectReporterList: {
        $elemMatch: {
          reporterId: reporterId,
          accepted: false,
        },
      },
    });

    const runningCount = await reporterAdProof.countDocuments({
      proofs: {
        $elemMatch: {
          reporterId: reporterId,
          status: "running",
        },
      },
    });

    const completedCount = await reporterAdProof.countDocuments({
      proofs: {
        $elemMatch: {
          reporterId: reporterId,
          status: "completed",
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Reporter ads count fetched successfully",
      data: {
        pending: pendingCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
        running: runningCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching reporter ad counts:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reporter ad counts",
    });
  }
};


module.exports = getReporterAdCounts;
