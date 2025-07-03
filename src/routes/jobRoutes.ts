import express from "express";
import { protect } from "../middlewares/authMiddleware";
import { isAdmin } from "../middlewares/isAdmin";
import { createJob, deleteJob, getAllJobs, getJobById, updateJob } from "../controllers/jobController";

const router = express.Router();

router.get("/", getAllJobs);          
router.get("/:id", getJobById);         

router.post("/", protect, isAdmin, createJob);    
router.put("/:id", protect, isAdmin, updateJob);  
router.delete("/:id", protect, isAdmin, deleteJob); 

export default router;
