import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/isAdmin";
import { applyToJob, exportApplicationsExcel, getApplicationsForJob, getMyApplications } from "../controllers/applicationController";
const router = express.Router();

const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>{
    Promise.resolve(fn(req, res, next)).catch(next);
}


router.post("/apply/:jobId", protect, asyncHandler(applyToJob));
router.get("/", protect, asyncHandler(getMyApplications));
router.get("/job/:jobId", protect, isAdmin, asyncHandler(getApplicationsForJob));
router.get("/export-applications/:jobId", protect, isAdmin, asyncHandler(exportApplicationsExcel));

export default router;

//http://localhost:3000/api/applications/export-applications/05ce1d30-7e93-452f-98d8-bd01518fe415