import { Router } from "express";
import { protect } from "../controllers/userController.js";
import { adminProtect } from "../controllers/adminAuthController.js";
import {
  allGamesHistory,
  betWinGo,
  currentGameLiveStats,
  currentRoundBets,
  getAllBets,
  getCurrentGame,
  getSingleUserBetsHistory,
  setGameResult,
} from "../controllers/wingoController.js";
const router = Router();
import { defaultPagination } from "./../utils/defaultPagination.js";
// ==== routes setup =====
router
  .post("/bet", protect, betWinGo)
  .get("/currentgame", getCurrentGame)
  .get("/allbets", defaultPagination, getAllBets)
  .get("/mybets", protect, defaultPagination, getSingleUserBetsHistory)
  .get("/gamehistory", defaultPagination, allGamesHistory)
  .get("/wingogamestats", currentGameLiveStats)
  .post("/wingoresult", adminProtect, setGameResult)
  .get("/curroundbets", defaultPagination, currentRoundBets);
export { router };
