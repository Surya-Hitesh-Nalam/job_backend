import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🟢 POST /api/apply/:jobId
export const applyToJob = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const jobId = req.params.jobId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const alreadyApplied = await prisma.jobApplication.findFirst({
      where: { userId, jobId },
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: "You already applied for this job" });
    }

    const application = await prisma.jobApplication.create({
      data: {
        user: { connect: { id: userId } },
        job: { connect: { id: jobId } },
        resume: user.resume || null,
        status: "Pending",
        currentRound: 1,
      },
    });

    return res.status(201).json({ message: "Application submitted", application });
  } catch (error) {
    console.error("❌ Application failed:", error);
    return res.status(500).json({ message: "Failed to apply", error });
  }
};

// 🟢 GET /api/applications
export const getMyApplications = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    const apps = await prisma.jobApplication.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { appliedAt: "desc" },
    });

    return res.json({ applications: apps });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch applications", error });
  }
};

export const getApplicationsForJob = async (req: Request, res: Response) => {
  const jobId = req.params.jobId;

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        user: true, // ✅ Includes all user fields
      },
      orderBy: { appliedAt: "desc" },
    });

    return res.json({ jobTitle: job.jobTitle, applications });
  } catch (error) {
    console.error("❌ Error fetching applications:", error);
    return res.status(500).json({ message: "Failed to fetch applications", error });
  }
};

