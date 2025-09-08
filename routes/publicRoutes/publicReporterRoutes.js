const express = require("express");
const router = express.Router();

const {
  getPublicReporters,
  getPublicReporterById,
  getPublicReportersByLocation
} = require("../../controller/public/publicGetReporter");

// Public routes - No authentication required

// GET /api/public/reporters - Get all verified reporters
router.get("/reporters", getPublicReporters);

// GET /api/public/reporters/:reporterId - Get specific reporter by ID
router.get("/reporters/:reporterId", getPublicReporterById);

// GET /api/public/reporters/location?state=Delhi&city=New Delhi - Get reporters by location
router.get("/reporters/location", getPublicReportersByLocation);

module.exports = router;
