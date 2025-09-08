const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../../models/userModel/userModel")
const axios = require('axios');
require("dotenv").config();
const wallet = require('../../models/Wallet/walletSchema')


// Temporary storage for unverified users
const pendingRegistrations = new Map();

// Clean up expired entries every 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of pendingRegistrations.entries()) {
    if (value.otpExpiry < now) {
      pendingRegistrations.delete(key);
    }
  }
}, 60 * 1000); // cleanup every 1 minute







const sendOtpViaSMS = async (mobile, otp, userName) => {
  try {
    const apiKey = process.env.AISENSY_API_KEY;

    const response = await axios.post("https://backend.aisensy.com/campaign/t1/api/v2", {
      apiKey,
      campaignName: "copy_otp",
      destination: `91${mobile}`,
      templateParams: [`${otp}`],
      buttons: [
        {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            {
              type: "text",
              text: `${otp}`,
            },
          ],
        },
      ],
    });

    return response.data;
  } catch (error) {
    console.error("Error sending WhatsApp OTP:", error?.response?.data || error.message);
    throw new Error("Failed to send WhatsApp OTP");
  }
};





// const axios = require("axios");

// const sendOtpViaSMS = async (mobile, otp, userName) => {
//   try {
//     const apiKey = process.env.AISENSY_API_KEY;

//     const payload = {
//       apiKey,
//       campaignName: "copy_otp", // ✅ must match your approved template name
//       destination: `91${mobile}`, // ✅ Indian numbers
//       templateParams: [userName, otp], // ✅ adjust order to match template placeholders
//     };

//     const response = await axios.post(
//       "https://backend.aisensy.com/campaign/t1/api/v2",
//       payload
//     );

//     console.log("✅ WhatsApp OTP sent:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "❌ Error sending WhatsApp OTP:",
//       error?.response?.data || error.message
//     );
//     return null; // don't throw, so sub-admin creation isn't blocked
//   }
// };






const sendOtpViaEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};






const verifyOtp = async (req, res) => {
  const { email, mobile, otpEmail, otpMobile } = req.body;

  const key = `${email}|${mobile}`;
  const userData = pendingRegistrations.get(key);

  if (!userData) {
    return res.status(400).json({ msg: "No registration found or OTP expired. Please register again." });
  }

  const { emailOtp, mobileOtp, otpExpiry } = userData;

  const isEmailOtpValid = emailOtp === otpEmail?.toString().trim();
  const isMobileOtpValid = mobileOtp === otpMobile?.toString().trim();
  const isOtpExpired = Date.now() > otpExpiry;

  if (!isEmailOtpValid || !isMobileOtpValid || isOtpExpired) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  try {
    // Save to DB
    const user = new User({ ...userData, isVerified: true });
    await user.save();

    // Create wallet
    await wallet.create({
      userId: user._id,
      userType: user.role,
      balance: 0,
      transactions: [],
    });

    // Cleanup
    pendingRegistrations.delete(key);

    return res.status(200).json({
      success: true,
      msg: "OTP verified successfully. You are now registered.",
    });

  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).send("Server error");
  }
};



// const preRegisterUser = async (req, res) => {
//   const {
//     name, residenceaddress, mobile, email, state, city, gender, role, pincode,
//     password, aadharNo, pancard, dateOfBirth, bloodType
//   } = req.body;

//   console.log("in pre RegisterUser section")

//   try {
//     const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: existingUser.isVerified
//           ? "User already exists"
//           : "User already registered but not verified",
//       });
//     }

//     const mobileOtp = crypto.randomInt(100000, 999999).toString();
//     const emailOtp = crypto.randomInt(100000, 999999).toString();
//     const otpExpiry = Date.now() + 3 * 60 * 1000; // 3 minutes

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Store in Map()
//     pendingRegistrations.set(`${email}|${mobile}`, {
//       name, residenceaddress, mobile, email, state, city, gender, role, pincode,
//       password: hashedPassword, aadharNo, pancard, dateOfBirth, bloodType,
//       mobileOtp, emailOtp, otpExpiry
//     });

//     // Send OTPs
//     sendOtpViaEmail(email, emailOtp);
//     sendOtpViaSMS(mobile, mobileOtp, name);

//     return res.status(200).json({
//       success: true,
//       message: "OTPs sent to email and mobile. Please verify to complete registration.",
//     });

//   } catch (err) {
//     console.error("Pre-registration error:", err);
//     return res.status(500).send("Server error");
//   }
// };






//exeption handling
const preRegisterUser = async (req, res) => {
  const {
    name, residenceaddress, mobile, email, state, city, gender, role, pincode,
    password, aadharNo, pancard, dateOfBirth, bloodType
  } = req.body;

  console.log("in pre RegisterUser section");

  try {
    // ✅ Basic validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/; // Indian 10-digit numbers starting 6–9

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number",
      });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.isVerified
          ? "User already exists"
          : "User already registered but not verified",
      });
    }

    // ✅ Generate OTPs
    const mobileOtp = crypto.randomInt(100000, 999999).toString();
    const emailOtp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 3 * 60 * 1000; // 3 minutes

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Store pending registration
    pendingRegistrations.set(`${email}|${mobile}`, {
      name, residenceaddress, mobile, email, state, city, gender, role, pincode,
      password: hashedPassword, aadharNo, pancard, dateOfBirth, bloodType,
      mobileOtp, emailOtp, otpExpiry
    });

    // ✅ Send OTPs
    await sendOtpViaEmail(email, emailOtp);
    await sendOtpViaSMS(mobile, mobileOtp, name);

    return res.status(200).json({
      success: true,
      message: "OTPs sent to email and mobile. Please verify to complete registration.",
    });

  } catch (err) {
    console.error("Pre-registration error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};







module.exports = { preRegisterUser, verifyOtp, sendOtpViaSMS, sendOtpViaEmail}