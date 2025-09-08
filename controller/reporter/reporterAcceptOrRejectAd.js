const Adpost = require("../../models/advertismentPost/advertisementPost");
const AdPricing = require("../../models/adminModels/advertismentPriceSet/adPricingSchema");

const acceptAd = async (req, res) => {
  try {
    const reporterId = req.user._id;
    const adId = req.params.adId;

    if (!adId) {
      return res.status(400).json({ success: false, message: "adId is required" });
    }

    const ad = await Adpost.findById(adId);
    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    const pricing = await AdPricing.findOne();
    const acceptTimeInHours = pricing?.reporterAcceptTimeInHours || 1;

    const approvedAt = new Date(ad.approvedAt);
    const expiryTime = new Date(approvedAt.getTime() + acceptTimeInHours * 60 * 60 * 1000);
    const now = new Date();

    const reporterEntryIndex = ad.acceptRejectReporterList.findIndex(
      (r) => r.reporterId.toString() === reporterId.toString()
    );
    const reporterEntry = ad.acceptRejectReporterList[reporterEntryIndex];

    // ✅ If ad has already expired
    if (now >= expiryTime) {
      if (!reporterEntry) {
        // Add auto-rejection entry
        ad.acceptRejectReporterList.push({
          reporterId: reporterId,
          accepted: false,
          adProof: false,
          rejectNote: "Auto-rejected due to expiry of time",
        });
        await ad.save();
      } else if (reporterEntry.accepted !== true) {
        // Update existing entry if not accepted
        ad.acceptRejectReporterList[reporterEntryIndex] = {
          ...reporterEntry,
          accepted: false,
          adProof: false,
          rejectNote: "Auto-rejected due to expiry of time",
        };
        await ad.save();
      }

      return res.status(403).json({
        success: false,
        message: "Ad acceptance time has expired.",
      });
    }

    // ✅ Already accepted
    if (reporterEntry?.accepted === true) {
      return res.status(400).json({
        success: false,
        message: "You have already accepted this ad.",
      });
    }

    // ✅ Already rejected (don't let retry)
    if (reporterEntry?.accepted === false) {
      return res.status(400).json({
        success: false,
        message: "You have already been rejected for this ad.",
      });
    }

    // ✅ If ad already filled
    if (ad.acceptReporterCount >= ad.requiredReporter) {
      return res.status(400).json({
        success: false,
        message: "This ad has already reached the required number of reporters",
      });
    }

    // ✅ Accept the ad now
    ad.acceptRejectReporterList.push({
      reporterId: reporterId,
      accepted: true,
      adProof: false,
      acceptedAt: now,
    });

    ad.acceptReporterCount += 1;

    // ✅ If ad is now full, update status to running
    if (
      ad.acceptReporterCount === ad.requiredReporter &&
      ad.status === "approved"
    ) {
      ad.status = "running";
    }

    await ad.save();

    return res.status(200).json({
      success: true,
      message: "Ad accepted successfully",
      data: ad,
    });

  } catch (error) {
    console.error("Error in acceptAd:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};





const rejectAd = async (req, res) => {
  try {
    const reporterId = req.user._id; // Assuming reporter is logged in
    const adId = req.params.adId;
    const { note } = req.body; // note = rejection reason

    if (!note || note.trim() === "") {
      return res.status(400).json({ success: false, message: "Rejection note is required" });
    }

    const ad = await Adpost.findOneAndUpdate(
      { _id: adId, "acceptRejectReporterList.reporterId": reporterId },
      {
        $set: {
          "acceptRejectReporterList.$.accepted": false,
          "acceptRejectReporterList.$.adProof": false,
          "acceptRejectReporterList.$.rejectNote": note,
        },
      },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found or reporter not assigned" });
    }

    return res.status(200).json({
      success: true,
      message: "Ad rejected and note saved",
      updatedAd: ad,
    });
  } catch (err) {
    console.error("Error in reporterRejectAd:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = { acceptAd, rejectAd };
