import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { 
  login, 
  logout, 
  requestPasswordOtp, 
  resetPassword, 
  signup, 
  updateProfile, 
  verifyEmail 
} from "../controllers/userController";

const router = express.Router();

// Wrapper functions to ensure proper typing
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/signup", asyncHandler(signup));
router.post("/verify-email", asyncHandler(verifyEmail));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.put("/update-profile", protect, asyncHandler(updateProfile));
router.post("/request-password-otp", asyncHandler(requestPasswordOtp));
router.post("/reset-password", asyncHandler(resetPassword));

export default router;