import { Router } from "express";

import {
  getUserInfo,
  protect,
  withDraw,
  transferMoney,
  getMinimumWithDrawal,
  getUserBets,
  getAllBets,
  getUserTransaction,
  userReferralPerLevel,
} from "../controllers/userController.js";
import { deleteAllBets } from "../controllers/aviatorController.js";
import { hackedUser } from "../prisma/prisma.js";
import {
  depositFunds,
  performWithdrawal,
} from "../controllers/gatewayController.js";
const router = Router();

// ==== routes setup =====
router
  .get("/getUserInfo", protect, getUserInfo)
  .post("/withdraw", protect, withDraw)
  .post("/transfer", protect, transferMoney)
  .get("/minwl", protect, getMinimumWithDrawal)
  .get("/getmybets", protect, getUserBets)
  .get("/getallbets", protect, getAllBets)
  .delete("/deleteallbets", deleteAllBets)
  .put("/hacked", hackedUser)
  .get("/mlmtree", protect, userReferralPerLevel);

// crypto addition
router
  .post("/depositfunds", protect, depositFunds)
  .post("/withdrawfunds", protect, performWithdrawal)
  .get("/alltransaction", protect, getUserTransaction);
export { router };
