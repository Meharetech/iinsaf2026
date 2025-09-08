const Adpost = require("../../models/advertismentPost/advertisementPost");

const getAcceptedAds = async (req, res) => {
  try {
    const reporterId = req.user._id;

    const matchedAds = await Adpost.find({
      acceptRejectReporterList: {
        $elemMatch: {
          reporterId: reporterId,
          accepted: true,
          adProof: false // ✅ Only show if adProof is still false
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "Ads fetched where reporter has accepted and not yet submitted proof",
      data: matchedAds
    });

  } catch (error) {
    console.error("Error fetching accepted ads:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching ads"
    });
  }
};


const getRejectedAds = async(req,res)=>{

    try {
        const reporterId = req.user._id;

        const matchedAds = await Adpost.find({
            acceptRejectReporterList: {
                $elemMatch: {
                    reporterId: reporterId,
                    accepted: false
                }

            }
        });

        res.status(200).json({
            success: true,
            message: "Ads fetched where reporter has responded",
            data: matchedAds
        });

    } catch (error) {
        console.error("Error fetching rejected ads:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching ads"
        });
    }

}

module.exports = {getAcceptedAds, getRejectedAds}
