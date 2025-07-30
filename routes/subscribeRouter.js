import { Router } from "express";
import { subscribed } from "../controllers/subscribeController.js";

const router = Router();

router.post("/subscribe", subscribed);

export { router };
