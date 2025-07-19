import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/isAdmin";
import {
  createJob,
  deleteJob,
  getAllJobs,
  getJobById,
  updateJob,
} from "../controllers/jobController";
import { upload } from "../middlewares/multer";

const router = express.Router();

const asyncHandler =
  (fn: any) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.get("/", asyncHandler(getAllJobs));
router.get("/:id", asyncHandler(getJobById));

router.post(
  "/",
  protect,
  isAdmin,
  upload.single("companyLogo"),
  asyncHandler(createJob)
);
router.put(
  "/:id",
  protect,
  isAdmin,
  upload.single("companyLogo"),
  asyncHandler(updateJob)
);
router.delete("/:id", protect, isAdmin, asyncHandler(deleteJob));

export default router;
