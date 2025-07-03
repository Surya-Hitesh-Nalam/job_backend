import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/rounds/upload
export const uploadRoundResults = async (req: Request, res: Response) => {
  const { jobId, roundName, users, status } = req.body;

  try {
    const notFoundUsers: string[] = [];

    for (const userName of users) {
      const user = await prisma.user.findUnique({
        where: { userName: userName },
      });

      if (!user) {
        notFoundUsers.push(userName);
        continue;
      }

      await prisma.results.upsert({
        where: {
          userId_jobId_roundName: {
            userId: user.id,
            jobId,
            roundName,
          },
        },
        update: { status },
        create: {
          userId: user.id,
          jobId,
          roundId: "", // TODO: Provide the correct roundId value here
          roundName,
          status,
        },
      });
    }

    return res.json({
      message: "Round results recorded successfully.",
      skippedUsers: notFoundUsers.length > 0 ? notFoundUsers : undefined,
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return res
      .status(500)
      .json({ message: "Error uploading round results", error });
  }
};

// ✅ GET /api/rounds/user/:userId
export const getUserRoundResults = async (req: Request, res: Response) => {
  const userId = req.params.userId; // UUID string

  try {
    const results = await prisma.results.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { timestamp: "desc" },
    });

    res.json({ rounds: results });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user rounds", error });
  }
};

// ✅ GET /api/rounds/job/:jobId
export const getJobRoundSummary = async (req: Request, res: Response) => {
  const jobId = req.params.jobId; // UUID string

  try {
    const rounds = await prisma.results.findMany({
      where: { jobId },
      include: { user: true },
      orderBy: { roundName: "asc", timestamp: "desc" },
    });

    res.json({ rounds });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch job round summary", error });
  }
};
