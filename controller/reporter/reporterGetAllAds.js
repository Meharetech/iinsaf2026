// const Adpost = require("../../models/advertismentPost/advertisementPost");
// const User = require("../../models/userModel/userModel");

// const reporterGetAllAds = async (req, res) => {
//   try {
//     const reporterId = req.user._id;

//     // Step 1: Fetch reporter info
//     const reporter = await User.findById(reporterId);
//     if (!reporter) {
//       return res.status(404).json({
//         success: false,
//         message: "Reporter not found",
//       });
//     }

//     // Step 2: Check verification
//     if (!reporter.verifiedReporter) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not a verified reporter. Please apply for your ID card first.",
//       });
//     }

//     const { state: reporterState, city: reporterCity, pincode: reporterPincode } = req.user;

//     // Step 3: Fetch all approved ads
//     const allApprovedAds = await Adpost.find({ status: 'approved' });

//     // Step 4: Filter ads
//     const filteredAds = allApprovedAds.filter(ad => {
//       //  Skip if ad is already fulfilled
//       if (
//         typeof ad.requiredReporter === "number" &&
//         typeof ad.acceptReporterCount === "number" &&
//         ad.acceptReporterCount >= ad.requiredReporter
//       ) {
//         return false;
//       }

//       //  Skip if reporter already handled the ad
//       const alreadyHandled = ad.acceptRejectReporterList?.some(entry =>
//         entry.reporterId?.toString() === reporterId.toString()
//       );
//       if (alreadyHandled) return false;

//       //  Matching logic
//       if (ad.allStates === true) return true;
//       if (Array.isArray(ad.reporterId) && ad.reporterId.includes(String(reporterId))) return true;
//       if (ad.adminSelectPincode === reporterPincode) return true;
//       if (Array.isArray(ad.adminSelectCities) && ad.adminSelectCities.includes(reporterCity)) return true;
//       if (Array.isArray(ad.adminSelectState) && ad.adminSelectState.includes(reporterState)) return true;
//       if (
//         ad.adState === reporterState ||
//         ad.adCity === reporterCity ||
//         ad.pincode === reporterPincode
//       ) {
//         return true;
//       }

//       return false;
//     });

//     res.status(200).json({
//       success: true,
//       message: "Filtered ads fetched successfully",
//       data: filteredAds
//     });

//   } catch (error) {
//     console.error("Error fetching filtered ads for reporter:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching ads"
//     });
//   }
// };

// module.exports = reporterGetAllAds;

const Adpost = require("../../models/advertismentPost/advertisementPost");
const User = require("../../models/userModel/userModel");

const reporterGetAllAds = async (req, res) => {
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

    // Step 2: Ensure reporter is verified
    if (!reporter.verifiedReporter) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a verified reporter. Please apply for your ID card first.",
      });
    }

    const { state: reporterState, city: reporterCity } = reporter;

    // Step 3: Fetch all approved ads
    const allApprovedAds = await Adpost.find({ status: "approved" });

    // Step 4: Filter ads according to strict priority
    const filteredAds = allApprovedAds.filter((ad) => {
      if (!reporter.verifiedReporter) return false;

      // Skip if ad is already fulfilled
      if (ad.acceptReporterCount >= ad.requiredReporter) return false;

      // Skip if reporter already handled
      if (
        ad.acceptRejectReporterList?.some(
          (e) => e.reporterId?.toString() === reporterId.toString()
        )
      )
        return false;

      // 1. reporterId
      if (Array.isArray(ad.reporterId) && ad.reporterId.length > 0) {
        return ad.reporterId.includes(String(reporterId));
      }

      // 2. adminSelectState/adminSelectCities
      if (
        (Array.isArray(ad.adminSelectState) &&
          ad.adminSelectState.includes(reporterState)) ||
        (Array.isArray(ad.adminSelectCities) &&
          ad.adminSelectCities.includes(reporterCity))
      ) {
        return true;
      }

      // 3. allStates
      if (ad.allStates === true) return true;

      // 4. pfState/pfCities
      const pfStates = Array.isArray(ad.pfState)
        ? ad.pfState
        : ad.pfState
        ? [ad.pfState]
        : [];
      const pfCities = Array.isArray(ad.pfCities)
        ? ad.pfCities
        : ad.pfCities
        ? [ad.pfCities]
        : [];
      if (pfStates.includes(reporterState) && pfCities.includes(reporterCity))
        return true;

      // 5. adState/adCity
      const adStates = Array.isArray(ad.adState)
        ? ad.adState
        : ad.adState
        ? [ad.adState]
        : [];
      const adCities = Array.isArray(ad.adCities)
        ? ad.adCities
        : ad.adCity
        ? [ad.adCity]
        : [];
      if (adStates.includes(reporterState) && adCities.includes(reporterCity))
        return true;

      return false;
    });

    res.status(200).json({
      success: true,
      message: "Filtered ads fetched successfully",
      data: filteredAds,
    });
  } catch (error) {
    console.error("Error fetching filtered ads for reporter:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching ads",
    });
  }
};

module.exports = reporterGetAllAds;
