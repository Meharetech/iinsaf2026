const genrateIdCard = require("../../../../models/reporterIdGenrate/genrateIdCard");

const adminUpdateIdCard = async (req, res) => {
  const { id } = req.params;

  // Start with basic fields
  const updateFields = {
    name: req.body.name,
    designation: req.body.designation,
    email: req.body.email,
    mobileNo: req.body.mobileNo,
    aadharNo: req.body.aadharNo,
    bloodGroup: req.body.bloodGroup,
    dateOfBirth: req.body.dateOfBirth,
    channelName: req.body.channelName,
    channelType: req.body.channelType,
    plateform: req.body.plateform,
    ResidentialAddress: req.body.ResidentialAddress,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
  };

  // ✅ Safely parse channelLinks
  if (req.body.channelLinks) {
    try {
      updateFields.channelLinks = JSON.parse(req.body.channelLinks);
    } catch (err) {
      return res.status(400).json({
        message: "Invalid format for channelLinks",
      });
    }
  }

  try {
    const updatedCard = await genrateIdCard.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: "ID card not found." });
    }

    return res.status(200).json({
      message: "ID card updated successfully.",
      updatedCard,
    });
  } catch (error) {
    console.error("Error updating ID card:", error);
    return res.status(500).json({ message: "Server error while updating ID card." });
  }
};

module.exports = adminUpdateIdCard;
