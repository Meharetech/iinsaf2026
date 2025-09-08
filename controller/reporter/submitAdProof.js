const reporterAdProof = require("../../models/reporterAdProof/reporterAdProof");
const Adpost = require("../../models/advertismentPost/advertisementPost");

const submitAdProof = async (req, res) => {
  try {
    const reporterId = req.user._id;
    const { adId, channelName, platform, videoLink, duration } = req.body;
    const screenshot = req.file?.path;

    if (
      !screenshot ||
      !channelName ||
      !platform ||
      !videoLink ||
      !duration ||
      !adId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Get the ad
    const adPost = await Adpost.findById(adId);
    if (!adPost) {
      return res.status(404).json({ message: "Ad not found" });
    }

    // ✅ Find reporter entry
    const reporterEntry = adPost.acceptRejectReporterList.find(
      (r) => r.reporterId.toString() === reporterId.toString()
    );

    if (!reporterEntry || reporterEntry.accepted !== true) {
      return res.status(403).json({
        message: "You are not authorized to submit proof for this ad",
      });
    }

    // ✅ Check 14-hour expiry from acceptedAt
    const acceptedAt = new Date(reporterEntry.acceptedAt);
    const now = new Date();
    const diffInMs = now - acceptedAt;
    const fourteenHoursInMs = 14 * 60 * 60 * 1000;

    if (diffInMs > fourteenHoursInMs) {
      // ❌ Reject due to delay
      await Adpost.updateOne(
        { _id: adId, "acceptRejectReporterList.reporterId": reporterId },
        {
          $set: {
            "acceptRejectReporterList.$.accepted": false,
            "acceptRejectReporterList.$.adProof": false,
            "acceptRejectReporterList.$.rejectNote":
              "Ad rejected for you because of uploading after expiry time",
          },
        }
      );

      return res.status(403).json({
        message:
          "Ad rejected: You tried to upload proof after the 14-hour expiry time.",
      });
    }

    // ✅ Add proof if within time
    const newProof = {
      reporterId,
      screenshot,
      channelName,
      platform,
      videoLink,
      duration,
      status: "running",
      task: "pending",
    };

    let adProofDoc = await reporterAdProof.findOne({ adId });

    if (!adProofDoc) {
      adProofDoc = new reporterAdProof({
        adId,
        requiredReporter: adPost.requiredReporter,
        baseView: adPost.baseView,
        finalReporterPrice: adPost.finalReporterPrice,
        adType: adPost.adType,
        proofs: [newProof],
        runningAdStatus: "running",
      });
    } else {
      const alreadySubmitted = adProofDoc.proofs.some(
        (proof) => proof.reporterId.toString() === reporterId.toString()
      );
      if (alreadySubmitted) {
        return res
          .status(400)
          .json({ message: "You have already submitted proof for this ad" });
      }

      adProofDoc.proofs.push(newProof);
    }

    await adProofDoc.save();

    // ✅ Mark adProof: true in Adpost
    await Adpost.updateOne(
      { _id: adId, "acceptRejectReporterList.reporterId": reporterId },
      { $set: { "acceptRejectReporterList.$.adProof": true } }
    );

    res
      .status(201)
      .json({ message: "Proof submitted successfully", data: adProofDoc });
  } catch (error) {
    console.error("Submit Proof Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};




const reporterGetRunningAds = async (req, res) => {
  try {
    const reporterId = req.user._id;

    console.log("Reporter ID:", reporterId);

    // 1. Find all adProof documents where this reporter has a proof with status 'running'
    const runningAds = await reporterAdProof.find({
      proofs: {
        $elemMatch: {
          reporterId: reporterId,
          status: 'running',
        },
      },
    });

    // 2. Filter proofs to include only the current reporter's entry
    const filteredAds = runningAds.map((doc) => {
      const reporterProof = doc.proofs.find(
        (proof) => proof.reporterId.toString() === reporterId.toString()
      );

      return {
        _id: doc._id,
        adId: doc.adId,
        baseView: doc.baseView,
        finalReporterPrice: doc.finalReporterPrice,
        adType: doc.adType,
        runningAdStatus: doc.runningAdStatus,
        requiredReporter: doc.requiredReporter,
        proofs: reporterProof ? [reporterProof] : [],
      };
    });

    console.log('Filtered Running Ads Data:', filteredAds);

    res.status(200).json({
      success: true,
      message: "Running ads fetched successfully",
      data: filteredAds,
    });
  } catch (error) {
    console.error("Error fetching running ads:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching running ads",
    });
  }
};


const reporterGetCompletedAds = async (req, res) => {
  try {
    const reporterId = req.user._id;

    // Step 1: Find all documents that include this reporter with completed status
    const completedAds = await reporterAdProof.find({
      proofs: {
        $elemMatch: {
          reporterId: reporterId,
          status: 'completed',
        },
      },
    });

    // Step 2: Filter each document to include only this reporter's proof
    const filteredAds = completedAds.map((doc) => {
      const reporterProof = doc.proofs.find(
        (proof) =>
          proof.reporterId.toString() === reporterId.toString() &&
          proof.status === 'completed'
      );

      return {
        _id: doc._id,
        adId: doc.adId,
        baseView: doc.baseView,
        finalReporterPrice: doc.finalReporterPrice,
        adType: doc.adType,
        runningAdStatus: doc.runningAdStatus,
        requiredReporter: doc.requiredReporter,
        proofs: reporterProof ? [reporterProof] : [],
      };
    });

    res.status(200).json({
      success: true,
      message: 'Completed ads fetched successfully',
      data: filteredAds,
    });
  } catch (error) {
    console.error('Error fetching completed ads:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching completed ads',
    });
  }
};



module.exports = { submitAdProof, reporterGetRunningAds, reporterGetCompletedAds};
