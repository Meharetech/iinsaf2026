const express = require("express");
const router = express.Router();

// Import the public reporter controller
const getAllReportersPublic = require('../../controller/user/getAllReportersPublic');

// Public routes (no authentication required)
router.get("/user/reporter", getAllReportersPublic);

module.exports = router;

