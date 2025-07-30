import { Router } from "express";
import {
  placeBet,
  placeBet2,
  totalSumAmount,
  withdrawBet,
} from "../controllers/aviatorController.js";
import { protect } from "../controllers/userController.js";
const router = Router();

// ==== routes setup =====
router.post("/place", protect,placeBet);
router.post("/place2", protect,placeBet2);
router.post("/withdraw",protect, withdrawBet);
router.get("/getallamount", protect,totalSumAmount);

export { router };
