const bcrypt = require("bcrypt");
// const crypto = require("crypto");
const nodemailer = require("nodemailer");
const axios = require("axios");
const User = require("../../models/userModel/userModel");
const jwt = require("jsonwebtoken");

// const loginUser = async (req, res) => {
//   const { emailOrMobile, password } = req.body;
//   console.log("credentional for login", req.body);

//   try {
//     let user;
//     const identifier = String(emailOrMobile); // Ensure emailOrMobile is a string
//     if (identifier.includes("@")) {
//       user = await User.findOne({ email: identifier });
//     } else {
//       user = await User.findOne({ mobile: Number(identifier) });
//     }

//     if (!user) {
//       console.log("user not found");
//       return res.status(400).json({ msg: "Invalid Credentials" });
//     }

//     if (!user.isVerified) {
//       console.log("user not verified");
//       return res.status(400).json({
//         msg: "Account not verified. Please verify your account before logging in.",
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       console.log("password not match");
//       return res.status(400).json({ msg: "Invalid Credentials" });
//     }

//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       secure: true,
//     });

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: user.email,
//       subject: "Login Notification",
//       text: `Hello ${user.name},\n\nYou have successfully logged into your account.\n\nBest Regards,\nIinsaf`,
//     };

//     const mobile = user.mobile;
//     const name = user.name;
//     const template = "login_msg";

//     sendOtpViaWATemplate(mobile, name, template);
//     transporter.sendMail(mailOptions);

//     // Return JWT token with role information
//     const payload = {
//       userId: {
//         id: user._id,
//       },
//       role: user.role,
//     };

//     jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
//       if (err) throw err;
//       res.json({ 
//         token, 
//         role: user.role,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role
//         }
//       });
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server error");
//   }
// };





//exception handle



const loginUser = async (req, res) => {
  const { emailOrMobile, password } = req.body;
  console.log("Credentials for login:", req.body);

  try {
    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Mobile and password are required",
      });
    }

    const identifier = String(emailOrMobile).trim();
    let user;

    // ✅ Email vs Mobile detection
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;

    if (emailRegex.test(identifier)) {
      user = await User.findOne({ email: identifier });
    } else if (mobileRegex.test(identifier)) {
      user = await User.findOne({ mobile: Number(identifier) });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid email or mobile format",
      });
    }

    // ✅ Check user existence
    if (!user) {
      console.log("User not found");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ✅ Check verification
    if (!user.isVerified) {
      console.log("User not verified");
      return res.status(400).json({
        success: false,
        message:
          "Account not verified. Please verify your account before logging in.",
      });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ✅ Try sending notifications safely
    try {
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        secure: true,
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Login Notification",
        text: `Hello ${user.name},\n\nYou have successfully logged into your account.\n\nBest Regards,\nIinsaf`,
      };

      transporter.sendMail(mailOptions).catch((err) => {
        console.error("Email notification failed:", err.message);
      });

      sendOtpViaWATemplate(user.mobile, user.name, "login_msg").catch((err) => {
        console.error("WhatsApp notification failed:", err.message);
      });
    } catch (notifyErr) {
      console.error("Notification error:", notifyErr.message);
    }

    // ✅ Return JWT token with role information
    const payload = {
      userId: {
        id: user._id,
      },
      role: user.role,
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) {
          console.error("JWT signing error:", err.message);
          return res.status(500).json({
            success: false,
            message: "Authentication failed. Please try again.",
          });
        }

        res.json({
          success: true,
          token,
          role: user.role,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};



const sendOtpViaWATemplate = async (mobile, userName, campaignName) => {
  try {
    console.log("Sending WhatsApp login notification:", mobile, userName, campaignName);

    const apiKey = process.env.AISENSY_API_KEY;

    const response = await axios.post("https://backend.aisensy.com/campaign/t1/api/v2", {
      apiKey,
      campaignName,
      destination: `91${mobile}`,
      userName,
      templateParams: [userName], // must match your template setup in AiSensy
      paramsFallbackValue: { FirstName: userName },
    });

    console.log("WhatsApp notification sent successfully:", response.data);
    return response.data;

  } catch (error) {
    console.error("Error sending WhatsApp login notification:", error?.response?.data || error.message);
    throw new Error("Failed to send WhatsApp notification");
  }
};


module.exports = loginUser;
