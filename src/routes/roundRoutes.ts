import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/isAdmin";
import {
  uploadRoundResults,
  getUserRoundResults,
  getJobRoundSummary,
} from "../controllers/roundController";

const router = express.Router();

router.post("/upload", protect, isAdmin, uploadRoundResults);
router.get("/user/:userId", protect, getUserRoundResults);
router.get("/job/:jobId", protect, isAdmin, getJobRoundSummary);

export default router;
