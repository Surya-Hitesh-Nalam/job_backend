import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/isAdmin";
import { applyToJob, getApplicationsForJob, getMyApplications } from "../controllers/applicationController";
const router = express.Router();

const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>{
    Promise.resolve(fn(req, res, next)).catch(next);
}


router.post("/apply/:jobId", protect, asyncHandler(applyToJob));
router.get("/", protect, asyncHandler(getMyApplications));
router.get("/job/:jobId", protect, isAdmin, asyncHandler(getApplicationsForJob));

export default router;
