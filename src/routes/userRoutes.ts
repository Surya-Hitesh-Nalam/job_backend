import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { 
  login, 
  logout, 
  requestPasswordOtp, 
  resetPassword, 
  signup, 
  updateProfile, 
  verifyEmail,
  getProfile,  
  getAllUsers,
  getAdminDashboard
} from "../controllers/userController";
import { isAdmin } from "../middlewares/isAdmin";
import { upload } from "../middlewares/multer";

const router = express.Router();

const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/signup", asyncHandler(signup));
router.post("/verify-email", asyncHandler(verifyEmail));
router.post("/login", asyncHandler(login));
router.post("/request-password-otp", asyncHandler(requestPasswordOtp));
router.post("/reset-password", asyncHandler(resetPassword));

router.get("/userDashboard", protect, asyncHandler(getAdminDashboard)); 
router.get("/", protect, isAdmin, asyncHandler(getAllUsers));
router.post("/logout", protect, asyncHandler(logout));  
router.get("/profile", protect, asyncHandler(getProfile));  
router.put("/update-profile", protect, upload.single('profilePic'),asyncHandler(updateProfile));

export default router;