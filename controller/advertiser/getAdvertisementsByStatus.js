const Adpost = require('../../models/advertismentPost/advertisementPost')


const getAdvertisementsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user._id;

    const filteredAds = await Adpost.find({ owner: userId, status });

    res.status(200).json(filteredAds);
  } catch (error) {
    console.error("Error fetching advertisements:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


const getAllAds = async (req, res) => {
  try {
    const userId = req.user._id;

    const allAds = await Adpost.find({ owner: userId});

    res.status(200).json(allAds);
  } catch (error) {
    console.error("Error fetching advertisements:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {getAdvertisementsByStatus, getAllAds}