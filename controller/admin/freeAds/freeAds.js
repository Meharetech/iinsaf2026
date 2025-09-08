const freeAdModel = require("../../../models/adminModels/freeAds/freeAdsSchema");
const User = require("../../../models/userModel/userModel");
const fs = require("fs");
const uploadToCloudinary = require("../../../utils/uploadToCloudinary");
const sendEmail = require("../../../utils/sendEmail")
const notifyOnWhatsapp = require("../../../utils/notifyOnWhatsapp")
const Templates = require("../../../utils/whatsappTemplates")

// Safe delete utility
const safeDeleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Error deleting file:", err.message);
    }
  } else {
    console.warn("File not found for deletion:", filePath);
  }
};

const freeAds = async (req, res) => {
  try {
    const {
      adType,
      mediaType,
      description,
      state,
      cities,
      reportersIds,
      allStatesTrue,
    } = req.body;

    // ✅ Validate input
    if (
      !state &&
      (!cities || cities.length === 0) &&
      (!reportersIds || reportersIds.length === 0) &&
      !allStatesTrue
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one of state, cities, reportersIds, or allStatesTrue must be provided.",
      });
    }

    let imageUrl = "";
    let videoUrl = "";

    // ✅ Upload image
    if (mediaType === "image" && req.files?.image?.[0]) {
      const image = req.files.image[0];
      const uploadedImage = await uploadToCloudinary(image.path, "image");
      imageUrl = uploadedImage.secure_url;
      safeDeleteFile(image.path);
    }

    // ✅ Upload video
    if (mediaType === "video" && req.files?.video?.[0]) {
      const video = req.files.video[0];
      const uploadedVideo = await uploadToCloudinary(video.path, "video");
      videoUrl = uploadedVideo.secure_url;
      safeDeleteFile(video.path);
    }

    // ================================
    // ✅ Calculate required reporters
    // ================================
    let requiredReporters = [];

    // CASE 1: Admin chose specific reporters
    if (reportersIds && reportersIds.length > 0) {
      const idsArray = reportersIds.split(",").filter((id) => id.trim() !== "");
      requiredReporters = idsArray;
    }

    // CASE 2: All reporters in DB
    else if (allStatesTrue === true) {
      const allReporters = await User.find({ role: "Reporter" }, "_id");
      requiredReporters = allReporters.map((r) => r._id.toString());
    }

    // CASE 3: Reporters in selected cities
    else if (cities && cities.length > 0) {
      const citiesArray = cities.split(",").map((c) => c.trim());
      const reportersInCities = await User.find(
        { role: "Reporter", city: { $in: citiesArray } },
        "_id"
      );
      requiredReporters = reportersInCities.map((r) => r._id.toString());
    }

    const requiredReportersCount = requiredReporters.length;

    // ================================
    // ✅ Save ad in DB
    // ================================
    const newFreeAd = new freeAdModel({
      adType,
      mediaType,
      description,
      imageUrl,
      videoUrl,
      state: state ? [state] : [],
      city: cities ? cities.split(",") : [],
      selectedReporters: requiredReporters, // always store the actual list of targeted reporters
      requiredReportersCount, // store calculated number
      acceptedReporters: [], // no one has accepted yet
      allState: !!allStatesTrue, // store flag if needed
    });

    await newFreeAd.save();

    const reporters = await User.find({ _id: { $in: requiredReporters } });

    for (const reporter of reporters) {
      // 📧 Email notification
      if (reporter.email) {
        await sendEmail(
          reporter.email,
          "Mandatory Ad Assigned",
          `Hello ${reporter.name},\n\nA new mandatory ad has been assigned to you. Please check your dashboard and take action accordingly.\n\nAd Description: ${description}\nMedia Type: ${mediaType}\n\nRegards,\nIINSAF Team`
        );
      }

      // 📱 WhatsApp notification
      if (reporter.mobile) {
        await notifyOnWhatsapp(
          reporter.mobile,
          Templates.NOTIFY_TO_REQUIRED_REPORTER_AFTER_CREATED_FREE_AD, // ✅ AiSensy template
          [
            reporter.name, // {{1}} -> reporter's name
            description, // {{2}} -> ad description
            mediaType, // {{3}} -> media type
          ]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Free ad posted successfully",
      data: newFreeAd,
    });
  } catch (err) {
    console.error("Error in freeAds controller:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error while posting free ad" });
  }
};

module.exports = freeAds;
