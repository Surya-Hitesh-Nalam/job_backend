import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const uploadRoundResults = async (req: Request, res: Response) => {
  const { jobId, roundName, users, status } = req.body;

  try {
    const notFoundUsers: string[] = [];

    // ✅ Find the roundId based on jobId and roundName
    const round = await prisma.round.findFirst({
      where: {
        jobId,
        roundName,
      },
    });

    if (!round) {
      return res.status(400).json({ message: "Round not found for the given job and roundName" });
    }

    for (const username of users) {
      const user = await prisma.user.findUnique({
        where: { username: username },
      });

      if (!user) {
        notFoundUsers.push(username);
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
          roundId: round.id,
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
    return res.status(500).json({ message: "Error uploading round results", error });
  }
};


export const getUserRoundResults = async (req: Request, res: Response) => {
  const userId = req.params.userId; 

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

export const getJobRoundSummary = async (req: Request, res: Response) => {
  const jobId = req.params.jobId;

  try {
    const rounds = await prisma.results.findMany({
      where: { jobId },
      include: {
        user: true,
      },
      orderBy: [
        { roundName: "asc" },
        { timestamp: "desc" }
      ],
    });

    res.json({ rounds });
  } catch (error) {
    console.error("❌ Error fetching round summary:", error);
    res.status(500).json({ message: "Failed to fetch job round summary", error });
  }
};
