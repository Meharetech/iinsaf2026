const AdPricing = require("../../../../models/adminModels/advertismentPriceSet/adPricingSchema");

const adminSetAdPrice = async (req, res) => {
  try {

    const {
      adType,
      plateforms,
      channelType,
      gstRate,
      perDayPrice,
      perSecPrice,
      baseView,
      perCityPrice,
      adCommission
    } = req.body;

    // Build update object only with provided (non-undefined) fields
    const updateFields = {};

    if (adType !== undefined) updateFields.adType = adType;
    if (channelType !== undefined) updateFields.channelType = channelType;
    if (plateforms !== undefined) updateFields.plateforms = plateforms;
    if (gstRate !== undefined) updateFields.gstRate = gstRate;
    if (perDayPrice !== undefined) updateFields.perDayPrice = perDayPrice;
    if (perSecPrice !== undefined) updateFields.perSecPrice = perSecPrice;
    if (baseView !== undefined) updateFields.baseView = baseView;
    if (perCityPrice !== undefined) updateFields.perCityPrice = perCityPrice;
    if (adCommission !== undefined) updateFields.adCommission = adCommission;

    const pricing = await AdPricing.findOneAndUpdate(
      {}, // condition (single global config)
      { $set: updateFields }, // only update non-empty fields
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: "Ad pricing updated", data: pricing });
  } catch (error) {
    console.error("Error in adminSetAdPrice:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const fbVideoUpload = async (req, res) => {
  const { fbLink } = req.body;

  if (!fbLink) {
    return res.status(400).json({ success: false, message: "Link not uploaded" });
  }

  try {
    const updatedDoc = await AdPricing.findOneAndUpdate(
      {}, // match global singleton config
      { $set: { fbVideoUploadLink: fbLink } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: "FB video link saved", data: updatedDoc });
  } catch (error) {
    console.error("Error in fbVideoUpload:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const acceptingAdTimeing = async (req, res)=>{

  const {hours} =req.body

  if (!hours || isNaN(hours) || Number(hours) <= 0) {
  return res.status(400).json({ success: false, message: "Valid time (in hours) must be provided" });
}

  try{
    const updateDoc = await AdPricing.findOneAndUpdate(
      {},
      {$set: {reporterAcceptTimeInHours: hours}},
      {new: true, upsert: true}
    );

    res.status(200).json({success: true, message: "Time is set successfully for accepting ads", data: updateDoc})
  }
  catch(error)
  {
    console.error("Error while adding accepting ad time");
    res.status(500).json({success: false, message: "Server error"})
  }

}




module.exports = {adminSetAdPrice,fbVideoUpload, acceptingAdTimeing}
