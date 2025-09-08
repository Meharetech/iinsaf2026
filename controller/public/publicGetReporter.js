const User = require("../../models/userModel/userModel");
const genrateIdCard = require("../../models/reporterIdGenrate/genrateIdCard");

const getPublicReporters = async (req, res) => {
  try {
    // Get all users with role "Reporter" and verified status
    const reporters = await User.find({ 
      role: "Reporter",
      isVerified: true,
      verifiedReporter: true 
    }).select({
      name: 1,
      email: 1,
      mobile: 1,
      state: 1,
      city: 1,
      residenceaddress: 1,
      pincode: 1,
      gender: 1,
      bloodType: 1,
      dateOfBirth: 1,
      createdAt: 1,
      _id: 1
    });

    // Get ID card details for each reporter
    const reportersWithIdCards = await Promise.all(
      reporters.map(async (reporter) => {
        const idCard = await genrateIdCard.findOne({ 
          reporter: reporter._id,
          status: "Approved" 
        }).select({
          channelName: 1,
          channelType: 1,
          plateform: 1,
          channelLinks: 1,
          image: 1,
          channelLogo: 1,
          iinsafId: 1,
          issuedDate: 1,
          validUpto: 1,
          status: 1
        });

        return {
          ...reporter.toObject(),
          idCard: idCard || null
        };
      })
    );

    // Filter out reporters without approved ID cards if needed
    const verifiedReporters = reportersWithIdCards.filter(reporter => reporter.idCard !== null);

    res.status(200).json({
      success: true,
      message: "Reporters fetched successfully",
      count: verifiedReporters.length,
      data: verifiedReporters
    });

  } catch (error) {
    console.error("Error fetching public reporters:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reporters",
      error: error.message
    });
  }
};

const getPublicReporterById = async (req, res) => {
  try {
    const { reporterId } = req.params;

    if (!reporterId) {
      return res.status(400).json({
        success: false,
        message: "Reporter ID is required"
      });
    }

    // Get reporter details
    const reporter = await User.findOne({ 
      _id: reporterId,
      role: "Reporter",
      isVerified: true,
      verifiedReporter: true 
    }).select({
      name: 1,
      email: 1,
      mobile: 1,
      state: 1,
      city: 1,
      residenceaddress: 1,
      pincode: 1,
      gender: 1,
      bloodType: 1,
      dateOfBirth: 1,
      createdAt: 1,
      _id: 1
    });

    if (!reporter) {
      return res.status(404).json({
        success: false,
        message: "Reporter not found or not verified"
      });
    }

    // Get ID card details
    const idCard = await genrateIdCard.findOne({ 
      reporter: reporter._id,
      status: "Approved" 
    }).select({
      channelName: 1,
      channelType: 1,
      plateform: 1,
      channelLinks: 1,
      image: 1,
      channelLogo: 1,
      iinsafId: 1,
      issuedDate: 1,
      validUpto: 1,
      status: 1
    });

    if (!idCard) {
      return res.status(404).json({
        success: false,
        message: "Reporter ID card not found or not approved"
      });
    }

    const reporterWithIdCard = {
      ...reporter.toObject(),
      idCard: idCard
    };

    res.status(200).json({
      success: true,
      message: "Reporter details fetched successfully",
      data: reporterWithIdCard
    });

  } catch (error) {
    console.error("Error fetching reporter by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reporter details",
      error: error.message
    });
  }
};

const getPublicReportersByLocation = async (req, res) => {
  try {
    const { state, city } = req.query;

    let filter = {
      role: "Reporter",
      isVerified: true,
      verifiedReporter: true
    };

    if (state) {
      filter.state = new RegExp(state, 'i'); // Case insensitive search
    }

    if (city) {
      filter.city = new RegExp(city, 'i'); // Case insensitive search
    }

    // Get reporters by location
    const reporters = await User.find(filter).select({
      name: 1,
      email: 1,
      mobile: 1,
      state: 1,
      city: 1,
      residenceaddress: 1,
      pincode: 1,
      gender: 1,
      bloodType: 1,
      dateOfBirth: 1,
      createdAt: 1,
      _id: 1
    });

    // Get ID card details for each reporter
    const reportersWithIdCards = await Promise.all(
      reporters.map(async (reporter) => {
        const idCard = await genrateIdCard.findOne({ 
          reporter: reporter._id,
          status: "Approved" 
        }).select({
          channelName: 1,
          channelType: 1,
          plateform: 1,
          channelLinks: 1,
          image: 1,
          channelLogo: 1,
          iinsafId: 1,
          issuedDate: 1,
          validUpto: 1,
          status: 1
        });

        return {
          ...reporter.toObject(),
          idCard: idCard || null
        };
      })
    );

    // Filter out reporters without approved ID cards
    const verifiedReporters = reportersWithIdCards.filter(reporter => reporter.idCard !== null);

    res.status(200).json({
      success: true,
      message: "Reporters fetched successfully",
      count: verifiedReporters.length,
      filters: { state, city },
      data: verifiedReporters
    });

  } catch (error) {
    console.error("Error fetching reporters by location:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reporters by location",
      error: error.message
    });
  }
};

module.exports = {
  getPublicReporters,
  getPublicReporterById,
  getPublicReportersByLocation
};
