import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const uploadRoundResults = async (req: Request, res: Response) => {
  const { jobId, roundName, users, status } = req.body;

  try {
    for (const userId of users) {
      await prisma.roundResult.upsert({
        where: {
          userId_jobId_roundName: {
            userId,
            jobId,
            roundName,
          },
        },
        update: { status },
        create: { userId, jobId, roundName, status },
      });
    }

    res.json({ message: "Round results recorded successfully." });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ message: "Error uploading round results.", error });
  }
};

export const getUserRoundResults = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);

  try {
    const results = await prisma.roundResult.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { timestamp: "desc" },
    });

    res.json({ rounds: results });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user rounds", error });
  }
};

export const getJobRoundSummary = async (req: Request, res: Response) => {
  const jobId = Number(req.params.jobId);

  try {
    const rounds = await prisma.roundResult.findMany({
      where: { jobId },
      include: { user: true },
      orderBy: { roundName: "asc", timestamp: "desc" },
    });

    res.json({ rounds });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch job round summary", error });
  }
};
