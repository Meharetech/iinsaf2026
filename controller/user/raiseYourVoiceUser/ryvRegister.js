const ryvUsers = require("../../../models/userModel/RaiseYourVoiceModel/raiseYourVoiceUsers");
const crypto = require("crypto");
const sendWhatsappOtp = require("../../../utils/sendWhatsappOtp");
const { sendOtpViaEmail } = require("../../../controller/user/registerUser");
const jwt = require("jsonwebtoken");

// const registerRyvUser = async (req, res) => {
//   const {
//     name,
//     phoneNo,
//     email,
//     gender,
//     aadharNo,
//     pancard,
//     state,
//     city,
//     residenceAddress,
//     dateOfBirth,
//   } = req.body;

//   try {
//     if (
//       !name ||
//       !phoneNo ||
//       !email ||
//       !gender ||
//       !aadharNo ||
//       !pancard ||
//       !state ||
//       !city ||
//       !residenceAddress ||
//       !dateOfBirth
//     ) {
//       return res.status(400).json({ message: "All fields are required." });
//     }

//     const existingVerified = await ryvUsers.findOne({
//       phoneNo,
//       isVerified: true,
//     });
//     if (existingVerified) {
//       return res
//         .status(400)
//         .json({ message: "User already exists. Please log in." });
//     }

//     await ryvUsers.deleteMany({ phoneNo, isVerified: false });

//     const mobileOtp = crypto.randomInt(100000, 999999).toString();
//     const emailOtp = crypto.randomInt(100000, 999999).toString();
//     const otpExpiry = Date.now() + 3 * 60 * 1000;

//     const newUser = new ryvUsers({
//       name,
//       phoneNo,
//       email,
//       gender,
//       aadharNo,
//       pancard,
//       state,
//       city,
//       residenceAddress,
//       whatsappOtp: mobileOtp,
//       emailOtp,
//       otpExpiry,
//       dateOfBirth,
//       isVerified: false,
//     });

//     await newUser.save();

//     await sendWhatsappOtp(phoneNo, mobileOtp, name);
//     await sendOtpViaEmail(email, emailOtp);

//     return res.status(200).json({
//       message:
//         "OTP sent to your mobile and email. Please verify within 3 minutes.",
//     });
//   } catch (error) {
//     console.error("Error during registration:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };



//expection handle


const registerRyvUser = async (req, res) => {
  const {
    name,
    phoneNo,
    email,
    gender,
    aadharNo,
    pancard,
    state,
    city,
    residenceAddress,
    dateOfBirth,
  } = req.body;

  try {
    // ✅ 1. Field validation
    if (
      !name ||
      !phoneNo ||
      !email ||
      !gender ||
      !aadharNo ||
      !pancard ||
      !state ||
      !city ||
      !residenceAddress ||
      !dateOfBirth
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // ✅ 2. Format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/; // Indian 10-digit
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }
    if (!mobileRegex.test(phoneNo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number format.",
      });
    }

    // ✅ 3. Check for already verified user
    const existingVerified = await ryvUsers.findOne({
      phoneNo,
      isVerified: true,
    });
    if (existingVerified) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please log in.",
      });
    }

    // ✅ 4. Remove old unverified entries
    await ryvUsers.deleteMany({ phoneNo, isVerified: false });

    // ✅ 5. Generate OTPs
    const mobileOtp = crypto.randomInt(100000, 999999).toString();
    const emailOtp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 3 * 60 * 1000;

    // ✅ 6. Save user in DB
    const newUser = new ryvUsers({
      name,
      phoneNo,
      email,
      gender,
      aadharNo,
      pancard,
      state,
      city,
      residenceAddress,
      whatsappOtp: mobileOtp,
      emailOtp,
      otpExpiry,
      dateOfBirth,
      isVerified: false,
    });

    await newUser.save();

    // ✅ 7. Send OTPs safely
    try {
      await sendWhatsappOtp(phoneNo, mobileOtp, name);
    } catch (waErr) {
      console.error("WhatsApp OTP sending failed:", waErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send WhatsApp OTP. Please try again later.",
      });
    }

    try {
      await sendOtpViaEmail(email, emailOtp);
    } catch (emailErr) {
      console.error("Email OTP sending failed:", emailErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send Email OTP. Please try again later.",
      });
    }

    // ✅ 8. Success response
    return res.status(200).json({
      success: true,
      message:
        "OTP sent to your mobile and email. Please verify within 3 minutes.",
    });
  } catch (error) {
    console.error("Error during RYV registration:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};


// Verify OTP Function

const verifyOtpForRyvUser = async (req, res) => {
  const { phoneNo, whatsappotp, emailOtp } = req.body;

  if (!phoneNo || !whatsappotp || !emailOtp) {
    return res.status(400).json({
      message: "Phone number, mobile OTP, and email OTP are required.",
    });
  }

  try {
    const user = await ryvUsers.findOne({ phoneNo, isVerified: false });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or already verified." });
    }

    if (Date.now() > user.otpExpiry) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please register again." });
    }

    if (user.whatsappOtp !== whatsappotp) {
      return res.status(400).json({ message: "Mobile OTP is incorrect." });
    }

    if (user.emailOtp !== emailOtp) {
      return res.status(400).json({ message: "Email OTP is incorrect." });
    }

    user.isVerified = true;
    user.whatsappOtp = undefined;
    user.emailOtp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    const token = jwt.sign(
      { userId: user._id.toString() }, // ✅ Correct way
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "OTP verified successfully. User registered.",
      token,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { registerRyvUser, verifyOtpForRyvUser };
