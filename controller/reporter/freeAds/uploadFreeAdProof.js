const FreeAdProof = require("../../../models/adminModels/freeAds/freeAdProofSchema");
const FreeAdModel = require("../../../models/adminModels/freeAds/freeAdsSchema");

const uploadFreeAdProof = async (req, res) => {
  try {
    console.log("Incoming proof submission:", req.body);

    const reporterId = req.user._id;
    const { adId, channelName, platform, videoLink, duration } = req.body;
    const screenshot = req.file?.path;

    // Validate required fields
    if (!adId || !screenshot || !channelName || !platform || !videoLink || !duration) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if ad exists
    const freeAd = await FreeAdModel.findById(adId);
    if (!freeAd) {
      return res.status(404).json({ message: "Free Ad not found" });
    }

    // Check if reporter has accepted the ad
    const reporterEntry = freeAd.acceptedReporters.find(
      (r) => r.reporterId.toString() === reporterId.toString()
    );

    if (!reporterEntry || reporterEntry.postStatus !== "accepted") {
      return res.status(403).json({
        message: "You are not authorized to submit proof for this ad",
      });
    }

    // Check if proof already submitted
    const alreadySubmitted = await FreeAdProof.findOne({ adId, reporterId });
    if (alreadySubmitted) {
      return res.status(400).json({ message: "Proof already submitted for this ad" });
    }

    // Create and save proof
const newProof = new FreeAdProof({
  adId,
  reporterId,
  screenshot,
  channelName,
  videoLink,
  platform,
  duration,
  status: "submitted",
});

await newProof.save();

// Update reporter's status in the ad
await FreeAdModel.updateOne(
  { _id: adId, "acceptedReporters.reporterId": reporterId },
  {
    $set: {
      "acceptedReporters.$.adProof": true,
      "acceptedReporters.$.postStatus": "submitted"
    }
  }
);


    res.status(201).json({
      success: true,
      message: "Proof submitted successfully",
      data: newProof,
    });

  } catch (error) {
    console.error("Free Ad Proof Submission Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = uploadFreeAdProof;
