const User = require("../../../models/userModel/userModel"); 
const RyvUsers = require("../../../models/userModel/RaiseYourVoiceModel/raiseYourVoiceUsers"); 

// ✅ 1. Get Raise Your Voice users
const getRaiseYourVoiceUsers = async (req, res) => {
  try {
    const users = await RyvUsers.find();
    res.status(200).json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching Raise Your Voice users", error: err.message });
  }
};

// ✅ 2. Get all users (with details)
const getTotalUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching total users", error: err.message });
  }
};

// ✅ 3. Get all advertisers (with details)
const getTotalAdvertisers = async (req, res) => {
  try {
    const advertisers = await User.find({ role: "Advertiser" });
    res.status(200).json({ count: advertisers.length, advertisers });
  } catch (err) {
    res.status(500).json({ message: "Error fetching advertisers", error: err.message });
  }
};

// ✅ 4. Get unverified reporters (with details)
const getUnverifiedReporters = async (req, res) => {
  try {
    const unverifiedReporters = await User.find({ role: "Reporter", verifiedReporter: false });
    res.status(200).json({ count: unverifiedReporters.length, unverifiedReporters });
  } catch (err) {
    res.status(500).json({ message: "Error fetching unverified reporters", error: err.message });
  }
};

module.exports = {
  getRaiseYourVoiceUsers,
  getTotalUsers,
  getTotalAdvertisers,
  getUnverifiedReporters
};
