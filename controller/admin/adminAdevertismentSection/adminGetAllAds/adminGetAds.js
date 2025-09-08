const fs = require("fs"); // for createWriteStream
const fsp = require("fs").promises; // for async file operations
const path = require("path");

const Adpost = require("../../../../models/advertismentPost/advertisementPost");
const reporterAdProof = require("../../../../models/reporterAdProof/reporterAdProof");
const notifyMatchingReporters = require("../../../../utils/notifyMatchingReporters");
const Wallet = require("../../../../models/Wallet/walletSchema");
const axios = require("axios");
const getLiveViews = require("../../../../utils/getLiveViews");
const AdPricing = require("../../../../models/adminModels/advertismentPriceSet/adPricingSchema");
const applyWatermark = require("../../../../utils/applyWatermark");
const uploadToCloudinary = require("../../../../utils/uploadToCloudinary");
const sendEmail = require("../../../../utils/sendEmail");
const User = require("../../../../models/userModel/userModel");
const notifyOnWhatsapp = require("../../../../utils/notifyOnWhatsapp");
const Templates = require("../../../../utils/whatsappTemplates");

const adminGetAds = async (req, res) => {
  try {
    const ads = await Adpost.find().sort({ createdAt: -1 }); // optional: latest ads first
    res.status(200).json(ads);
  } catch (error) {
    console.error("Error fetching ads:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch advertisements" });
  }
};

// ✅ Download remote file
const downloadFile = async (fileUrl, outputLocationPath) => {
  const writer = fs.createWriteStream(outputLocationPath);

  const response = await axios({
    url: fileUrl,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      writer.close(); // ensure stream closed
      resolve();
    });
    writer.on("error", reject);
  });
};

const approvedAds = async (req, res) => {
  try {
    const adId = req.params.id;
    const ad = await Adpost.findById(adId);
    if (!ad)
      return res
        .status(404)
        .json({ success: false, message: "Advertisement not found" });

    const pricing = await AdPricing.findOne({
      adType: { $elemMatch: { name: ad.adType } },
    });

    if (!pricing || !pricing.reporterAcceptTimeInHours) {
      return res.status(500).json({
        success: false,
        message: "Reporter accept time not set in AdPricing",
      });
    }

    const approvedAt = new Date();
    const acceptBefore = new Date(
      approvedAt.getTime() + pricing.reporterAcceptTimeInHours * 60 * 60 * 1000
    );

    const tempFolder = path.join(__dirname, "../../tempAds");
    await fsp.mkdir(tempFolder, { recursive: true });

    let updatedImageUrl = ad.imageUrl;
    let updatedVideoUrl = ad.videoUrl;

    // ✅ Process Image
    if (ad.imageUrl) {
      const tempImagePath = path.join(tempFolder, `${Date.now()}_image.png`);
      await downloadFile(ad.imageUrl, tempImagePath);
      const watermarkedImage = await applyWatermark(tempImagePath, "image");
      const uploadImage = await uploadToCloudinary(
        watermarkedImage,
        "ads/images"
      );
      updatedImageUrl = uploadImage.secure_url;

      // Delete temp files safely
      await fsp.unlink(tempImagePath).catch(() => {});
      await fsp.unlink(watermarkedImage).catch(() => {});
    }

    // ✅ Process Video
    if (ad.videoUrl) {
      const tempVideoPath = path.join(tempFolder, `${Date.now()}_video.mp4`);
      await downloadFile(ad.videoUrl, tempVideoPath);
      const watermarkedVideo = await applyWatermark(tempVideoPath, "video");
      const uploadVideo = await uploadToCloudinary(
        watermarkedVideo,
        "ads/videos"
      );
      updatedVideoUrl = uploadVideo.secure_url;

      await fsp.unlink(tempVideoPath).catch(() => {});
      await fsp.unlink(watermarkedVideo).catch(() => {});
    }

    // Update ad
    ad.status = "approved";
    ad.approvedAt = approvedAt;
    ad.acceptBefore = acceptBefore;
    ad.imageUrl = updatedImageUrl;
    ad.videoUrl = updatedVideoUrl;
    await ad.save();

    // Notify reporters
    await notifyMatchingReporters(ad);

    // Notify advertiser
    const advertiser = await User.findById(ad.owner);

    // console.log("this the user we send to notification",advertiser)
    if (advertiser) {
      await sendEmail(
        advertiser.email,
        "✅ Your Ad is Approved",
        `Hello ${advertiser.name}, your advertisement "${ad.adType}" has been approved and will be published soon.`
      );

      // 📱 WhatsApp
      await notifyOnWhatsapp(
        advertiser.mobile,
        Templates.NOTIFY_TO_ADVERTISER_AFTER_AD_APPROVED, // "admin_approve_ad"
        [advertiser.name, ad.adType] // <-- must match AiSensy template variables
      );
    }

    res.json({
      success: true,
      message: "Advertisement approved and processed successfully",
      advertisement: ad,
    });
  } catch (err) {
    console.error("Error approving ad:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// const approvedAds = async (req, res) => {
//   try {
//     const adId = req.params.id;
//     const ad = await Adpost.findById(adId);
//     if (!ad)
//       return res.status(404).json({ success: false, message: "Advertisement not found" });

//     const pricing = await AdPricing.findOne({
//       adType: { $elemMatch: { name: ad.adType } },
//     });

//     if (!pricing || !pricing.reporterAcceptTimeInHours) {
//       return res.status(500).json({
//         success: false,
//         message: "Reporter accept time not set in AdPricing",
//       });
//     }

//     const approvedAt = new Date();
//     const acceptBefore = new Date(
//       approvedAt.getTime() + pricing.reporterAcceptTimeInHours * 60 * 60 * 1000
//     );

//     const tempFolder = path.join(__dirname, "../../tempAds");
//     await fs.mkdir(tempFolder, { recursive: true });

//     let updatedImageUrl = ad.imageUrl;
//     let updatedVideoUrl = ad.videoUrl;

//     // ---------------- IMAGE ----------------
//     if (ad.imageUrl) {
//       const tempImagePath = path.join(tempFolder, `${Date.now()}_image.png`);
//       await downloadFile(ad.imageUrl, tempImagePath);

//       const watermarkedImage = await applyWatermark(tempImagePath, "image");
//       const uploadImage = await uploadToCloudinary(watermarkedImage, "ads/images");
//       updatedImageUrl = uploadImage.secure_url;

//       // Delete temp files safely
//       fs.unlink(tempImagePath).catch(err => console.warn("Failed to delete temp image:", err.message));
//       fs.unlink(watermarkedImage).catch(err => console.warn("Failed to delete watermarked image:", err.message));
//     }

//     // ---------------- VIDEO ----------------
//     if (ad.videoUrl) {
//       const tempVideoPath = path.join(tempFolder, `${Date.now()}_video.mp4`);
//       await downloadFile(ad.videoUrl, tempVideoPath);

//       const watermarkedVideo = await applyWatermark(tempVideoPath, "video");
//       const uploadVideo = await uploadToCloudinary(watermarkedVideo, "ads/videos");
//       updatedVideoUrl = uploadVideo.secure_url;

//       fs.unlink(tempVideoPath).catch(err => console.warn("Failed to delete temp video:", err.message));
//       fs.unlink(watermarkedVideo).catch(err => console.warn("Failed to delete watermarked video:", err.message));
//     }

//     // ---------------- UPDATE AD ----------------
//     ad.status = "approved";
//     ad.approvedAt = approvedAt;
//     ad.acceptBefore = acceptBefore;
//     ad.imageUrl = updatedImageUrl;
//     ad.videoUrl = updatedVideoUrl;
//     await ad.save();

//     // ---------------- NOTIFICATIONS ----------------
//     await notifyMatchingReporters(ad);

//     const advertiser = await User.findById(ad.owner);
//     if (advertiser) {
//       await sendEmail(
//         advertiser.email,
//         "✅ Your Ad is Approved",
//         `Hello ${advertiser.name}, your advertisement "${ad.adType}" has been approved and will be published soon.`
//       );
//     }

//     // ---------------- POST TO FACEBOOK ----------------
//     // let facebookMessage = "Advertisement approved successfully.";
//     // try {
//     //   const uploadApi = process.env.FACEBOOK_UPLOAD_VIDEO;
//     //   if (updatedVideoUrl) {
//     //     await axios.post(uploadApi, { url: updatedVideoUrl });
//     //     facebookMessage = "Advertisement approved and posted to Facebook successfully.";
//     //   } else if (updatedImageUrl) {
//     //     await axios.post(uploadApi, { url: updatedImageUrl });
//     //     facebookMessage = "Advertisement approved and posted to Facebook successfully.";
//     //   }
//     // } catch (fbErr) {
//     //   console.error("Facebook upload failed:", fbErr.message);
//     //   facebookMessage = "Advertisement approved with watermark, but failed to post on Facebook.";
//     // }

//     // ---------------- RESPONSE ----------------
//     res.json({
//       success: true,
//       message: facebookMessage,
//       advertisement: ad,
//     });

//   } catch (err) {
//     console.error("Error approving ad:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const adminModifyAds = async (req, res) => {
  try {
    const { adId } = req.params;
    const {
      adminSelectState,
      adminSelectCities,
      adminSelectPincode,
      reporterId,
      allStates,
    } = req.body;

    const ad = await Adpost.findById(adId);
    if (!ad)
      return res
        .status(404)
        .json({ success: false, message: "Advertisement not found" });

    const pricing = await AdPricing.findOne({
      adType: { $elemMatch: { name: ad.adType } },
    });
    if (!pricing || !pricing.reporterAcceptTimeInHours) {
      return res.status(500).json({
        success: false,
        message: "Reporter accept time not set in AdPricing",
      });
    }

    const approvedAt = new Date();
    const acceptBefore = new Date(
      approvedAt.getTime() + pricing.reporterAcceptTimeInHours * 60 * 60 * 1000
    );

    // ✅ Ensure temp folder exists
    const tempFolder = path.join(__dirname, "../../tempAds");
    await fsp.mkdir(tempFolder, { recursive: true });

    // 🔧 Apply watermark if media exists
    let updatedImageUrl = ad.imageUrl;
    let updatedVideoUrl = ad.videoUrl;

    if (ad.imageUrl) {
      const tempImagePath = path.join(tempFolder, `${Date.now()}_image.png`);
      await downloadFile(ad.imageUrl, tempImagePath);
      const watermarkedImage = await applyWatermark(tempImagePath, "image");
      const uploadImage = await uploadToCloudinary(
        watermarkedImage,
        "ads/images"
      );
      updatedImageUrl = uploadImage.secure_url;

      await fsp.unlink(tempImagePath).catch(() => {});
      await fsp.unlink(watermarkedImage).catch(() => {});
    }

    if (ad.videoUrl) {
      const tempVideoPath = path.join(tempFolder, `${Date.now()}_video.mp4`);
      await downloadFile(ad.videoUrl, tempVideoPath);
      const watermarkedVideo = await applyWatermark(tempVideoPath, "video");
      const uploadVideo = await uploadToCloudinary(
        watermarkedVideo,
        "ads/videos"
      );
      updatedVideoUrl = uploadVideo.secure_url;

      await fsp.unlink(tempVideoPath).catch(() => {});
      await fsp.unlink(watermarkedVideo).catch(() => {});
    }

    // ✅ Update ad fields
    ad.adminSelectState = adminSelectState;
    ad.adminSelectCities = adminSelectCities;
    ad.adminSelectPincode = adminSelectPincode;
    ad.reporterId = reporterId;
    ad.allStates = allStates;
    ad.status = "approved";
    ad.approvedAt = approvedAt;
    ad.acceptBefore = acceptBefore;
    ad.imageUrl = updatedImageUrl;
    ad.videoUrl = updatedVideoUrl;

    await ad.save();

    // 🔔 Notify reporters
    await notifyMatchingReporters(ad);

    // 🔔 Notify advertiser
    const advertiser = await User.findById(ad.owner);
    if (advertiser) {
      await sendEmail(
        advertiser.email,
        "✅ Your Ad is Approved",
        `Hello ${advertiser.name}, your advertisement "${ad.adType}" has been approved and will be published soon.`
      );

      // 📱 WhatsApp
      await notifyOnWhatsapp(
        advertiser.mobile,
        Templates.NOTIFY_TO_ADVERTISER_AFTER_AD_APPROVED, // "admin_approve_ad"
        [advertiser.name, ad.adType] // <-- must match AiSensy template variables
      );
    }

    // 📤 Facebook upload (optional, uncomment if needed)
    // const uploadApi = process.env.FACEBOOK_UPLOAD_VIDEO;
    let fbUploadStatus = "not attempted";
    // try {
    //   if (updatedVideoUrl) await axios.post(uploadApi, { url: updatedVideoUrl });
    //   else if (updatedImageUrl) await axios.post(uploadApi, { url: updatedImageUrl });
    //   fbUploadStatus = "success";
    // } catch (fbError) {
    //   console.error("Facebook upload error:", fbError.message || fbError);
    //   fbUploadStatus = "failed";
    // }

    res.status(200).json({
      success: true,
      message: `Advertisement updated by admin with watermark applied. Facebook upload ${fbUploadStatus}.`,
      ad,
      facebookUploadStatus: fbUploadStatus,
    });
  } catch (error) {
    console.error("Admin ad update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const rejectedAds = async (req, res) => {
  try {
    const { adminRejectNote } = req.body;

    // 1. Update ad with status and rejection note
    const ad = await Adpost.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", adminRejectNote },
      { new: true }
    );

    if (!ad) {
      return res
        .status(404)
        .json({ success: false, message: "Advertisement not found" });
    }

    const advertiserId = ad.owner;
    const refundAmount = ad.totalCost || 0;

    if (!advertiserId || refundAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ad payment info" });
    }

    // 3. Find or create wallet
    let wallet = await Wallet.findOne({
      userId: advertiserId,
      userType: "Advertiser",
    });

    if (!wallet) {
      wallet = new Wallet({
        userId: advertiserId,
        userType: "Advertiser",
        balance: 0,
      });
    }

    // 4. Refund transaction
    wallet.balance = Number(wallet.balance || 0) + Number(refundAmount);
    wallet.transactions.push({
      type: "credit",
      amount: refundAmount,
      description: `Refund for rejected ad: ${ad._id}`,
    });

    await wallet.save();

    const advertiser = await User.findById(ad.owner);
    if (advertiser) {
      // 📧 Email notification
      if (advertiser.email) {
        await sendEmail(
          advertiser.email,
          "❌ Your Ad was Rejected",
          `Hello ${advertiser.name}, unfortunately your advertisement "${
            ad.adType
          }" was rejected. Reason: ${
            ad.adminRejectNote || "Not specified"
          }.\nA refund of ₹${refundAmount} has been credited to your wallet.`
        );
      }

      // 📱 WhatsApp notification
      if (advertiser.mobile) {
        await notifyOnWhatsapp(
          advertiser.mobile,
          Templates.NOTIFY_TO_ADVERTISER_AFTER_AD_REJECTED_BY_ADMIN, // ✅ AiSensy template
          [
            advertiser.name, // {{1}} -> advertiser name
            ad.adType, // {{2}} -> ad type
            ad.adminRejectNote || "Not specified", // {{3}} -> rejection reason
            refundAmount, // {{4}} -> refund amount
          ]
        );
      }
    }

    res.json({
      success: true,
      message: "Advertisement rejected and refund credited to wallet",
      advertisement: ad,
      walletBalance: wallet.balance,
    });
  } catch (err) {
    console.error("Error rejecting ad:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminGetRunningAds = async (req, res) => {
  try {
    const runningAds = await reporterAdProof
      .find({
        runningAdStatus: "running",
      })
      .lean();

    if (!runningAds || runningAds.length === 0) {
      return res.status(404).json({ message: "No running ads found" });
    }

    for (const ad of runningAds) {
      if (Array.isArray(ad.proofs)) {
        for (const proof of ad.proofs) {
          const { platform, videoLink } = proof;

          if (platform && videoLink) {
            try {
              const liveViews = await getLiveViews(platform, videoLink);
              proof.liveViews = liveViews ?? "N/A";
            } catch (err) {
              console.error(`Error getting views for ${platform}:`, err);
              proof.liveViews = "N/A";
            }
          }
        }
      }
    }

    res.status(200).json({
      message: "Running ads fetched successfully",
      count: runningAds.length,
      data: runningAds,
    });
  } catch (error) {
    console.error("Error fetching running ads:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  adminGetAds,
  approvedAds,
  rejectedAds,
  adminModifyAds,
  adminGetRunningAds,
};
