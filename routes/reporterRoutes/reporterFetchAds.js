const express = require("express");
const router = express.Router();


//regular Ads
const reporterGetAllAds = require('../../controller/reporter/reporterGetAllAds')
const userAuthenticate = require('../../middlewares/userAuthenticate/userAuthenticate')
const createIdCard = require('../../controller/reporter/createIdCard')
const { reporterIdCardUpload } = require('../../middlewares/multer/multer')
const getIdCad = require("../../controller/reporter/getIdCard")
const {acceptAd , rejectAd} = require("../../controller/reporter/reporterAcceptOrRejectAd")
const {getAcceptedAds,getRejectedAds} = require("../../controller/reporter/getAcceptedAds")
const {reporterProofUpload} = require("../../middlewares/multer/multer")
const {submitAdProof, reporterGetRunningAds, reporterGetCompletedAds} = require("../../controller/reporter/submitAdProof")
const qrProfile = require("../../controller/reporter/qrProfile")
const checkVideosView = require("../../controller/reporter/checkVideosView")
const submitComplitedAds = require('../../controller/reporter/submitComplitedAds')
const reporterWithdrawal = require('../../controller/wallets/reporterWithdrawal')
const getTodaysApprovedAds =require("../../controller/reporter/getTodaysApprovedAds")
const checkIdCard = require("../../controller/reporter/checkIdCard")


//Free ads
const getfreeAds = require("../../controller/reporter/freeAds/getFreeAds")
const acceptFreeAd = require("../../controller/reporter/freeAds/acceptFreeAd")
const {getFreeAcceptedAds,reporterGetFreeRunningAds} = require('../../controller/reporter/freeAds/getFreeAcceptedAds')
const uploadFreeAdProof = require('../../controller/reporter/freeAds/uploadFreeAdProof')
const reporterGetRejectedAds = require('../../controller/reporter/freeAds/reporterGetRejectedAds')
const getFreeCompletedAds = require("../../controller/reporter/freeAds/getFreeCompletedAds")
const deleteMyProof = require("../../controller/reporter/freeAds/deleteMyProof")


// Raise your voice ads
const {getApprovedAdsForReporter,submitReporterProof, reporterAcceptRyvAd, reporterRejectRyvAd, reporterGetAcceptedRyvAd, updateProof, getRejectedAdsForReporter, getReporterRyvAdCounts} = require("../../controller/reporter/raiseYourVoice/getVoiceByStatus")


// regular dashboard stats
const getReporterAdCounts = require("../../controller/reporter/reporterDashboradStas")


// free ads dashboard stats
const getFreeAdCounts = require("../../controller/reporter/freeAds/freeAdStats")


//regular Ads Routes

router.post('/reporter/create/icard',reporterIdCardUpload,userAuthenticate,createIdCard);
router.get('/reporter/get/icard',userAuthenticate,getIdCad)
router.get('/reporter/get/new/ads',userAuthenticate,reporterGetAllAds)
router.put('/ad/accepted/:adId',userAuthenticate,acceptAd);
router.put('/ad/rejected/:adId',userAuthenticate,rejectAd)
router.get('/get/accepted/ads',userAuthenticate,getAcceptedAds);
router.get('/get/rejected/ads',userAuthenticate,getRejectedAds)
router.post('/reporter/submit/proof',userAuthenticate,reporterProofUpload,submitAdProof)
router.get('/reporter/get/running/ads',userAuthenticate,reporterGetRunningAds);
router.get('/reporter/get/completed/ads',userAuthenticate,reporterGetCompletedAds)
router.post('/reporter/submit/completed/ad',userAuthenticate,reporterProofUpload,submitComplitedAds)
router.post("/wallet/withdraw", userAuthenticate, reporterWithdrawal);
router.post('/check/current/view',checkVideosView)

router.get("/check/idcard", userAuthenticate, checkIdCard);

//when anyone can scan the qr for seeing reporter's profile 
router.get("/reporter/view/:id",qrProfile)
// public route for first time video will uploaded automaticly to iinsaf youtube channel
router.get("/ads/approved-today", getTodaysApprovedAds);

// reporter get regular ads dashboard stats
router.get("/reporter/get/dashboard/stats",userAuthenticate,getReporterAdCounts)


//free ad section

router.get('/new/free/ad',userAuthenticate,getfreeAds)
router.put('/free/ad/accepted/:adId',userAuthenticate,acceptFreeAd)
router.get('/get/free/accepted/ads',userAuthenticate,getFreeAcceptedAds);
router.post('/reporter/submit/proof/free/ad',userAuthenticate,reporterProofUpload,uploadFreeAdProof)
router.get('/reporter/get/running/free/ads',userAuthenticate,reporterGetFreeRunningAds)
router.get('/reporter/get/rejected/ads',userAuthenticate,reporterGetRejectedAds)
router.get('/reporter/get/completed/free/ads',userAuthenticate,getFreeCompletedAds)
router.delete('/reporter/delete/proof/:adId',userAuthenticate,deleteMyProof)

router.get("/reporter/get/free/ad/stats",userAuthenticate,getFreeAdCounts)




//Raise your voice section

router.get("/reporter/get/new/voice",userAuthenticate,getApprovedAdsForReporter)
router.get("/reporter/get/accepted/ryv/ads",userAuthenticate,reporterGetAcceptedRyvAd)
router.post("/reporter/ryv/post/submit/proof",userAuthenticate,submitReporterProof)
router.put("/reporter/accept/ryv/ad/:adId",userAuthenticate,reporterAcceptRyvAd)
router.put("/reporter/reject/ryv/ad/:adId",userAuthenticate,reporterRejectRyvAd)
router.get("/reporter/get/rejected/ryv/ads",userAuthenticate,getRejectedAdsForReporter)
router.put('/reporter/update/proof/:adId',userAuthenticate,updateProof)
router.get('/reporter/get/ryv/stats',userAuthenticate,getReporterRyvAdCounts)


module.exports = router