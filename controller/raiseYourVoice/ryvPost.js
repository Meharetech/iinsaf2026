const ryvPostModel = require("../../models/raiseYourVoicePost/ryvPostSchema");
const Admin = require("../../models/adminModels/adminRegistration/adminSchema");
const sendEmail = require("../../utils/sendEmail");
const notifyOnWhatsapp = require("../../utils/notifyOnWhatsapp");
const Templates = require("../../utils/whatsappTemplates")
const ryvPost = async (req, res) => {
  try {
    const {
      name,
      phoneNo,
      email,
      dateOfBirth,
      state,
      city,
      residenceAddress,
      gender,
      aadharNo,
      pancard,
      description,
    } = req.body;

    console.log("that is data from frontend for posting ", req.body);

    // Validate mandatory fields
    if (
      !name ||
      !phoneNo ||
      !email ||
      !dateOfBirth ||
      !state ||
      !city ||
      !residenceAddress ||
      !gender ||
      !aadharNo ||
      !pancard ||
      !description
    ) {
      return res
        .status(400)
        .json({ message: "All fields including description are required." });
    }

    // Media upload check
    let imagePath = "";
    let videoPath = "";

    if (req.files?.image?.[0]) {
      imagePath = req.files.image[0].path;
    }

    if (req.files?.video?.[0]) {
      videoPath = req.files.video[0].path;
    }

    if (!imagePath && !videoPath) {
      return res
        .status(400)
        .json({ message: "Either image or video is required." });
    }

    const newPost = new ryvPostModel({
      userId: req.userId,
      name,
      phoneNo,
      email,
      dateOfBirth,
      state,
      city,
      residenceAddress,
      gender,
      aadharNo,
      pancard,
      description,
      image: imagePath,
      video: videoPath,
      status: "under review",
    });

    await newPost.save();

    // 🔹 Find SuperAdmins and SubAdmins assigned to "Raise Your Voice"
    const admins = await Admin.find({
      $or: [
        { role: "superadmin" },
        { role: "subadmin", assignedSections: "Raise Your Voice" },
      ],
    }).select("email mobile name");

    // 🔹 Notify Admins (Email + WhatsApp)
    for (const admin of admins) {
      // 📧 Email notification
      await sendEmail({
        to: admin.email,
        subject: "New Raise Your Voice Post Submitted",
        text: `A new RYV post has been submitted by ${name} (${email}).\n\nDescription: ${description}\n\nCheck the admin dashboard for details.`,
      });

      // 📱 WhatsApp notification
      if (admin.mobileNumber) {
        await notifyOnWhatsapp(
          admin.mobileNumber,
          Templates.NOTIFY_TO_ADMIN_AFTER_RYV_AD_CREATED, // 👈 your WhatsApp template name
          [
            admin.name || "Admin", // {{1}} -> admin name
            name, // {{2}} -> reporter/advertiser name
            email, // {{3}} -> reporter/advertiser email
            description, // {{4}} -> RYV ad description
          ]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Post submitted successfully and is under review.",
      post: newPost,
    });
  } catch (error) {
    console.error("Error while submitting RYV post:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = ryvPost;
