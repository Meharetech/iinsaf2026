const User = require("../../models/userModel/userModel");
const nodemailer = require("nodemailer"); // make sure it's installed
const crypto = require("crypto"); // optional if you want to use secure OTP
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // or your own hash function


const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

    // 3. Save OTP and expiry (valid for 15 mins)
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // 4. Send email using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // or use your SMTP config
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP to reset your password is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to your email" });

  } catch (error) {
    console.error("Forget password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};






const verifyOtpAndResetPassword = async (req, res) => {
  const { email, otp } = req.body;

  console.log("in verifyOtpOnly", req.body);

  try {
    const user = await User.findOne({
      email,
      resetOTP: otp,
      resetOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ OTP is correct. Don't reset password yet.
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP verify error:", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};





const resendOtp = async (req, res) => {
  const { email } = req.body;

    console.log("in resend otp function",req.body);
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update OTP and expiry time
    user.resetOTP = newOtp;
    user.resetOTPExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: '"Your App Name" <no-reply@yourapp.com>',
      to: email,
      subject: "Resent Password Reset OTP",
      text: `Your new OTP to reset your password is: ${newOtp}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "New OTP has been sent to your email" });

  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};





const setNewPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Update password and clear OTP
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ message: "Password updated", token });
  } catch (error) {
    console.error("Set new password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



const verifyOldPassword = async (req, res) => {
  try {
    const { oldPassword } = req.body;
    const userId = req.userId; // ✅ userAuthenticate must set req.userId

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    res.status(200).json({ message: "Old password verified. Please enter new password." });
  } catch (error) {
    res.status(500).json({ message: "Server error verifying old password", error: error.message });
  }
};




const updatePassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword } = req.body;
    const userId = req.userId;

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "Both password fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error updating password", error: error.message });
  }
};





module.exports = {forgetPassword, verifyOtpAndResetPassword, resendOtp, setNewPassword, verifyOldPassword, updatePassword}
