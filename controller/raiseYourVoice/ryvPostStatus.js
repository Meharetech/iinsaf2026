const RaiseYourVoice = require("../../models/raiseYourVoicePost/ryvPostSchema");
const raiseYourVoiceProof = require("../../models/raiseYourVoicePost/raiseYourVoiceProofSubmit")


// 1. Under Review
const getUnderReviewRaiseYourVoice = async (req, res) => {
  try {
    const userId = req.user._id; // logged-in user ID
    const records = await RaiseYourVoice.find({ userId, status: "under review" }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error("Error fetching under review records:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching under review records"
    });
  }
};

// 2. Approved
const getApprovedRaiseYourVoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const records = await RaiseYourVoice.find({ userId, status: "approved" }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error("Error fetching approved records:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching approved records"
    });
  }
};

// 3. Rejected
const getRejectedRaiseYourVoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const records = await RaiseYourVoice.find({ userId, status: "rejected" }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error("Error fetching rejected records:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching rejected records"
    });
  }
};



// 4. Running
const getRunningRaiseYourVoice = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Find all ads created by this user
    const ads = await RaiseYourVoice.find({ userId })
      .sort({ createdAt: -1 });

    if (!ads || ads.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No ads found for this user"
      });
    }

    // 2. Collect adIds
    const adIds = ads.map(ad => ad._id);

    // 3. Find only completed proofs linked to these ads
    const completedProofs = await raiseYourVoiceProof.find({
      adId: { $in: adIds },
      status: "completed"
    })
      .populate("reporterId", "name email")
      .sort({ createdAt: -1 });

    if (!completedProofs || completedProofs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No running ads found (no completed proofs)"
      });
    }

    // 4. Filter ads that actually have completed proofs
    const adsWithCompletedProofs = ads.map(ad => {
      const adProofs = completedProofs.filter(
        proof => proof.adId.toString() === ad._id.toString()
      );

      if (adProofs.length > 0) {
        return {
          ...ad.toObject(),
          proofs: adProofs
        };
      }
      return null;
    }).filter(Boolean); // remove ads without completed proofs

    res.status(200).json({
      success: true,
      count: adsWithCompletedProofs.length,
      data: adsWithCompletedProofs
    });

  } catch (error) {
    console.error("Error fetching running ads with completed proofs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching running ads"
    });
  }
};



const getRaiseYourVoiceStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Count Under Review, Approved, Rejected directly from RaiseYourVoice
    const adStats = await RaiseYourVoice.aggregate([
      { $match: { userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 2. Handle Running Ads separately (needs proofs with status "completed")
    const userAds = await RaiseYourVoice.find({ userId }, "_id");
    const adIds = userAds.map(ad => ad._id);

    const runningProofs = await raiseYourVoiceProof.aggregate([
      { $match: { adId: { $in: adIds }, status: "completed" } },
      { $group: { _id: "$adId" } } // unique ads with completed proofs
    ]);

    const stats = {
      underReview: 0,
      approved: 0,
      rejected: 0,
      running: runningProofs.length
    };

    // Fill stats from adStats
    adStats.forEach(item => {
      if (item._id === "under review") stats.underReview = item.count;
      if (item._id === "approved") stats.approved = item.count;
      if (item._id === "rejected") stats.rejected = item.count;
    });

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error fetching RaiseYourVoice stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching RaiseYourVoice stats"
    });
  }
};



module.exports = {
  getUnderReviewRaiseYourVoice,
  getApprovedRaiseYourVoice,
  getRejectedRaiseYourVoice,
  getRunningRaiseYourVoice,
  getRaiseYourVoiceStats
};
