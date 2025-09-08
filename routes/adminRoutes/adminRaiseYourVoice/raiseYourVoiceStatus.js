const express = require("express");
const router = express.Router();

const adminAuthenticate = require("../../../middlewares/adminAuthenticate/adminAuthenticate");

const {
  getUnderReviewRyvAds,
  approveRyvAd,
  rejectRyvAd,
  getRunningRyvAds,
  getApprovedRyvAds,
  adminGetRejectedProofs,
  adminRejectTheProof,
  adminAcceptTheProof,
  getRyvAdsStatsForAdmin
} = require("../../../controller/admin/adminRaiseYourVoice/raiseYourVoiceByStatus");


router.get("/admin/get/new/ryv/ads", adminAuthenticate, getUnderReviewRyvAds);
router.put("/admin/approve/ryv/ad/:adId", adminAuthenticate, approveRyvAd);
router.get("/admin/get/approved/ads",adminAuthenticate,getApprovedRyvAds)
router.put("/admin/reject/ryv/ad/:adId", adminAuthenticate, rejectRyvAd);
router.get("/admin/get/running/ryv/ads", adminAuthenticate, getRunningRyvAds);
router.get("/admin/get/rejected/ads/by/reporter",adminAuthenticate,adminGetRejectedProofs)
router.put("/admin/accept/proof/:adId/:reporterId",adminAuthenticate,adminAcceptTheProof)
router.put("/admin/reject/proof/:proofId",adminAuthenticate,adminRejectTheProof)
router.get("/admin/get/all/ryv/ad/stats",adminAuthenticate,getRyvAdsStatsForAdmin)
module.exports = router;
