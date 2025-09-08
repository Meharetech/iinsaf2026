const freeAdModel = require("../../../../models/adminModels/freeAds/freeAdsSchema");
const FreeAdProof = require("../../../../models/adminModels/freeAds/freeAdProofSchema");

// 🟥 1. Get Pending Ads — Ads waiting for all reporters to accept
// const getPendingFreeAds = async (req, res) => {
//   try {
//     // Fetch all approved ads
//     const ads = await freeAdModel.find({ status: "approved" });

//     const pendingAds = [];

//     for (let ad of ads) {
//       const totalRequired = ad.requiredReportersCount || 0;
//       const acceptedCount = ad.acceptedReporters?.filter(r => r.postStatus === "accepted").length || 0;

//       if (acceptedCount === totalRequired && totalRequired > 0) {
//         // Update status to running
//         ad.status = "accepted";
//         await ad.save();
//       } else if (acceptedCount < totalRequired) {
//         // Keep as pending
//         pendingAds.push(ad);
//       }
//     }

//     res.status(200).json({ success: true, data: pendingAds });
//   } catch (error) {
//     console.error("Error fetching pending ads:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const getPendingFreeAds = async (req, res) => {
  try {
    // Fetch all approved ads
    const ads = await freeAdModel.find({ status: "approved" });

    const pendingAds = [];

    for (let ad of ads) {
      const totalRequired = ad.requiredReportersCount || 0;

      // Count reporters who accepted
      const acceptedCount =
        ad.acceptedReporters?.filter((r) => r.postStatus === "accepted")
          .length || 0;

      if (totalRequired > 0 && acceptedCount === totalRequired) {
        // ✅ Update overall status to "running"
        ad.status = "running";
        await ad.save();
      } else {
        // ✅ Include ad in pending list
        pendingAds.push(ad);
      }
    }

    res.status(200).json({ success: true, data: pendingAds });
  } catch (error) {
    console.error("Error fetching pending ads:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// // 🟧 2. Get Approved Ads — All reporters accepted but not all uploaded proof
// const getApprovedFreeAds = async (req, res) => {
//   try {
//     // 1️⃣ Get ads where overall status is "accepted"
//     const ads = await freeAdModel.find({ status: "accepted" });

//     // 2️⃣ Filter them according to reporter statuses
//     const approvedAds = ads.filter(ad => {
//       const totalRequired = ad.requiredReportersCount || 0;

//       // Count reporters who accepted
//       const acceptedCount = ad.acceptedReporters?.filter(r => r.postStatus === "accepted").length || 0;

//       // Count reporters who already uploaded proof
//       const proofUploaded = ad.acceptedReporters?.filter(r => r.adProof).length || 0;

//       // ✅ Keep ads where all required reporters accepted AND no proof is fully uploaded
//       return acceptedCount === totalRequired && proofUploaded < totalRequired;
//     });

//     // console.log("Approved Ads:", approvedAds);
//     res.status(200).json({ success: true, data: approvedAds });
//   } catch (error) {
//     console.error("Error fetching approved ads:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// 🟧 2. Get Approved Ads — All reporters accepted but not all uploaded proof
const getApprovedFreeAds = async (req, res) => {
  try {
    // 1️⃣ Get ads where overall status is "running" (not "accepted")
    const ads = await freeAdModel.find({ status: "running" });

    // 2️⃣ Filter them according to reporter statuses
    const approvedAds = ads.filter((ad) => {
      const totalRequired = ad.requiredReportersCount || 0;

      // Count reporters who accepted
      const acceptedCount =
        ad.acceptedReporters?.filter((r) => r.postStatus === "accepted")
          .length || 0;

      // Count reporters who already uploaded proof
      const proofUploaded =
        ad.acceptedReporters?.filter((r) => r.adProof).length || 0;

      // ✅ Keep ads where all required reporters accepted AND no proof is fully uploaded
      return acceptedCount === totalRequired && proofUploaded < totalRequired;
    });

    res.status(200).json({ success: true, data: approvedAds });
  } catch (error) {
    console.error("Error fetching approved ads:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🟦 3. Get Running Ads — All proofs uploaded but not all completed by admin

// const getRunningFreeAds = async (req, res) => {
//   try {
//     // ✅ Fetch only approved ads
//     const ads = await freeAdModel.find({ status: "approved" }).lean();

//     const adsWithProofs = await Promise.all(
//       ads.map(async (ad) => {
//         // ✅ Fetch proofs only if submitted
//         const proofs = await FreeAdProof.find({
//           adId: ad._id,
//           status: "submitted"
//         })
//           .populate("reporterId", "name email")
//           .lean();

//         // ✅ If no proofs, skip this ad
//         if (proofs.length === 0) return null;

//         return {
//           adId: ad._id,
//           description: ad.description,
//           state: ad.state,
//           city: ad.city,
//           requiredReporters: ad.requiredReportersCount || 0,
//           proofUploadedCount: proofs.length,
//           proofs: proofs.map((p) => ({
//             adId: p.adId,
//             channelName: p.channelName,
//             duration: p.duration,
//             platform: p.platform,
//             reporterId: p.reporterId._id,
//             name: p.reporterId.name,
//             videoLink: p.videoLink,
//             screenshot: p.screenshot,
//             submittedAt: p.submittedAt,
//           })),
//         };
//       })
//     );

//     // ✅ Remove null (ads with no proofs)
//     const runningAds = adsWithProofs.filter(Boolean);

//     res.status(200).json({ success: true, data: runningAds });
//   } catch (error) {
//     console.error("Error fetching proofs:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// 🟦 3. Get Running Ads — Ad is running + proofs uploaded
const getRunningFreeAds = async (req, res) => {
  try {
    // ✅ Fetch ads with status approved or running (not completed)
    const ads = await freeAdModel.find({
      status: { $in: ["approved", "running"] },
    }).lean();

    const adsWithProofs = await Promise.all(
      ads.map(async (ad) => {
        // ✅ Get only proofs from acceptedReporters
        const proofs = ad.acceptedReporters.filter(
          (r) => r.postStatus === "submitted" && r.adProof
        );

        if (proofs.length === 0) return null; // skip ads without proof

        return {
          ...ad, // include all ad fields
          adId: ad._id,
          proofUploadedCount: proofs.length,
          proofs: proofs.map((p) => ({
            channelName: p.channelName,
            duration: p.duration,
            platform: p.platform,
            reporterId: p.reporterId,
            postStatus: p.postStatus,
            adProof: p.adProof,
            videoLink: p.videoLink,
            screenshot: p.screenshot,
            submittedAt: p.acceptedAt, // or add dedicated submittedAt later
          })),
        };
      })
    );

    // ✅ Filter out null values (ads without proofs)
    const runningAds = adsWithProofs.filter(Boolean);

    res.status(200).json({ success: true, data: runningAds });
  } catch (error) {
    console.error("Error fetching running ads:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// 🟩 4. Get Completed Ads — All accepted reporters have completed status
const getCompletedFreeAds = async (req, res) => {
  try {
    const ads = await freeAdModel.find({ status: "completed" });

    const completedAds = ads.filter((ad) => {
      const totalAccepted = ad.acceptedReporters?.length || 0;
      const totalCompleted =
        ad.acceptedReporters?.filter((r) => r.postStatus === "completed")
          .length || 0;

      return totalAccepted > 0 && totalCompleted === totalAccepted;
    });

    console.log("Completed Ads:", completedAds);
    res.status(200).json({ success: true, data: completedAds });
  } catch (error) {
    console.error("Error fetching completed ads:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getPendingFreeAds,
  getApprovedFreeAds,
  getRunningFreeAds,
  getCompletedFreeAds,
};
