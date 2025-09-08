const express = require("express");
const router = express.Router();

const {
  adminSetAdPrice,
  fbVideoUpload,
  acceptingAdTimeing,
} = require("../../../controller/admin/adminAdevertismentSection/adminSetAdPrice/adminSetAdPrice");
const {
  adminGetAds,
  approvedAds,
  rejectedAds,
  adminModifyAds,
  adminGetRunningAds,
} = require("../../../controller/admin/adminAdevertismentSection/adminGetAllAds/adminGetAds");
const freeAds = require("../../../controller/admin/freeAds/freeAds");
const {freeAdsUpload} = require("../../../middlewares/multer/multer")

const adminAuthenticate = require("../../../middlewares/adminAuthenticate/adminAuthenticate");
const verifyAdminAccess = require("../../../middlewares/adminAuthenticate/verifyAdminAccess");
const isSuperAdmin = require("../../../middlewares/adminAuthenticate/isSuperAdmin");

router.post(
  "/admin/priceset",
  adminAuthenticate,
  isSuperAdmin,
  adminSetAdPrice
);

router.post("/fb/video/upload", adminAuthenticate, isSuperAdmin, fbVideoUpload);

router.post(
  "/admin/set/approved/adtiming",
  adminAuthenticate,
  isSuperAdmin,
  acceptingAdTimeing
);

// Apply both middlewares per route
router.get(
  "/admin/get/all/ads",
  adminAuthenticate,
  verifyAdminAccess("advertisement"),
  adminGetAds
);

router.put(
  "/admin/advertisements/reject/:id",
  adminAuthenticate,
  verifyAdminAccess("advertisement"),
  rejectedAds
);

router.put(
  "/admin/advertisements/approve/:id",
  adminAuthenticate,
  verifyAdminAccess("advertisement"),
  approvedAds
);

router.put(
  "/admin/modify/ads/:adId",
  adminAuthenticate,
  verifyAdminAccess("advertisement"),
  adminModifyAds
);

router.get(
  "/admin/get/all/running/ads",
  adminAuthenticate,
  verifyAdminAccess("advertisement"),
  adminGetRunningAds
);

router.post(
  "/free/ads",
  adminAuthenticate,
  isSuperAdmin,
  freeAdsUpload,
  freeAds
);

module.exports = router;
