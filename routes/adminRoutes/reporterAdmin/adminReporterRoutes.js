const express = require("express");
const router = express.Router();

const getAllReporter = require("../../../controller/admin/adminReporterSection/adminGetAllReporter/getAllReporter");
const {
  generateCoupon,
  getAllCoupons,
  deleteCoupon
} = require("../../../controller/admin/adminReporterSection/adminGenrateCoupon/genrateCoupon");

const {
  getAllidCards,
  approveIdCardStatus,
  rejectIdCard,
  getApprovedCards,
  getRejectCards,
} = require("../../../controller/admin/adminReporterSection/adminGetIdCards/getAllidCards");

const {
  getCompletedAds,
  adminApproveAdsProof,
  adminRejectAdsProof,
  getFinalCompletedAds
} = require("../../../controller/admin/adminReporterSection/adminGetCompletedAds/getCompletedAds");

const adminAuthenticate = require("../../../middlewares/adminAuthenticate/adminAuthenticate");
const verifyAdminAccess = require("../../../middlewares/adminAuthenticate/verifyAdminAccess");
const isSuperAdmin = require("../../../middlewares/adminAuthenticate/isSuperAdmin");
const adminUpdateIdCard = require("../../../controller/admin/adminReporterSection/adminUpdateReporterIdCard/adminUpdateIdCard")
const {getAllWithdrawalRequests, rejectWithdrawal, approveWithdrawal} = require("../../../controller/admin/adminReporterSection/adminGetAllWithdrawRequest/getAllWithdrawalRequests");


//free ads
const {
  getPendingFreeAds,
  getApprovedFreeAds,
  getRunningFreeAds,
  getCompletedFreeAds,
} = require("../../../controller/admin/adminReporterSection/FreeAds/freeAdStatusAdmin")

const {proofAccept,proofReject} = require("../../../controller/admin/adminReporterSection/FreeAds/proofAcceptReject")


router.post("/genrate/coupon", adminAuthenticate, isSuperAdmin, generateCoupon);
router.get("/get/all/coupons",adminAuthenticate, isSuperAdmin, getAllCoupons);
router.delete("/delete/coupon/:id",adminAuthenticate,isSuperAdmin,deleteCoupon)

router.get(
  "/admin/get/all/reporter",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getAllReporter
);

router.get(
  "/admin/get/icards",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getAllidCards
);
router.put(
  "/idcards/approve/:id",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  approveIdCardStatus
);
router.put(
  "/idcards/reject/:id",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  rejectIdCard
);
router.get(
  "/get/approved/icards",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getApprovedCards
);
router.get(
  "/get/rejected/icards",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getRejectCards
);

router.get(
  "/admin/get/completed/ads",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getCompletedAds
);

router.put(
  "/admin/approve/completed/ad",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  adminApproveAdsProof
);

router.put(
  "/admin/reject/completed/ad",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  adminRejectAdsProof
);

router.get(
  "/admin/get/withdrawals/requests",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getAllWithdrawalRequests
);

router.put(
  "/admin/withdrawals/approve/:id",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  approveWithdrawal
);

router.put("/admin/withdrawals/:id/reject",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  rejectWithdrawal
);

router.put("/admin/update/reporter/id/card/:id",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  adminUpdateIdCard
);

router.get("/admin/get/final/completed/ads",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getFinalCompletedAds
)


//free Ad section

router.get("/admin/get/pending/free/ad",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getPendingFreeAds,
)
router.get("/admin/get/approved/free/ad",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getApprovedFreeAds,
)
router.get("/admin/get/running/free/ad",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getRunningFreeAds,
)
router.get("/admin/get/completed/free/ad",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  getCompletedFreeAds,
)

router.put("/admin/accept/free/ad/proof",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  proofAccept
)

router.put("/admin/reject/free/ad/proof",
  adminAuthenticate,
  verifyAdminAccess("reporter"),
  proofReject
)

module.exports = router;
