import { Router } from "express";
import {
  setReferDetatails,
  getAllBetData,
  getAllUserData,
  getAllWithdrawalRequest,
  acceptWithdraw,
  userSettings,
  getAllRechargeDetails,
  getReferDetails,
  getDashBoardDetails,
  getCurrentRoundBets,
  getAllNormalRechargeDetails,
  acceptRecharge,
  createBonusValue,
  getAllBonus,
  deleteBonus,
  allTransaction,
  adminReferralPerLevel,
  allUserBetData,
} from "../controllers/adminController.js";
import { defaultPagination } from "../utils/defaultPagination.js";
import {
  crashedPlaneSettings,
  getCrashedPlaneSettings,
} from "../controllers/aviatorController.js";
// import {
//   getPaymentDetails,
//   setGatewayKey,
//   getTransectionDetails,
//   setAdminAccount,
//   getAdminBankDetails,
//   getGatewayKey,
//   setPaymentGateWay,
// } from "../controllers/gatewayController.js";
import {
  adminProtect,
  changepassword,
  createAdminAccount,
  login,
} from "../controllers/adminAuthController.js";
const router = Router();

// ==== routes setup =====
router
  .post("/setrefer", adminProtect, setReferDetatails)
  .get("/allbetdata", adminProtect, defaultPagination, getAllBetData)
  .get("/alluserbetdata", adminProtect, defaultPagination, allUserBetData)
  .get("/alluserdata", adminProtect, defaultPagination, getAllUserData)
  .get(
    "/allwithdrawalrequest",
    adminProtect,
    defaultPagination,
    getAllWithdrawalRequest
  )
  .post("/acceptwithdraw", adminProtect, acceptWithdraw)
  .post("/usersettings", adminProtect, userSettings)
  .get(
    "/getallrecharge",
    adminProtect,
    defaultPagination,
    getAllRechargeDetails
  )
  .post("/crashed", adminProtect, crashedPlaneSettings)
  .get("/getcrashed", adminProtect, getCrashedPlaneSettings)
  .get("/getreferdetails", adminProtect, getReferDetails)
  .get("/dashboard", adminProtect, getDashBoardDetails)
  .post("/createbonus", adminProtect, createBonusValue)
  .get("/getallbonus", adminProtect, getAllBonus)
  .delete("/deletebonus", adminProtect, deleteBonus);

// gatewayController
router
  // .get("/getpaymentdetails", getPaymentDetails, getTransectionDetails)
  // .post("/setadminaccount", uploadBarCode, setAdminAccount)
  // .post("/setgateway", setGatewayKey)
  // .get("/getadminbank", getAdminBankDetails)
  // .get("/getgatewaykey", getGatewayKey)
  .get("/getcurrentbet", adminProtect, getCurrentRoundBets)
  .get(
    "/getnormalrechargedetails",
    adminProtect,
    defaultPagination,
    getAllNormalRechargeDetails
  )
  .post("/acceptrecharge", adminProtect, acceptRecharge)
  .get("/allsingleusertransaction", defaultPagination, allTransaction)
  .get("/adminmlmtree", adminReferralPerLevel);
// crypto addition
// login and changepassword
router
  .post("/login", login)
  .post("/changepassword", changepassword)
  .post("/register", createAdminAccount);
export { router };
