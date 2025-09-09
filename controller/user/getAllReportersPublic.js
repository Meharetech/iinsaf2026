const User = require('../../models/userModel/userModel');

/**
 * Get all reporter details - Public API (No authentication required)
 * @route GET /user/reporter
 * @access Public
 */
const getAllReportersPublic = async (req, res) => {
  try {
    // Find all users with role 'Reporter' (both verified and unverified)
    const reporters = await User.find({ 
      role: 'Reporter'
    }).select({
      _id: 1,
      name: 1,
      email: 1,
      mobile: 1,
      state: 1,
      city: 1,
      gender: 1,
      dateOfBirth: 1,
      isVerified: 1,
      verifiedReporter: 1,
      // Exclude sensitive information like password, aadhar, etc.
    }).sort({ createdAt: -1 });

    // Check if any reporters found
    if (!reporters || reporters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reporters found',
        data: []
      });
    }

    // Return success response with reporter data
    res.status(200).json({
      success: true,
      message: 'All reporters fetched successfully',
      count: reporters.length,
      data: reporters
    });

  } catch (error) {
    console.error('Error fetching public reporter details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reporter details',
      error: error.message
    });
  }
};

module.exports = getAllReportersPublic;

